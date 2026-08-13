// Rellena marcadores {clave} con los datos del usuario.
// Lo usan el onboarding y los mensajes del coach.
export function interpolar(texto, datos = {}) {
  if (!texto) return texto;
  return texto.replace(/\{(\w+)\}/g, (_, clave) => datos[clave] ?? '');
}
