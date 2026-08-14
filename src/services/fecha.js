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

// Mapa { lunes: '2026-08-10', ... } de la semana en curso.
// La semana de Brío empieza el lunes, como el plan.
export function fechasDeLaSemana(fecha = new Date()) {
  const dia = fecha.getDay(); // 0 es domingo
  const alLunes = dia === 0 ? -6 : 1 - dia;

  const lunes = new Date(fecha);
  lunes.setDate(fecha.getDate() + alLunes);

  const nombres = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const salida = {};

  nombres.forEach((nombre, i) => {
    const f = new Date(lunes);
    f.setDate(lunes.getDate() + i);
    salida[nombre] = claveDia(f);
  });

  return salida;
}

// Clave del día anterior. Sirve para saber si la racha sigue viva.
export function claveAyer(fecha = new Date()) {
  const ayer = new Date(fecha);
  ayer.setDate(ayer.getDate() - 1);
  return claveDia(ayer);
}

// Zona horaria del teléfono ('America/Bogota'). El Timer Trigger la necesita
// para saber cuándo son las 7 de la mañana PARA EL USUARIO.
export function zonaDelTelefono() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function franjaDelDia(fecha = new Date()) {
  const h = fecha.getHours();
  if (h < 12) return 'manana';
  if (h < 19) return 'tarde';
  return 'noche';
}
