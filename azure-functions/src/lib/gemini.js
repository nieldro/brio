import { config } from './config.js';

const RAIZ = 'https://generativelanguage.googleapis.com/v1beta/models';

// Única puerta hacia el proveedor de IA. Cambiar de modelo o de proveedor
// se hace aquí, sin tocar las funciones (RNF-07, riesgo R3 del entregable).
export async function generar({ instruccion, historial = [], temperatura = 0.7, timeoutMs = 20000 }) {
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
      throw new Error(`Gemini respondió ${respuesta.status}: ${detalle.slice(0, 300)}`);
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
