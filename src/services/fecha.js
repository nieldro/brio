// Fechas en español, sin librerías. Intl no es confiable en todos los Android de Expo Go.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function nombreDia(fecha = new Date()) {
  return DIAS[fecha.getDay()];
}

// "miércoles 13 de agosto"
export function fechaLarga(fecha = new Date()) {
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

// Clave estable por día para los registros. "2026-08-13"
export function claveDia(fecha = new Date()) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function franjaDelDia(fecha = new Date()) {
  const h = fecha.getHours();
  if (h < 12) return 'manana';
  if (h < 19) return 'tarde';
  return 'noche';
}
