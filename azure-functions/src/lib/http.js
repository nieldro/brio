// Respuestas HTTP uniformes. La app nunca recibe un detalle interno de error:
// solo un código y un mensaje corto, ya en la voz de Brío cuando toca.

export function json(status, cuerpo) {
  return {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    jsonBody: cuerpo,
  };
}

export const ok = (cuerpo) => json(200, cuerpo);
export const noAutorizado = () => json(401, { error: 'sesión no válida' });
export const malaPeticion = (detalle) => json(400, { error: detalle });
export const sinConfigurar = (faltan) =>
  json(503, { error: `faltan ajustes en la Function App: ${faltan.join(', ')}` });
export const falloIA = () => json(502, { error: 'el coach no está disponible ahora mismo' });

// Lee el cuerpo JSON sin reventar si viene vacío o malformado.
export async function cuerpoJson(request) {
  try {
    return (await request.json()) ?? {};
  } catch {
    return {};
  }
}
