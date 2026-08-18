import { config } from './config.js';

const RAIZ = 'https://generativelanguage.googleapis.com/v1beta/models';

// Códigos que significan "ahora no, vuelve a intentar": saturación o un
// tropiezo del lado de Google. La capa gratuita los devuelve seguido.
const TRANSITORIOS = new Set([429, 500, 502, 503, 504]);

const INTENTOS = 3;
const ESPERA_BASE_MS = 700;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function unaLlamada({ instruccion, historial, temperatura, timeoutMs }) {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), timeoutMs);

  try {
    const respuesta = await fetch(`${RAIZ}/${config.geminiModelo}:generateContent`, {
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
      const error = new Error(`Gemini respondió ${respuesta.status}: ${detalle.slice(0, 300)}`);
      error.estado = respuesta.status;
      error.transitorio = TRANSITORIOS.has(respuesta.status);
      throw error;
    }

    const cuerpo = await respuesta.json();
    const texto = cuerpo?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();

    if (!texto) throw new Error('Gemini devolvió una respuesta vacía');
    return texto;
  } finally {
    clearTimeout(corte);
  }
}

// Única puerta hacia el proveedor de IA. Cambiar de modelo o de proveedor
// se hace aquí, sin tocar las funciones (RNF-07, riesgo R3 del entregable).
//
// Reintenta sola ante errores transitorios, con espera creciente. Sin esto,
// un "high demand" de la capa gratuita dejaba al usuario sin plan en pleno
// onboarding: los dos intentos salían con dos segundos de diferencia y caían
// en el mismo bache.
export async function generar({
  instruccion,
  historial = [],
  temperatura = 0.7,
  timeoutMs = 20000,
  log,
}) {
  let ultimo;

  for (let intento = 1; intento <= INTENTOS; intento += 1) {
    try {
      return await unaLlamada({ instruccion, historial, temperatura, timeoutMs });
    } catch (e) {
      ultimo = e;
      if (!e.transitorio || intento === INTENTOS) throw e;

      // Espera creciente con algo de azar, para que varios usuarios que
      // fallaron a la vez no vuelvan a golpear todos en el mismo instante.
      const espera = ESPERA_BASE_MS * 2 ** (intento - 1) + Math.floor(Math.random() * 300);
      log?.warn?.(`Gemini ${e.estado}, reintento ${intento} de ${INTENTOS} en ${espera} ms`);
      await dormir(espera);
    }
  }

  throw ultimo;
}
