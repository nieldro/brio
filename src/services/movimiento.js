// Los pasos del podómetro, convertidos en lo único que Brío hace con ellos:
// una prueba más de que la persona se movió.
//
// LO QUE NO SON, Y ES LO IMPORTANTE
// Los pasos no son una métrica de Brío. No hay meta diaria, no hay barra que
// se llene ni se quede a medias, y no se convierten en calorías nunca. Un
// número que se puede fallar es un número que, en un mal día, hace cerrar la
// app: eso es justo lo que ya le pasó a quien la va a usar con otras cinco.
//
// Están del mismo lado que los "días en los que te moviste" de animo.js: algo
// que YA pasó y que nadie le puede quitar. Por eso el silencio es una
// respuesta válida y es la más usada. Si un día hay pocos pasos no se dice
// nada: ni "te faltaron", ni "hoy poco", ni un cero. Nada.
//
// Tampoco hay "tu mejor día" ni comparación con ayer. Un récord propio es una
// vara que uno mismo se pone, y la regla 6 pide evitar justo eso.

// Por debajo de esto no se muestra nada.
//
// No es una meta ni un mínimo que cumplir: es el punto en que el dato deja de
// hablar de la persona. Un teléfono que pasó la tarde en la mesa marca dos o
// tres cientos de pasos, y enseñar eso al lado de un mensaje cálido convierte
// la tarjeta en un marcador con mal puntaje.
export const PASOS_QUE_CUENTAN = 1200;

// Miles con punto, como se escriben acá. A mano y no con Intl: fecha.js ya
// explica por qué no es confiable en todos los Android de Expo Go.
export function pasosLegibles(n) {
  const entero = Math.max(0, Math.floor(Number(n) || 0));
  return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Tres tramos, y los tres afirman. No existe un cuarto que diga que faltó
// algo: para eso está no mostrar nada.
const FRASES = [
  { desde: 9000, frase: 'Caminaste bastante, y nadie te lo pidió.' },
  { desde: 5000, frase: 'Buen movimiento. Así, sin darte cuenta.' },
  { desde: PASOS_QUE_CUENTAN, frase: 'Te moviste. Eso ya cuenta.' },
];

export function fraseDePasos(pasos) {
  return FRASES.find((f) => pasos >= f.desde)?.frase ?? null;
}

const CALLADA = { visible: false, motivo: null, pasos: null, texto: null, detalle: null, frase: null };

// Lo que se pinta hoy a partir de una lectura de lib/pasos.js.
//
// `historico` dice si la cuenta es del día entero o solo de lo que lleva la
// app abierta. En Android el sistema no deja preguntar hacia atrás, así que
// muchas veces es lo segundo, y el texto no puede prometer un día completo
// que no midió. Se dice lo que se sabe y ya.
export function lecturaDeHoy({
  pasos = null,
  disponible = false,
  permiso = false,
  historico = false,
} = {}) {
  if (!disponible) return { ...CALLADA, motivo: 'sin-sensor' };
  if (!permiso) return { ...CALLADA, motivo: 'sin-permiso' };
  if (pasos === null || pasos === undefined || !Number.isFinite(Number(pasos))) {
    return { ...CALLADA, motivo: 'sin-lectura' };
  }

  const cuenta = Math.max(0, Math.floor(Number(pasos)));
  if (cuenta < PASOS_QUE_CUENTAN) return { ...CALLADA, motivo: 'callado' };

  return {
    visible: true,
    motivo: null,
    pasos: cuenta,
    texto: `${pasosLegibles(cuenta)} pasos`,
    detalle: historico ? 'hoy' : 'desde que abriste la app',
    frase: fraseDePasos(cuenta),
  };
}

// Por qué no hay nada que mostrar. Solo se usa donde la persona preguntó, en
// ajustes: en la pantalla de Hoy la tarjeta simplemente no aparece, porque
// explicar una ausencia es hablar de lo que no hizo.
const EXPLICACIONES = {
  'sin-sensor': 'Tu teléfono no cuenta pasos. Todo lo demás funciona igual.',
  'sin-permiso':
    'Sin permiso de actividad no puedo ver tus pasos. Lo puedes cambiar en los ajustes del teléfono cuando quieras.',
  'sin-lectura': 'Todavía no tengo la cuenta. Aparece sola cuando camines.',
  callado: 'Aquí van a aparecer tus pasos cuando salgas a caminar.',
};

export function explicacionDe(motivo) {
  return EXPLICACIONES[motivo] ?? null;
}

// --- La huella que queda --------------------------------------------------
//
// `porDia` es { '2026-08-19': 5400, ... }. Lo que se guarda es en cuántos días
// hubo caminata, no el total de pasos de la vida: un total que sube solo con
// el tiempo no dice nada de nadie, y un promedio invita a compararse consigo
// mismo, que es peor.

export function diasQueCaminaste(porDia = {}) {
  return Object.values(porDia).filter((p) => Number(p) >= PASOS_QUE_CUENTAN).length;
}

// Con la misma forma que las pruebas de animo.js, para que entre sin traducir
// en la pantalla del día difícil y en la de logros.
export function pruebaDeMovimiento(porDia = {}) {
  const dias = diasQueCaminaste(porDia);
  if (dias === 0) return null;

  return {
    clave: 'caminatas',
    cifra: dias,
    texto: dias === 1 ? 'día en el que saliste a caminar' : 'días en los que saliste a caminar',
  };
}
