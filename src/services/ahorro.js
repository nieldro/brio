import { claveDia, sumarDias, fechaLargaDeClave } from './fecha.js';
import { gastoTipico, formatoMonto } from './hormiga.js';

// El reto de ahorro, atado a los días que la persona cumple.
//
// LA IDEA
// El mismo día que se mueve, aparta algo pequeño. Es la costura entre las dos
// mitades de Brío: la disciplina del cuerpo y la del dinero se sostienen la
// una a la otra, y ninguna de las dos se construye de golpe.
//
// LA REGLA QUE NO SE TOCA
// Romper la racha NO borra lo apartado. Nunca. Lo apartado es trabajo hecho, y
// quitarlo sería un castigo esperando su turno, exactamente lo que este
// producto no hace. Por eso lo apartado no se calcula desde la racha, sino
// desde los días marcados: un hueco no resta, simplemente no suma.
//
// POR QUÉ TRAMOS Y NO UN SOLO MONTO
// Si el total se recalculara con el monto de hoy, bajar la cantidad encogería
// lo que ya se había apartado. Alguien que aparta menos porque el mes viene
// duro vería su total caer, y eso se lee como un castigo por tener menos.
// Cada cambio abre un tramo nuevo y el pasado queda como estaba.
//
// LO QUE ESTO NO ES
// No hay intereses, no hay rentabilidad, no hay proyecciones y no hay una
// moneda de la app. Es dinero suyo, en su moneda, guardado donde él quiera.

export { formatoMonto };

// tramo: { desde: '2026-08-19', hasta: null | '2026-09-01', monto: 2000 }
//
// No hay bandera `activo`: el reto está encendido si hay un tramo abierto.
// Dos fuentes de verdad para el mismo hecho siempre terminan discrepando.
export const RETO_INICIAL = { tramos: [] };

// La escalera de arranque, solo para quien todavía no ha apuntado un gasto.
// Con datos suyos, las cantidades salen de su vida y no de esta lista.
export const ESCALERA_BASE = [1000, 2000, 5000];

// Qué parte de su gasto típico se propone apartar. Pequeñas a propósito:
// "poco y constante gana siempre" también vale para el dinero, y una cantidad
// que se siente cada día se abandona en dos semanas.
const FRACCIONES = [0.05, 0.1, 0.25];

const tramosDe = (reto) => (Array.isArray(reto?.tramos) ? reto.tramos : []);

export const tramoAbierto = (reto) => tramosDe(reto).find((t) => !t.hasta) ?? null;

export const estaActivo = (reto) => tramoAbierto(reto) !== null;

// Lo que aparta hoy por día. 0 si el reto está en pausa.
export const montoActual = (reto) => tramoAbierto(reto)?.monto ?? 0;

// ¿La cantidad nueva todavía no empezó? Pasa al cambiarla un día que ya contó:
// lo de hoy quedó apartado con la cantidad de antes y lo nuevo rige mañana.
// La pantalla lo dice, porque una cifra sin explicación se lee como un error.
export function rigeDesdeManana(reto, hoy = new Date()) {
  const abierto = tramoAbierto(reto);
  return !!abierto && abierto.desde > claveDia(hoy);
}

// El último monto que usó, aunque esté en pausa: al reanudar no hay que
// volver a preguntarle algo que ya contestó.
export function ultimoMonto(reto) {
  const tramos = tramosDe(reto);
  return tramos.length ? tramos[tramos.length - 1].monto : 0;
}

export function primerDia(reto) {
  const tramos = tramosDe(reto);
  return tramos.length ? tramos[0].desde : null;
}

const cantidadValida = (monto) => {
  const n = Math.round(Number(monto));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// Desde qué día puede regir un monto nuevo.
//
// Nunca desde un día que YA contó. Si hoy se marcó y se apartó, ese día vale
// lo que valía cuando pasó: volver a calcularlo con la cantidad nueva mueve un
// total que la persona ya vio en pantalla, y hacia abajo si la cantidad nueva
// es menor. Bajar la cantidad porque el mes viene duro no puede costarle
// dinero ya apartado. Cuando hoy ya contó, lo nuevo arranca mañana.
function desdeCuandoRige(reto, diasCompletados, hoy) {
  const clave = claveDia(hoy);
  return apartadoHoy(diasCompletados, reto, hoy) ? sumarDias(clave, 1) : clave;
}

// Deja la lista lista para que un tramo nuevo empiece en `inicio`.
//
// Todo lo anterior a `inicio` se conserva tal cual: ahí está lo ya apartado, y
// eso no se recalcula nunca. Lo que llegaba hasta `inicio` o más allá se
// recorta a la víspera, porque dos tramos cubriendo el mismo día se cobran con
// el monto VIEJO —`tramoDelDia` se queda con el primero que encuentra— mientras
// la tarjeta anuncia el nuevo: la cifra contradiciendo a su explicación.
//
// Un tramo que después del recorte no cubre ningún día desaparece: empezó en
// `inicio` o después, así que no alcanzó a contar nada.
function cerrarAntesDe(tramos, inicio) {
  const ayer = sumarDias(inicio, -1);

  return tramos
    .map((t) => (t.hasta && t.hasta < inicio ? t : { ...t, hasta: ayer }))
    .filter((t) => t.desde <= t.hasta);
}

// Cuánto aparta de aquí en adelante. Sirve para empezar y para cambiar de idea.
// El pasado no se toca: lo apartado con el monto viejo sigue contando igual.
//
// Los días marcados entran para saber si hoy ya contó. Sin ese dato, cambiar
// la cantidad un día que ya se apartó reescribía ese día.
export function fijarMonto(
  reto = RETO_INICIAL,
  monto,
  hoy = new Date(),
  diasCompletados = [],
) {
  const cantidad = cantidadValida(monto);
  if (!cantidad) return reto ?? RETO_INICIAL;

  const inicio = desdeCuandoRige(reto, diasCompletados, hoy);

  return {
    ...reto,
    tramos: [
      ...cerrarAntesDe(tramosDe(reto), inicio),
      { desde: inicio, hasta: null, monto: cantidad },
    ],
  };
}

// Pausar no borra nada: cierra el tramo y ya. Y lo cierra HOY, no ayer, para
// que un día que ya se marcó y ya se vio sumado no desaparezca de la pantalla
// al pausar.
export function pausar(reto = RETO_INICIAL, hoy = new Date()) {
  const clave = claveDia(hoy);

  return {
    ...reto,
    tramos: tramosDe(reto)
      .map((t) => (t.hasta ? t : { ...t, hasta: clave }))
      // Un tramo que empieza mañana —el que se abre al cambiar la cantidad un
      // día que ya contó— no deja nada al pausar hoy: se cae, en vez de quedar
      // guardado al revés, con el final antes del principio. Al volver se
      // recuerda la cantidad que llegó a regir, que es la que sí existió.
      .filter((t) => t.desde <= t.hasta),
  };
}

export function reanudar(reto = RETO_INICIAL, hoy = new Date(), monto, diasCompletados = []) {
  return fijarMonto(reto, cantidadValida(monto) || ultimoMonto(reto), hoy, diasCompletados);
}

// El tramo al que pertenece un día, o null si ese día el reto no estaba en pie.
function tramoDelDia(reto, clave) {
  return (
    tramosDe(reto).find((t) => t.desde <= clave && (!t.hasta || clave <= t.hasta)) ?? null
  );
}

// Lo apartado hasta hoy: cuántos días y cuánto.
//
// Se recorre la lista de días marcados, no la racha. Por eso un hueco de tres
// semanas no cambia el total: los días que sí se hicieron siguen ahí.
export function loAhorrado(diasCompletados = [], reto = RETO_INICIAL) {
  let dias = 0;
  let total = 0;

  for (const clave of new Set(diasCompletados)) {
    const tramo = tramoDelDia(reto, clave);
    if (!tramo) continue;
    dias += 1;
    total += tramo.monto;
  }

  return { dias, total };
}

export function apartadoHoy(diasCompletados = [], reto = RETO_INICIAL, hoy = new Date()) {
  const clave = claveDia(hoy);
  return diasCompletados.includes(clave) && tramoDelDia(reto, clave) !== null;
}

// --- Cuánto proponerle ----------------------------------------------------

// Redondea a una cantidad que se pueda decir en voz alta: 500, 2.000, 5.000.
function aNumeroRedondo(n) {
  if (!(n > 0)) return 0;

  const magnitud = 10 ** Math.floor(Math.log10(n));
  const candidatos = [magnitud, 2 * magnitud, 5 * magnitud, 10 * magnitud];

  return candidatos.reduce((mejor, c) => (Math.abs(c - n) < Math.abs(mejor - n) ? c : mejor));
}

// Las cantidades que se le proponen salen de SU gasto típico, no de un número
// inventado en un escritorio: pequeño para quien gasta en miles y pequeño para
// quien gasta en millones. Y siempre se puede escribir otra: la cantidad la
// elige la persona, esto solo evita la pantalla en blanco.
export function montosSugeridos(gastos = []) {
  const tipico = gastoTipico(gastos);
  if (!(tipico > 0)) return ESCALERA_BASE;

  const salida = FRACCIONES.map((f) => aNumeroRedondo(tipico * f)).filter((m) => m > 0);
  return [...new Set(salida)].sort((a, b) => a - b);
}

// --- Los hitos ------------------------------------------------------------

// Se cuentan por DÍAS apartados y nunca por cantidad.
//
// Un hito de "50.000 apartados" no mide el trabajo de la persona, mide cuánto
// dinero tiene: quien aparta 500 al día no llegaría nunca y quien aparta
// 20.000 lo tendría en tres días sin haber hecho nada distinto. Los días son
// lo que ambos hacen igual.
//
// Y como las insignias: una vez ganado no se pierde. Si se pudiera perder
// sería un castigo esperando.
export const HITOS = [
  {
    clave: 'aparte-1',
    titulo: 'El primero',
    texto: 'Apartaste por primera vez. Ya dejó de ser una idea.',
    meta: 1,
  },
  {
    clave: 'aparte-7',
    titulo: 'Siete veces',
    texto: 'Siete días moviéndote y apartando. Las dos cosas, el mismo día.',
    meta: 7,
  },
  {
    clave: 'aparte-30',
    titulo: 'Treinta veces',
    texto: 'Treinta días. Esto ya no es un intento, es algo que haces.',
    meta: 30,
  },
  {
    clave: 'aparte-100',
    titulo: 'Cien veces',
    texto: 'Cien días sosteniendo dos costumbres a la vez. Eso es carácter.',
    meta: 100,
  },
];

export function estadoDeHitos(dias = 0) {
  return HITOS.map((h) => ({
    ...h,
    valor: dias,
    ganado: dias >= h.meta,
    fraccion: Math.min(1, h.meta > 0 ? dias / h.meta : 0),
  }));
}

export function hitosRecienGanados(diasAntes = 0, diasAhora = 0) {
  return HITOS.filter((h) => diasAhora >= h.meta && diasAntes < h.meta);
}

// --- Lo que se lee en pantalla --------------------------------------------

export function textoDeLoApartado({ dias, total }) {
  if (dias === 0) return 'Todavía no hay nada apartado. Empieza cuando quieras.';
  if (dias === 1) return `Un día apartado. Van ${formatoMonto(total)}.`;
  return `${dias} días apartados. Van ${formatoMonto(total)}.`;
}

// La frase corta de Brío bajo el título. Dos frases como mucho, sin culpa y
// sin prisa.
//
// El caso de la racha rota es el que justifica todo el módulo: es justo
// cuando otras apps ponen un cero en rojo. Aquí se dice lo contrario, y se
// dice primero.
export function mensajeDelReto({
  activo = false,
  dias = 0,
  hoyApartado = false,
  rota = false,
  nombre = '',
} = {}) {
  // Sin nombre, la frase tiene que empezar en mayúscula igual. Pegar el
  // nombre delante y ya dejaba "lo que apartaste sigue aquí" con minúscula
  // suelta, que se lee como una app a medio hacer.
  const conNombre = (frase) => {
    const quien = nombre?.trim();
    return quien ? `${quien}, ${frase}` : frase.charAt(0).toUpperCase() + frase.slice(1);
  };

  if (!activo && dias === 0) {
    return conNombre('aparta algo pequeño el mismo día que te mueves. Tú eliges cuánto.');
  }

  if (!activo) return 'El reto está en pausa y lo apartado sigue aquí. Vuelve cuando quieras.';

  // Antes de hablar de la racha rota hay que mirar si hay algo apartado. Sin
  // días, "lo que apartaste sigue aquí" contradice a la tarjeta de al lado,
  // que dice que todavía no hay nada. Y el camino es de lo más corriente:
  // quien vuelve tras un lapso abre esta pantalla y toca "Empezar".
  if (dias === 0) return 'Cuando marques tu primer día, se aparta lo primero.';

  if (rota) return conNombre('lo que apartaste sigue aquí. Eso no se devuelve por parar unos días.');

  if (hoyApartado) return 'Hoy ya está apartado. Se suma solo cuando marcas tu día.';

  return 'Cuando marques el día de hoy, se suma. Sin prisa.';
}

// Desde cuándo viene esto, para la tarjeta del total.
export function textoDesdeCuando(reto) {
  const desde = primerDia(reto);
  return desde ? `Desde el ${fechaLargaDeClave(desde)}.` : null;
}

// La cantidad nueva se enseña siempre; cuando empieza mañana hay que decirlo,
// o parece que la cifra de la tarjeta no le hizo caso a lo que acaba de elegir.
export function textoDeCuandoRige(reto, hoy = new Date()) {
  if (!rigeDesdeManana(reto, hoy)) return null;
  return 'Empieza mañana. Lo de hoy ya quedó apartado con la cantidad de antes.';
}

// Todo lo que la pantalla necesita, de una vez.
export function resumenDeAhorro(diasCompletados = [], reto = RETO_INICIAL, hoy = new Date()) {
  const { dias, total } = loAhorrado(diasCompletados, reto);

  return {
    activo: estaActivo(reto),
    monto: montoActual(reto),
    ultimoMonto: ultimoMonto(reto),
    desde: primerDia(reto),
    dias,
    total,
    hoyApartado: apartadoHoy(diasCompletados, reto, hoy),
    hitos: estadoDeHitos(dias),
  };
}
