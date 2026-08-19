// Un producto empacado, leído por su código de barras.
//
// Los datos crudos salen de Open Food Facts (lib/openfoodfacts.js). Aquí se
// convierten en lo único que Brío enseña de un empaque: un color de semáforo,
// el nombre y UNA cosa para sumarle.
//
// LO QUE SE QUEDA ADENTRO, Y ES LA MITAD DEL TRABAJO
// La ficha de Open Food Facts viene cargada de cifras: calorías, gramos de
// azúcar, sal, y una nota de la A a la E. Nada de eso sale a la pantalla. Se
// usa aquí dentro para decidir el color y se queda aquí, igual que el IMC en
// el servidor: se calcula, decide, y no se guarda, no se muestra y no entra
// en ningún texto.
//
// Enseñar "dieciocho gramos de azúcar" es contar. Enseñar un punto ámbar y
// "súmale una fruta" es acompañar. La regla 1 no distingue entre la foto de
// un plato y un empaque: manda igual en los dos.
//
// Y no se califica el producto. El semáforo dice qué tan cargado viene, no si
// alguien hizo bien o mal en comprarlo. Por eso hasta el rojo lleva una cosa
// para sumar y ninguna para quitar.

export const COLORES = ['verde', 'ambar', 'rojo'];

// --- El código de barras ---------------------------------------------------
//
// La cámara devuelve una tira de dígitos y a veces la devuelve a medias. Se
// comprueba aquí, antes de salir a la red: un código incompleto no es un
// error que mostrarle a nadie, es un segundo más apuntando.

const soloDigitos = (texto) => String(texto ?? '').replace(/\D/g, '');

// El dígito de control de cualquier GTIN (EAN-8, UPC-A, EAN-13). Se recorre
// de derecha a izquierda con pesos 3 y 1 alternados.
function digitoDeControl(sinControl) {
  let suma = 0;
  for (let i = sinControl.length - 1, peso = 3; i >= 0; i -= 1, peso = peso === 3 ? 1 : 3) {
    suma += Number(sinControl[i]) * peso;
  }
  return (10 - (suma % 10)) % 10;
}

export function codigoValido(codigo) {
  const d = soloDigitos(codigo);
  if (![8, 12, 13, 14].includes(d.length)) return false;
  return digitoDeControl(d.slice(0, -1)) === Number(d[d.length - 1]);
}

// UPC-E de ocho dígitos a UPC-A de doce. La versión corta se imprime en
// envases pequeños y omite ceros que hay que devolver a su sitio; sin esto,
// Open Food Facts no encuentra nada.
//
// Solo se hace cuando la cámara dice que leyó un UPC-E. Un EAN-8 mide lo
// mismo y no hay forma de distinguirlos por el número: "01234565" es un UPC-E
// válido Y un EAN-8 válido a la vez. Adivinar sería equivocarse la mitad de
// las veces, así que se cree lo que reporta el lector.
function expandirUpcE(d) {
  const n = d[0];
  const [a, b, c, e, f, g] = d.slice(1, 7);
  const control = d[7];

  if (g === '0' || g === '1' || g === '2') return `${n}${a}${b}${g}0000${c}${e}${f}${control}`;
  if (g === '3') return `${n}${a}${b}${c}00000${e}${f}${control}`;
  if (g === '4') return `${n}${a}${b}${c}${e}00000${f}${control}`;
  return `${n}${a}${b}${c}${e}${f}0000${g}${control}`;
}

// El código tal como lo espera Open Food Facts: trece dígitos.
export function normalizarCodigo(crudo, tipo = '') {
  let d = soloDigitos(crudo);

  // El lector de Android a veces ya devuelve el UPC-E expandido. Solo se
  // toca cuando de verdad vienen los ocho dígitos cortos.
  if (String(tipo).toLowerCase().includes('upc_e') && d.length === 8) d = expandirUpcE(d);

  // UPC-A es un EAN-13 con un cero delante. La base los guarda así.
  if (d.length === 12) d = `0${d}`;

  return d;
}

// --- El nombre -------------------------------------------------------------

// Fuera las cifras del nombre.
//
// "Yogurt griego 0%" y "Atún en agua 160g" traen en el nombre justo lo que
// esta app no muestra. Un número con unidad al lado es una medida, y una
// medida en pantalla se lee como una cuenta que llevar.
//
// Los números que NO son medidas se quedan: "7 Up" y "Vitamina B12" son
// nombres, no cantidades. La excepción es un número suelto al final, que en
// un producto de supermercado casi siempre es el "%" o los gramos a los que
// se les cayó la unidad.
const CIFRA_CON_UNIDAD =
  /\d+(?:[.,]\d+)?\s*(?:%|kcal|cal|kg|mg|ml|lt|l|gr?s?|gramos?|litros?|onzas?|oz|cc)(?![a-záéíóúñ])/gi;

const NUMERO_AL_FINAL = /[\s,·-]+\d+(?:[.,]\d+)?\s*$/;

const LARGO_NOMBRE = 60;

export function nombreLimpio(crudo) {
  let texto = String(crudo ?? '')
    .replace(CIFRA_CON_UNIDAD, ' ')
    .replace(NUMERO_AL_FINAL, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:.·—–-]+|[\s,;:.·—–-]+$/g, '')
    .trim();

  if (texto.length > LARGO_NOMBRE) {
    const corte = texto.lastIndexOf(' ', LARGO_NOMBRE);
    texto = texto.slice(0, corte > 20 ? corte : LARGO_NOMBRE).trim();
  }

  return texto;
}

// El español primero: la base es mundial y el mismo producto puede venir con
// el nombre en francés si nadie lo tradujo todavía.
const CAMPOS_NOMBRE = [
  'product_name_es',
  'generic_name_es',
  'product_name',
  'generic_name',
  'abbreviated_product_name',
];

function nombreDe(p) {
  for (const campo of CAMPOS_NOMBRE) {
    const limpio = nombreLimpio(p?.[campo]);
    if (limpio) return limpio;
  }
  return '';
}

// --- Las señales -----------------------------------------------------------
//
// Tres cosas, y las tres se quedan aquí dentro:
//   - nova_group: cuánto se procesó, del 1 al 4.
//   - nutrient_levels: si viene alto o bajo en grasa saturada, azúcar y sal.
//   - nutriscore_grade: la nota de la A a la E.
//
// La grasa TOTAL se ignora a propósito, aunque venga en los datos. El
// aguacate y el aceite de oliva son altos en grasa total y no son lo mismo
// que unas papas fritas: contarla sería castigar comida buena por una cifra.

const CARGADOS = ['saturated-fat', 'sugars', 'salt'];

function senales(p) {
  const niveles = p?.nutrient_levels ?? {};
  const altos = CARGADOS.filter((clave) => niveles[clave] === 'high');
  const bajos = CARGADOS.filter((clave) => niveles[clave] === 'low');

  const crudoNova = Number(p?.nova_group);
  const nova = Number.isInteger(crudoNova) && crudoNova >= 1 && crudoNova <= 4 ? crudoNova : null;

  // 'unknown' y 'not-applicable' llegan seguido, y son un "no sé", no una nota.
  const crudoNota = String(p?.nutriscore_grade ?? '').toLowerCase();
  const nota = ['a', 'b', 'c', 'd', 'e'].includes(crudoNota) ? crudoNota : null;

  const etiquetas = Array.isArray(p?.categories_tags) ? p.categories_tags.join(' ') : '';

  return {
    nova,
    nota,
    altos,
    bajos,
    esBebida: /beverage|drink|bebida|jugo|juice|refresco|soda/i.test(etiquetas),
    hayDatos: altos.length > 0 || bajos.length > 0 || nova !== null || nota !== null,
  };
}

// --- El color --------------------------------------------------------------
//
// Una suma corta de lo cargado que viene el producto. El resultado es un
// color y nada más: el número no se devuelve, no se guarda y no se muestra.
// Un puntaje en pantalla invita a comparar productos y a coleccionar verdes,
// y eso es exactamente la obsesión que la regla 6 pide evitar.

const CARGA_NOVA = { 1: 0, 2: 0, 3: 1, 4: 2 };
const CARGA_NOTA = { a: -1, b: -1, c: 0, d: 1, e: 2 };

function cargaDe(s) {
  let carga = 0;

  if (s.nova !== null) carga += CARGA_NOVA[s.nova];
  if (s.nota !== null) carga += CARGA_NOTA[s.nota];

  carga += s.altos.length;

  // Bajo en casi todo y sin nada alto: eso vale un punto a favor. Sin esto,
  // un producto simple sin nota ni nova se quedaba en el montón del medio.
  if (s.altos.length === 0 && s.bajos.length >= 2) carga -= 1;

  return carga;
}

export function colorDeProducto(s) {
  const carga = cargaDe(s);
  if (carga <= 0) return 'verde';
  if (carga <= 2) return 'ambar';
  return 'rojo';
}

// --- Qué sumarle -----------------------------------------------------------
//
// Una sola cosa, y siempre de sumar. Ninguna dice "deja", "quita" ni "evita":
// a quien ya abandonó una dieta, la orden de quitar es lo que le hace cerrar
// la app. El orden importa y es de más concreto a más general: gana la
// primera que aplique.

const SUMAS = [
  {
    cuando: (s) => s.esBebida && s.altos.length > 0,
    texto: 'Súmale un vaso de agua al lado.',
  },
  {
    cuando: (s) => s.altos.includes('sugars'),
    texto: 'Acompáñalo con un huevo, queso o un puñado de maní.',
  },
  {
    cuando: (s) => s.altos.includes('salt'),
    texto: 'Acompáñalo con algo fresco: tomate, pepino o lo que tengas.',
  },
  {
    cuando: (s) => s.altos.includes('saturated-fat'),
    texto: 'Súmale verdura al lado, de la que te guste.',
  },
  {
    cuando: (s) => s.nova !== null && s.nova <= 2,
    texto: 'Va bien tal cual. Si quieres, súmale una fruta.',
  },
];

const SUMA_POR_DEFECTO = 'Súmale una fruta o una verdura en la misma comida.';

export function sumaPara(s) {
  return SUMAS.find((regla) => regla.cuando(s))?.texto ?? SUMA_POR_DEFECTO;
}

// --- Lo que Brío dice ------------------------------------------------------

const MENSAJES = {
  verde: 'De estos vale la pena tener en la despensa.',
  ambar: 'Es comida, y ya. Con algo al lado queda más completo.',
  rojo: 'Esto habla del producto, no de ti. Cómelo cuando te provoque y súmale lo de arriba.',
};

// Un producto que nadie ha llenado todavía. Pasa seguido: la base la
// mantienen voluntarios y las marcas de acá van más flojas que las de Europa.
const SIN_DATOS = 'De este todavía no sé nada. Lo de siempre sirve igual.';

// --- El resultado ----------------------------------------------------------

// Recibe el cuerpo entero de Open Food Facts y devuelve solo lo que se puede
// mostrar. Ni nova, ni la nota, ni las cifras salen de aquí.
export function leerProducto(cuerpo) {
  const p = cuerpo?.product;

  if (Number(cuerpo?.status) !== 1 || !p || typeof p !== 'object') {
    return { hayProducto: false };
  }

  const nombre = nombreDe(p);
  if (!nombre) return { hayProducto: false };

  const s = senales(p);

  // Sin datos no se inventa un color. Un semáforo a ojo sobre un producto del
  // que no se sabe nada es peor que no decir nada.
  if (!s.hayDatos) {
    return {
      hayProducto: true,
      hayDatos: false,
      nombre,
      color: null,
      suma: SUMA_POR_DEFECTO,
      mensaje: SIN_DATOS,
    };
  }

  const color = colorDeProducto(s);

  return {
    hayProducto: true,
    hayDatos: true,
    nombre,
    color,
    suma: sumaPara(s),
    mensaje: MENSAJES[color],
  };
}
