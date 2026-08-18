import { config } from './config.js';

const RAIZ = 'https://generativelanguage.googleapis.com/v1beta/models';

// "Ahora no, vuelve a intentar": saturación o un tropiezo del lado de Google.
// La capa gratuita los devuelve seguido.
const TRANSITORIOS = new Set([429, 500, 502, 503, 504]);

const INTENTOS_POR_MODELO = 2;
const ESPERA_BASE_MS = 700;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function unaLlamada(modelo, { instruccion, historial, temperatura, timeoutMs }) {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), timeoutMs);

  try {
    const respuesta = await fetch(`${RAIZ}/${modelo}:generateContent`, {
      method: 'POST',
      signal: control.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruccion }] },
        contents: historial.map((m) => ({
          role: m.rol === 'brio' ? 'model' : 'user',
          parts: [{ text: m.texto }],
        })),
        generationConfig: { temperature: temperatura },
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      const error = new Error(`${modelo} respondió ${respuesta.status}: ${detalle.slice(0, 200)}`);
      error.estado = respuesta.status;
      error.transitorio = TRANSITORIOS.has(respuesta.status);
      error.retirado = respuesta.status === 404;
      throw error;
    }

    const cuerpo = await respuesta.json();
    const texto = cuerpo?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();

    if (!texto) throw new Error(`${modelo} devolvió una respuesta vacía`);
    return texto;
  } finally {
    clearTimeout(corte);
  }
}

// Única puerta hacia el proveedor de IA. Cambiar de modelo o de proveedor se
// hace aquí, sin tocar las funciones (RNF-07, riesgo R3 del entregable).
//
// Tiene relevo entre modelos porque los dos modos de fallo son reales y
// distintos, y los dos se vieron en producción el mismo día:
//
//   404 retirado   Google deja de servir un modelo a las cuentas nuevas.
//                  No tiene sentido reintentar: se pasa al siguiente ya.
//   503 saturado   El modelo está a tope. Se reintenta con espera creciente
//                  y, si no cede, lo toma otro modelo de la lista.
//
// Con un solo modelo configurado, cualquiera de los dos casos dejaba al
// usuario sin plan en pleno onboarding.
export async function generar({
  instruccion,
  historial = [],
  temperatura = 0.7,
  timeoutMs = 20000,
  log,
}) {
  const modelos = config.geminiModelos;
  let ultimo;

  for (const modelo of modelos) {
    for (let intento = 1; intento <= INTENTOS_POR_MODELO; intento += 1) {
      try {
        const texto = await unaLlamada(modelo, {
          instruccion,
          historial,
          temperatura,
          timeoutMs,
        });
        if (modelo !== modelos[0]) log?.warn?.(`respondió el modelo de relevo ${modelo}`);
        return texto;
      } catch (e) {
        ultimo = e;

        if (e.retirado) {
          log?.warn?.(`${modelo} está retirado, paso al siguiente`);
          break;
        }
        if (!e.transitorio) throw e;
        if (intento === INTENTOS_POR_MODELO) {
          log?.warn?.(`${modelo} saturado, paso al siguiente`);
          break;
        }

        // Espera creciente con algo de azar, para que varios usuarios que
        // fallaron a la vez no vuelvan a golpear en el mismo instante.
        const espera = ESPERA_BASE_MS * 2 ** (intento - 1) + Math.floor(Math.random() * 300);
        log?.warn?.(`${modelo} dio ${e.estado}, reintento en ${espera} ms`);
        await dormir(espera);
      }
    }
  }

  throw ultimo ?? new Error('ningún modelo de Gemini respondió');
}
