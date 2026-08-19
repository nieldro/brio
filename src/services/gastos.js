import { claveDia } from './fecha.js';

// Los gastos de Brío. Reglas puras: sin React, sin red y sin IA.
//
// POR QUÉ ESTO NO LO HACE UN MODELO
// Entender "almuerzo 12 mil" es un problema de reglas, no de inteligencia.
// Resolverlo aquí lo vuelve reproducible (la misma frase da siempre lo mismo),
// gratis, instantáneo y funciona en un bus sin señal. La IA se guarda para lo
// que sí la necesita: leer una factura con la cámara.
//
// EL TONO, QUE AQUÍ IMPORTA MÁS QUE EN CUALQUIER OTRO MÓDULO
// El dinero avergüenza más que la comida. Nada de lo que sale de este archivo
// califica un gasto, ni dice en qué no gastar, ni proyecta deudas. Se anota lo
// que pasó, se suma y ya. Un gasto no es una falta.

export const CATEGORIAS = [
  { clave: 'mercado', titulo: 'Mercado y comida' },
  { clave: 'transporte', titulo: 'Transporte' },
  { clave: 'casa', titulo: 'Casa y servicios' },
  { clave: 'salud', titulo: 'Salud' },
  { clave: 'ocio', titulo: 'Ocio' },
  { clave: 'antojos', titulo: 'Antojos' },
  { clave: 'suscripciones', titulo: 'Suscripciones' },
  { clave: 'otros', titulo: 'Otros' },
];

export const CLAVES_CATEGORIA = CATEGORIAS.map((c) => c.clave);

export const tituloDeCategoria = (clave) =>
  CATEGORIAS.find((c) => c.clave === clave)?.titulo ?? 'Otros';

// Por debajo de esto no se acepta un monto. En pesos colombianos no existe un
// gasto de tres pesos: si sale un número tan chico es que se leyó mal ("un
// almuerzo" no es un peso), y preguntar es mejor que anotar basura.
export const MINIMO = 100;

// --- Leer un monto escrito a mano -----------------------------------------
//
// La gente no escribe "12500". Escribe "12 mil", "12k", "$12.000", "doce mil"
// o "12 lucas". Todas esas formas son la misma plata y todas tienen que
// entrar, porque el día que hay que pelear con el teclado para anotar algo,
// se deja de anotar.

const sinTildes = (t) =>
  String(t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// "Luca", "barra" y "palo" no son adorno: es como se dice la plata en la calle
// en Colombia, y quien escribe rápido escribe así.
const ESCALA = {
  mil: 1000,
  miles: 1000,
  luca: 1000,
  lucas: 1000,
  barra: 1000,
  barras: 1000,
  palo: 1_000_000,
  palos: 1_000_000,
  millon: 1_000_000,
  millones: 1_000_000,
};

// La "k" solo existe pegada a un dígito ("12k"), nunca escrita en letras.
const MULTIPLO = { ...ESCALA, k: 1000 };

const UNIDADES = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
  ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20,
  veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
  veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
};

const DECENAS = {
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90,
};

const CENTENAS = {
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400,
  quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};

const CIFRA =
  /(\$\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(k\b|mil(?:es)?\b|lucas?\b|barras?\b|palos?\b|millon(?:es)?\b)?/g;

// "12.000" son doce mil, no doce coma cero. En Colombia el punto separa miles
// y la coma decimales, así que solo cuenta como separador cuando parte el
// número en grupos exactos de tres.
const tieneMiles = (bruto) => /^\d{1,3}([.,]\d{3})+$/.test(bruto);

function valorNumerico(bruto) {
  if (tieneMiles(bruto)) return Number(bruto.replace(/[.,]/g, ''));
  return Number(bruto.replace(',', '.'));
}

// Un número escrito en letras, leído desde una posición exacta. Devuelve
// también dónde terminó, para poder seguir buscando después de él.
function leerEnLetras(tokens, inicio) {
  let total = 0;
  let parcial = 0;
  let hasta = inicio;
  let visto = false;

  for (let i = inicio; i < tokens.length; i += 1) {
    const t = tokens[i];

    if (t === 'y' && visto) continue;

    if (t in UNIDADES) parcial += UNIDADES[t];
    else if (t in DECENAS) parcial += DECENAS[t];
    else if (t in CENTENAS) parcial += CENTENAS[t];
    else if (t in ESCALA) {
      // "mil" sin nada delante es mil, no cero: "mil de bus" se entiende solo.
      parcial = (parcial || 1) * ESCALA[t];
      total += parcial;
      parcial = 0;
    } else break;

    visto = true;
    hasta = i + 1;
  }

  return { valor: total + parcial, hasta: visto ? hasta : inicio };
}

const enTokens = (limpio) => limpio.split(/[^a-z]+/).filter(Boolean);

// Todos los números que aparecen en la frase, con una marca: `explicito` es
// el que trae señal de plata ($, separador de miles o un multiplicador). Sin
// esa marca, "2 tintos 6 mil" se registraría como dos pesos.
function candidatos(limpio) {
  const salida = [];

  CIFRA.lastIndex = 0;
  for (let m = CIFRA.exec(limpio); m; m = CIFRA.exec(limpio)) {
    const multiplicador = m[3] ? MULTIPLO[m[3]] ?? 1 : 1;
    let valor = valorNumerico(m[2]) * multiplicador;

    // "12 mil quinientos": lo que sigue al multiplicador y es más pequeño que
    // él es parte del mismo número, no otro gasto.
    if (multiplicador >= 1000) {
      const resto = leerEnLetras(enTokens(limpio.slice(m.index + m[0].length)), 0).valor;
      if (resto > 0 && resto < multiplicador) valor += resto;
    }

    salida.push({
      valor,
      explicito: Boolean(m[1] || m[3] || tieneMiles(m[2])),
    });
  }

  const tokens = enTokens(limpio);
  for (let i = 0; i < tokens.length; ) {
    const { valor, hasta } = leerEnLetras(tokens, i);
    if (valor > 0 && hasta > i) {
      // "un almuerzo" no es un peso: un número en letras solo es plata cuando
      // llega a una cifra que alguien pagaría.
      salida.push({ valor, explicito: valor >= MINIMO });
      i = hasta;
    } else i += 1;
  }

  return salida;
}

export function montoDeTexto(texto) {
  const lista = candidatos(sinTildes(texto));
  if (!lista.length) return null;

  const explicitos = lista.filter((c) => c.explicito);
  const mirar = explicitos.length ? explicitos : lista;

  return Math.round(mirar.reduce((a, b) => (b.valor > a.valor ? b : a)).valor);
}

// --- Adivinar la categoría ------------------------------------------------

const PALABRAS = {
  mercado: [
    'mercado', 'supermercado', 'tienda', 'plaza', 'fruver', 'carne', 'carniceria',
    'verdura', 'verduras', 'fruta', 'frutas', 'huevos', 'pan', 'panaderia', 'leche',
    'arroz', 'almuerzo', 'desayuno', 'cena', 'comida', 'restaurante', 'domicilio',
    'rappi', 'corrientazo', 'menu del dia',
  ],
  transporte: [
    'gasolina', 'combustible', 'bus', 'buseta', 'transmilenio', 'sitp', 'metro',
    'uber', 'didi', 'indriver', 'cabify', 'taxi', 'pasaje', 'pasajes', 'peaje',
    'parqueadero', 'parqueo', 'ruta', 'tren', 'vuelo', 'avion', 'tiquete', 'llanta',
  ],
  casa: [
    'arriendo', 'alquiler', 'administracion', 'luz', 'energia', 'agua', 'gas',
    'internet', 'wifi', 'servicios', 'recibo', 'factura', 'hipoteca', 'aseo',
    'jabon', 'detergente', 'escoba', 'plomero', 'muebles',
  ],
  salud: [
    'farmacia', 'drogueria', 'medico', 'doctor', 'odontologo', 'dentista', 'eps',
    'medicina', 'medicamento', 'pastillas', 'consulta', 'examen', 'terapia',
    'psicologo', 'gimnasio', 'gym', 'vitaminas', 'optica', 'gafas',
  ],
  ocio: [
    'cine', 'pelicula', 'bar', 'cerveza', 'trago', 'rumba', 'fiesta', 'concierto',
    'viaje', 'paseo', 'juego', 'videojuego', 'libro', 'salida', 'museo', 'billar',
    'partido',
  ],
  antojos: [
    'dulce', 'dulces', 'helado', 'postre', 'mecato', 'snack', 'chocolate',
    'gaseosa', 'papas', 'tinto', 'cafe', 'galletas', 'torta', 'ponque', 'antojo',
  ],
  suscripciones: [
    'suscripcion', 'mensualidad', 'netflix', 'spotify', 'disney', 'hbo', 'prime',
    'youtube', 'icloud', 'membresia', 'plan de datos', 'streaming',
  ],
};

const cacheRegex = new Map();

// Con límites de palabra: "gas" no puede activarse dentro de "gasolina".
function regexDe(palabra) {
  if (!cacheRegex.has(palabra)) {
    cacheRegex.set(palabra, new RegExp(`\\b${palabra.replace(/ /g, '\\s+')}\\b`));
  }
  return cacheRegex.get(palabra);
}

// Gana la palabra que aparece primero, y entre dos que empiecen igual, la más
// larga. "20.000 de gasolina" habla de gasolina aunque "gas" también encaje.
export function categoriaDeTexto(texto) {
  const limpio = sinTildes(texto);
  let mejor = null;

  for (const clave of Object.keys(PALABRAS)) {
    for (const palabra of PALABRAS[clave]) {
      const i = limpio.search(regexDe(palabra));
      if (i === -1) continue;
      if (!mejor || i < mejor.i || (i === mejor.i && palabra.length > mejor.largo)) {
        mejor = { clave, i, largo: palabra.length };
      }
    }
  }

  // Adivinar mal en silencio es peor que preguntar: el que no sabe lo dice.
  return mejor ? { categoria: mejor.clave, segura: true } : { categoria: 'otros', segura: false };
}

// --- Lo que se repite mes a mes -------------------------------------------

const RECURRENTE =
  /\b(suscripcion|mensualidad|mensual|cada mes|todos los meses|arriendo|alquiler|cuota|hipoteca|administracion|netflix|spotify|disney|hbo|prime|youtube|icloud|membresia|plan de datos)\b/;

export const pareceRecurrente = (texto) => RECURRENTE.test(sinTildes(texto));

// --- La nota --------------------------------------------------------------

const NUMEROS_EN_LETRAS = new RegExp(
  `\\b(${[...Object.keys(UNIDADES), ...Object.keys(DECENAS), ...Object.keys(CENTENAS), ...Object.keys(MULTIPLO)].join('|')})\\b`,
  'gi',
);

const BORDE =
  /^(?:pagu[eé]|gast[eé]|compr[eé]|me|cost[oó]|de|del|en|por|para|un|una|unos|unas|y|con|los|las|el|la|hoy|ayer|pesos?|plata)$/i;

// Se recorta por palabras enteras y no con \b: "pagué" termina en tilde, y \b
// no ve frontera entre una tilde y un espacio, así que el verbo se quedaba
// pegado a la nota.
const recortarBordes = (t) => {
  const palabras = t.trim().split(/\s+/).filter(Boolean);

  while (palabras.length && BORDE.test(palabras[0])) palabras.shift();
  while (palabras.length && BORDE.test(palabras[palabras.length - 1])) palabras.pop();

  return palabras.join(' ');
};

// Lo que queda de la frase cuando se le quita la plata: "20.000 de gasolina"
// deja "gasolina". Se guarda tal como la persona lo escribió, con sus tildes,
// porque es su nota y no la nuestra.
export function notaDeTexto(texto) {
  const sinPlata = String(texto ?? '')
    .replace(/\$?\s*\d[\d.,]*\s*(k\b)?/gi, ' ')
    .replace(NUMEROS_EN_LETRAS, ' ');

  return recortarBordes(sinPlata.replace(/\s+/g, ' ')).slice(0, 60);
}

// --- De una frase a un gasto ----------------------------------------------

export function siguienteId(gastos = []) {
  const mayor = gastos.reduce((max, g) => {
    const n = Number(String(g?.id ?? '').replace(/^g-/, ''));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `g-${mayor + 1}`;
}

// `gastos` es la lista que ya existe, y hace falta: sin ella `siguienteId`
// arranca de cero y devuelve 'g-1' siempre. Dos gastos con la misma clave
// rompen las listas de React y hacen que borrar quite el que no era, así que
// el id se calcula contra lo que hay, no contra el vacío.
export function analizarGasto(texto, { fecha, id, gastos = [], hoy = new Date() } = {}) {
  const crudo = String(texto ?? '').trim();

  if (!crudo) {
    return {
      ok: false,
      gasto: null,
      segura: false,
      mensaje: 'Escríbelo como se te ocurra: "almuerzo 12 mil".',
    };
  }

  const monto = montoDeTexto(crudo);

  if (monto == null || monto < MINIMO) {
    return {
      ok: false,
      gasto: null,
      segura: false,
      mensaje: 'No le encontré el monto. Sirve "12 mil", "12k" o "12.000".',
    };
  }

  const { categoria, segura } = categoriaDeTexto(crudo);

  return {
    ok: true,
    segura,
    mensaje: segura ? null : 'Lo dejo en otros porque no lo tengo claro. Cámbialo si va en otra parte.',
    gasto: {
      id: id ?? siguienteId(gastos),
      fecha: fecha ?? claveDia(hoy),
      monto,
      categoria,
      nota: notaDeTexto(crudo),
      recurrente: pareceRecurrente(crudo) || categoria === 'suscripciones',
    },
  };
}

// --- Sumas ----------------------------------------------------------------

export const mesDeClave = (clave) => String(clave ?? '').slice(0, 7);

export const mesDeFecha = (fecha = new Date()) => mesDeClave(claveDia(fecha));

export const gastosDelMes = (gastos = [], mes) =>
  gastos.filter((g) => mesDeClave(g?.fecha) === mes);

export const total = (gastos = []) =>
  gastos.reduce((suma, g) => suma + (Number(g?.monto) || 0), 0);

export function totalPorCategoria(gastos = []) {
  const salida = {};
  for (const g of gastos) {
    const clave = CLAVES_CATEGORIA.includes(g?.categoria) ? g.categoria : 'otros';
    salida[clave] = (salida[clave] ?? 0) + (Number(g?.monto) || 0);
  }
  return salida;
}

// Solo las categorías con algo dentro y de mayor a menor. Una lista de ceros
// no dice nada y llena la pantalla de nada.
export function porCategoria(gastos = []) {
  const sumas = totalPorCategoria(gastos);
  const todo = total(gastos);

  return CLAVES_CATEGORIA.filter((c) => (sumas[c] ?? 0) > 0)
    .map((clave) => ({
      clave,
      titulo: tituloDeCategoria(clave),
      total: sumas[clave],
      fraccion: todo > 0 ? sumas[clave] / todo : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export const ultimos = (gastos = [], cuantos = 8) =>
  [...gastos]
    .sort((a, b) => String(b?.fecha).localeCompare(String(a?.fecha)) || String(b?.id).localeCompare(String(a?.id)))
    .slice(0, cuantos);

// --- Formato --------------------------------------------------------------

// "$12.500". Sin decimales, con punto de miles, como se escribe en Colombia.
export function formatearMonto(monto) {
  const n = Math.round(Number(monto) || 0);
  const cuerpo = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}$${cuerpo}`;
}

// --- A dónde se fue la plata en pedazos chicos ----------------------------
//
// Aquí NO va. Vive entero en services/hormiga.js, que es el entregable 1.7.4.
//
// Hubo una segunda versión en este archivo con un tope fijo de 15.000, y era
// peor por dos motivos: trataba igual a quien gasta en miles y a quien gasta
// en millones, y contaba los cobros fijos, así que un mes normal de pasajes de
// bus salía como un hallazgo. hormiga.js mide lo pequeño contra el gasto
// típico de la persona y deja fuera lo recurrente. Un solo motor, y el que
// tiene los argumentos escritos.

// Lo que Brío dice cuando el mes todavía no tiene nada anotado. Nunca se
// reclama el silencio: no anotar no es un incumplimiento.
export function textoDelMes(gastos = [], mes) {
  const delMes = gastosDelMes(gastos, mes);

  if (!delMes.length) return 'Todavía no hay nada anotado este mes. Cuando anotes algo, aparece aquí.';
  if (delMes.length === 1) return 'Va un gasto anotado este mes.';
  return `Van ${delMes.length} gastos anotados este mes.`;
}
