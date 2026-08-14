// Fechas sin dependencias, para poder probarlas solas.
//
// El servidor vive en UTC. Un usuario en Bogotá a las 8 p. m. ya sería
// "mañana" para el servidor, así que la app manda su fecha local y aquí
// solo se valida y se opera sobre ella.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function fechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto ?? '')) return null;
  const [a, m, d] = texto.split('-').map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  // Rechaza cosas como 2026-02-31, que Date acomodaría en silencio.
  const real = t.getUTCFullYear() === a && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
  return real ? texto : null;
}

export function hoyUtc() {
  return new Date().toISOString().slice(0, 10);
}

export function diaDeLaSemana(fecha) {
  const [a, m, d] = fecha.split('-').map(Number);
  return DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
}

export function restarDias(fecha, dias) {
  const [a, m, d] = fecha.split('-').map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  t.setUTCDate(t.getUTCDate() - dias);
  return t.toISOString().slice(0, 10);
}
