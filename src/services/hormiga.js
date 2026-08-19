import { claveDia, diasEntreClaves } from './fecha.js';

// Lo pequeño y repetido, y lo que se cobra solo.
//
// QUÉ ES ESTO Y QUÉ NO ES
// Encuentra dos cosas: los gastos chicos que se repiten hasta sumar sin que
// se noten, y los cobros que caen cada mes. Nada más. No dice qué quitar, no
// califica y no proyecta: informa a dónde se fue el dinero, en pasado, y ahí
// se acaba su trabajo.
//
// POR QUÉ IMPORTA EL TONO AQUÍ MÁS QUE EN NINGÚN LADO
// El dinero avergüenza más que la comida. "Gastos hormiga" es un término que
// en cualquier otra app viene con un dedo señalando; aquí es solo un dato.
// Por eso ninguno de los textos de abajo lleva adjetivos, ni verbos en
// imperativo, ni comparaciones con nadie.
//
// LA DISCIPLINA DE LA EVIDENCIA
// Igual que en adaptacion.js: con dos apariciones no hay patrón, hay
// casualidad. Señalar un patrón que no existe es peor que callarse, porque
// quien lo lee se lo cree. Devolver "no encontré nada" es una respuesta
// correcta y aquí se devuelve a menudo.

// Menos gastos que esto no son un historial, son cuatro apuntes sueltos.
export const MINIMO_GASTOS = 12;

// Días DISTINTOS en los que tiene que aparecer algo para llamarlo repetido.
// Con dos no hay patrón y con tres tampoco: cuatro ya es una costumbre.
export const MINIMO_APARICIONES = 4;

// Cobros mensuales seguidos para poder decir que algo es una suscripción.
export const MINIMO_COBROS = 3;

// "Pequeño" no es un número inventado: es pequeño RESPECTO A LO SUYO.
//
// Un umbral fijo trataría igual a quien gasta en miles y a quien gasta en
// millones, y encima envejecería con la inflación. Se toma la mitad de su
// gasto típico, medido con la mediana y no con el promedio: un arriendo
// arrastra el promedio y deja de haber gastos "pequeños".
export const FRACCION_PEQUENO = 0.5;

// Un cobro fijo puede moverse un poco (impuestos, cambio de tarifa) y sigue
// siendo el mismo cobro.
export const TOLERANCIA_MONTO = 0.15;

// "Más o menos cada mes". Ancho a propósito: los cobros caen en día hábil.
const MIN_DIAS_MES = 24;
const MAX_DIAS_MES = 38;

export const VENTANA_HORMIGA = 60;
// Para ver tres cobros mensuales hacen falta al menos tres meses de historia.
export const VENTANA_SUSCRIPCION = 150;

// Cuántos hallazgos se muestran. Una lista larga se lee como una lista de
// reproches, por muy neutral que sea cada línea.
export const MAXIMO_HALLAZGOS = 3;

// Los títulos de las secciones viven aquí, con las reglas, y no en la
// pantalla: son la parte que más fácil se tuerce hacia el reproche.
export const TITULO_HORMIGAS = 'A dónde se fue lo pequeño';
export const TITULO_SUSCRIPCIONES = 'Lo que se cobra solo';

const limpio = (texto) => String(texto ?? '').trim();

const sinTildes = (texto) =>
  limpio(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Dos gastos son "lo mismo" cuando la persona los llamó igual. Su nota manda
// sobre la categoría: quien escribió "café" está distinguiendo algo que
// 'antojos' no distingue.
export const claveDeGasto = (g) => sinTildes(g?.nota) || sinTildes(g?.categoria) || 'otros';

// La etiqueta se muestra tal como la escribió la persona. Sus palabras pesan
// más que cualquier nombre que le pongamos nosotros.
export function etiquetaDeGasto(g) {
  const nota = limpio(g?.nota);
  if (nota) return nota;
  const cat = limpio(g?.categoria) || 'otros';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export function mediana(numeros = []) {
  const orden = numeros.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!orden.length) return 0;
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
}

// Lo que le cuesta normalmente una cosa, en un solo número.
//
// Dos decisiones, y las dos importan:
//
// Mediana y no promedio, porque el mes en que pagó la matrícula no puede
// mover la vara de todo lo demás.
//
// Un voto por COSA distinta y no por compra, que es lo que casi se me escapa:
// contando compras, los gastos pequeños y repetidos —justo los que se
// buscan— arrastran la mediana hasta su propio precio y dejan de ser
// "pequeños" por ser muchos. Nueve cafés no son nueve gastos distintos, son
// el café.
export function gastoTipico(gastos = []) {
  const porClave = new Map();

  for (const g of gastos) {
    const clave = claveDeGasto(g);
    if (!porClave.has(clave)) porClave.set(clave, []);
    porClave.get(clave).push(Number(g?.monto));
  }

  return mediana([...porClave.values()].map((montos) => mediana(montos)));
}

export const umbralPequeno = (gastos = []) => gastoTipico(gastos) * FRACCION_PEQUENO;

export function enVentana(gastos = [], hoy = new Date(), ventana = VENTANA_HORMIGA) {
  const clave = claveDia(hoy);
  return gastos.filter((g) => {
    if (!g?.fecha) return false;
    const atras = diasEntreClaves(g.fecha, clave);
    return atras >= 0 && atras < ventana;
  });
}

function agrupar(gastos = []) {
  const grupos = new Map();

  for (const g of gastos) {
    const clave = claveDeGasto(g);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(g);
  }

  return grupos;
}

// --- Lo pequeño y repetido ------------------------------------------------

// Los gastos chicos que se repiten, ordenados por lo que sumaron.
//
// Devuelve lista vacía muchas veces, y está bien: sin historial suficiente o
// sin repeticiones de verdad, aquí no hay nada que contar.
export function hormigas(gastos = [], hoy = new Date(), ventana = VENTANA_HORMIGA) {
  const dentro = enVentana(gastos, hoy, ventana);
  if (dentro.length < MINIMO_GASTOS) return [];

  const umbral = umbralPequeno(dentro);
  if (!(umbral > 0)) return [];

  // Lo que la persona marcó como cobro fijo no es una hormiga: es una
  // suscripción, y se cuenta en su propia sección para no decir dos veces lo
  // mismo con dos nombres distintos.
  const pequenos = dentro.filter((g) => !g?.recurrente && Number(g?.monto) <= umbral);

  const salida = [];

  for (const [clave, lista] of agrupar(pequenos)) {
    const dias = new Set(lista.map((g) => g.fecha));
    if (dias.size < MINIMO_APARICIONES) continue;

    const montos = lista.map((g) => Number(g.monto) || 0);
    const total = montos.reduce((a, b) => a + b, 0);
    const fechas = [...dias].sort();

    salida.push({
      clave,
      etiqueta: etiquetaDeGasto(lista[lista.length - 1]),
      categoria: lista[lista.length - 1]?.categoria ?? 'otros',
      veces: lista.length,
      dias: dias.size,
      total,
      promedio: Math.round(total / lista.length),
      desde: fechas[0],
      hasta: fechas[fechas.length - 1],
      ventana,
    });
  }

  return salida.sort((a, b) => b.total - a.total);
}

// --- Lo que se cobra solo -------------------------------------------------

// La racha más larga de cobros separados más o menos un mes.
//
// Se mira la racha más larga y no todos los saltos porque un mes sin apuntar
// parte la cadena, y exigir la cadena entera perfecta perdía cobros que sí
// existen.
//
// Aun así hacen falta MINIMO_COBROS seguidos, y eso deja fuera algún cobro
// real con dos huecos. Es el error que se prefiere: callarse. Quien lo sepa
// puede marcarlo como recurrente y se le cree de una.
function rachaMensual(fechas = []) {
  if (!fechas.length) return 0;

  let mejor = 1;
  let actual = 1;

  for (let i = 1; i < fechas.length; i += 1) {
    const salto = diasEntreClaves(fechas[i - 1], fechas[i]);
    actual = salto >= MIN_DIAS_MES && salto <= MAX_DIAS_MES ? actual + 1 : 1;
    if (actual > mejor) mejor = actual;
  }

  return mejor;
}

const montosParecidos = (montos = []) => {
  const centro = mediana(montos);
  if (!(centro > 0)) return false;
  return montos.every((m) => Math.abs(m - centro) <= centro * TOLERANCIA_MONTO);
};

// Los cobros que se repiten cada mes con la misma cantidad.
//
// Dos caminos: lo que la persona marcó como recurrente (ahí no hay nada que
// adivinar, lo dijo) y lo que se deduce de los cobros. Lo deducido exige tres
// meses porque con dos cobros no hay periodicidad: hay dos cobros.
export function suscripciones(gastos = [], hoy = new Date(), ventana = VENTANA_SUSCRIPCION) {
  const dentro = enVentana(gastos, hoy, ventana);
  const salida = [];

  for (const [clave, lista] of agrupar(dentro)) {
    const fechas = [...new Set(lista.map((g) => g.fecha))].sort();
    const montos = lista.map((g) => Number(g.monto) || 0);
    const ultimo = lista[lista.length - 1];
    const declarada = lista.some((g) => g?.recurrente);

    const detectada =
      !declarada && rachaMensual(fechas) >= MINIMO_COBROS && montosParecidos(montos);

    if (!declarada && !detectada) continue;

    salida.push({
      clave,
      etiqueta: etiquetaDeGasto(ultimo),
      categoria: ultimo?.categoria ?? 'suscripciones',
      monto: Math.round(mediana(montos)),
      veces: lista.length,
      declarada,
      desde: fechas[0],
      hasta: fechas[fechas.length - 1],
    });
  }

  return salida.sort((a, b) => b.monto - a.monto);
}

// --- Lo que se le dice a la persona ---------------------------------------

// Separador de miles a la latinoamericana, sin decimales y sin Intl, que no
// es de fiar en todos los Android de Expo Go.
export function formatoMonto(valor) {
  const entero = Math.round(Math.abs(Number(valor) || 0));
  return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// El texto de una hormiga: cuántas veces pasó y cuánto sumó. Nada más.
//
// Ni un adjetivo, ni un verbo en imperativo, ni una comparación. Decir
// "podrías ahorrarte eso" convierte un dato en una orden, y esta app informa.
export function textoDeHormiga(h) {
  const cuando =
    h.veces === h.dias
      ? `${h.veces} veces en los últimos ${h.ventana} días`
      : `${h.veces} veces repartidas en ${h.dias} días`;

  return `${cuando}. En total fueron ${formatoMonto(h.total)}.`;
}

export function textoDeSuscripcion(s) {
  if (s.declarada) return `Lo marcaste como cobro fijo. Cada vez son ${formatoMonto(s.monto)}.`;
  return `Se repitió ${s.veces} veces, más o menos una por mes, de ${formatoMonto(s.monto)}.`;
}

// Nunca se reclama por no haber registrado. Quien lleva una semana sin apuntar
// nada no necesita que una app se lo recuerde.
export function textoSinHallazgos(suficiente) {
  if (!suficiente) return 'Todavía hay poco apuntado para ver un patrón. No corre prisa.';
  return 'Miré lo que llevas apuntado y no hay nada pequeño que se repita.';
}

// Todo junto, que es lo que pide una pantalla.
export function analizarGastos(gastos = [], hoy = new Date()) {
  const dentro = enVentana(gastos, hoy, VENTANA_HORMIGA);

  return {
    suficiente: dentro.length >= MINIMO_GASTOS,
    hormigas: hormigas(gastos, hoy),
    suscripciones: suscripciones(gastos, hoy),
  };
}

// Los hallazgos ya escritos, listos para pintar. Vienen recortados: una lista
// larga se lee como una lista de reproches por muy neutral que sea cada línea.
export function hallazgosDeGasto(gastos = [], hoy = new Date()) {
  const analisis = analizarGastos(gastos, hoy);

  const deHormigas = analisis.hormigas.slice(0, MAXIMO_HALLAZGOS).map((h) => ({
    clave: `hormiga-${h.clave}`,
    grupo: 'hormigas',
    titulo: h.etiqueta,
    texto: textoDeHormiga(h),
  }));

  const deCobros = analisis.suscripciones.slice(0, MAXIMO_HALLAZGOS).map((s) => ({
    clave: `cobro-${s.clave}`,
    grupo: 'suscripciones',
    titulo: s.etiqueta,
    texto: textoDeSuscripcion(s),
  }));

  return [...deHormigas, ...deCobros];
}
