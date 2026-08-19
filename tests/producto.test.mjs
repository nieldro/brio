import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  COLORES,
  codigoValido,
  normalizarCodigo,
  nombreLimpio,
  sumaPara,
  leerProducto,
} from '../src/services/producto.js';

// El cuerpo que devuelve Open Food Facts, con el producto dentro.
const off = (product, status = 1) => ({ status, code: '0000000000000', product });

// Fichas reales recortadas: los campos que la app pide y las cifras que la
// app NO puede mostrar, a propósito, para comprobar que no se escapan.

const AGUA = {
  product_name_es: 'Agua mineral',
  nova_group: 1,
  nutriscore_grade: 'a',
  nutrient_levels: { fat: 'low', 'saturated-fat': 'low', sugars: 'low', salt: 'low' },
  categories_tags: ['en:beverages', 'en:waters'],
};

const CREMA = {
  product_name: 'Crema de avellanas',
  nova_group: 4,
  nutriscore_grade: 'e',
  nutrient_levels: { fat: 'high', 'saturated-fat': 'high', sugars: 'high', salt: 'low' },
  categories_tags: ['en:spreads', 'en:sweet-spreads'],
  nutriments: { 'energy-kcal_100g': 539, sugars_100g: 56.3, salt_100g: 0.107 },
};

const ATUN = {
  product_name_es: 'Atún en agua 160g',
  nova_group: 3,
  nutriscore_grade: 'c',
  nutrient_levels: { 'saturated-fat': 'low', sugars: 'low', salt: 'high' },
  categories_tags: ['en:canned-fish'],
};

const GASEOSA = {
  product_name_es: 'Gaseosa de naranja',
  nova_group: 4,
  nutriscore_grade: 'e',
  nutrient_levels: { 'saturated-fat': 'low', sugars: 'high', salt: 'low' },
  categories_tags: ['en:beverages', 'en:sodas'],
};

// Alto en grasa TOTAL y bajo en todo lo que Brío sí mira. Es el caso que
// separa "cargado" de "calórico", y llega sin nota de la A a la E porque así
// llegan casi todas las marcas de acá.
const AGUACATE = {
  product_name_es: 'Aguacate Hass',
  nova_group: 1,
  nutrient_levels: { fat: 'high', 'saturated-fat': 'low', sugars: 'low', salt: 'low' },
  categories_tags: ['en:fruits', 'en:avocados'],
};

const SIN_FICHA = { product_name_es: 'Galleta de la esquina' };

// --- El código de barras --------------------------------------------------

test('un código bien leído se acepta y uno con un dígito cambiado no', () => {
  assert.equal(codigoValido('3017620422003'), true); // EAN-13
  assert.equal(codigoValido('3017620422004'), false);
  assert.equal(codigoValido('20134556'), true); // EAN-8
  assert.equal(codigoValido('036000291452'), true); // UPC-A
});

test('media lectura no sale a la red', () => {
  // La cámara devuelve tiras a medias mientras la persona encuadra. Ninguna
  // de estas puede convertirse en una búsqueda ni en un mensaje de error.
  for (const roto of ['', '123', '30176204220', 'abc', null, undefined]) {
    assert.equal(codigoValido(roto), false, JSON.stringify(roto));
  }
});

test('UPC-A se convierte en EAN-13, que es como lo guarda la base', () => {
  assert.equal(normalizarCodigo('036000291452'), '0036000291452');
  assert.equal(codigoValido(normalizarCodigo('036000291452')), true);
});

test('el UPC-E corto se expande, y solo cuando el lector dice que es UPC-E', () => {
  // Un EAN-8 y un UPC-E miden ocho dígitos y "01234565" es válido como los
  // dos. Adivinar sería equivocarse la mitad de las veces.
  assert.equal(normalizarCodigo('01234565', 'upc_e'), '0012345000065');
  assert.equal(codigoValido(normalizarCodigo('01234565', 'upc_e')), true);

  assert.equal(normalizarCodigo('01234565', 'ean8'), '01234565');
});

test('un UPC-E que el lector ya expandió no se expande dos veces', () => {
  // Android suele devolverlo ya en doce dígitos, con el tipo puesto igual.
  assert.equal(normalizarCodigo('012345000065', 'upc_e'), '0012345000065');
});

test('los espacios y guiones que mete el lector no estorban', () => {
  assert.equal(normalizarCodigo(' 301-762 0422003 '), '3017620422003');
});

// --- El nombre ------------------------------------------------------------

test('las cantidades del nombre no llegan a la pantalla', () => {
  // "Yogurt griego 0%" trae en el nombre justo lo que esta app no muestra.
  assert.equal(nombreLimpio('Yogurt griego 0%'), 'Yogurt griego');
  assert.equal(nombreLimpio('Atún en agua 160g'), 'Atún en agua');
  assert.equal(nombreLimpio('Coca-Cola 1.5 L'), 'Coca-Cola');
  assert.equal(nombreLimpio('Pan integral 500 g'), 'Pan integral');
  assert.equal(nombreLimpio('Leche deslactosada 2'), 'Leche deslactosada');
});

test('los números que son parte del nombre se quedan', () => {
  // Quitarlos todos dejaría "Up" y " Vitamina B", que no son productos.
  assert.equal(nombreLimpio('7 Up'), '7 Up');
  assert.equal(nombreLimpio('Vitamina B12'), 'Vitamina B12');
});

test('un nombre larguísimo se corta por una palabra, no por la mitad', () => {
  const largo = nombreLimpio('Galletas integrales de avena con trozos de chocolate y almendras tostadas de la casa');
  assert.ok(largo.length <= 60, largo);
  assert.ok(!largo.endsWith(' '), largo);
});

// --- El semáforo ----------------------------------------------------------

test('lo simple da verde y lo muy cargado da rojo', () => {
  assert.equal(leerProducto(off(AGUA)).color, 'verde');
  assert.equal(leerProducto(off(ATUN)).color, 'ambar');
  assert.equal(leerProducto(off(CREMA)).color, 'rojo');
  assert.equal(leerProducto(off(GASEOSA)).color, 'rojo');
});

test('el color siempre es uno de los tres del semáforo', () => {
  for (const p of [AGUA, ATUN, CREMA, GASEOSA]) {
    assert.ok(COLORES.includes(leerProducto(off(p)).color), p.product_name_es);
  }
});

test('la grasa total sola no manda a nadie al rojo', () => {
  // El aguacate es alto en grasa total y no es lo mismo que unas papas
  // fritas. Contarla sería castigar comida buena por una cifra.
  //
  // Entra por el camino real, con su `nutrient_levels` crudo y el `fat:
  // 'high'` dentro. Armar a mano el objeto de señales —como hacía esta misma
  // prueba antes— se saltaba `senales()`, que es la ÚNICA función donde la
  // constante CARGADOS decide ignorar 'fat': la prueba seguía verde aunque
  // alguien metiera la grasa total en la cuenta.
  assert.equal(leerProducto(off(AGUACATE)).color, 'verde');

  // Y la grasa total no cambia nada: con la clave y sin ella, el mismo color.
  const sinGrasa = { ...AGUACATE, nutrient_levels: { ...AGUACATE.nutrient_levels } };
  delete sinGrasa.nutrient_levels.fat;

  assert.equal(leerProducto(off(sinGrasa)).color, leerProducto(off(AGUACATE)).color);
});

// --- La regla 1, comprobada -----------------------------------------------

test('ni las cifras ni la nota de la A a la E salen del servicio', () => {
  // Open Food Facts manda calorías, gramos de azúcar y un puntaje. Todo eso
  // decide el color aquí dentro y se queda aquí, igual que el IMC en el
  // servidor. Lo que sale es un color, un nombre y una cosa para sumar.
  const r = leerProducto(off(CREMA));

  assert.deepEqual(Object.keys(r).sort(), [
    'color',
    'hayDatos',
    'hayProducto',
    'mensaje',
    'nombre',
    'suma',
  ]);

  assert.ok(!/\d/.test(JSON.stringify(r)), `se coló una cifra: ${JSON.stringify(r)}`);
});

const MEDIDAS =
  /calor[íi]as?|macros?|\bkcal\b|gramos?|\bgr\b|\bml\b|prote[íi]nas?|carbohidratos?|az[úu]car|sodio|nutri.?score|\bnova\b|puntaje|nota\b/i;

// Nombrar una unidad para decir que NO se usa no es dar una cantidad.
//
// La intro del escáner dice "No leo calorías ni notas", y esa frase es lo
// contrario de un contador: es la promesa de que aquí no lo hay. Quitarla
// para que pasara la prueba habría dejado la pantalla peor, no mejor.
//
// Lo que la regla 1 prohíbe es el DATO, y un dato afirma. Por eso la palabra
// cuenta como medida solo cuando la frase que la lleva no la niega antes:
// "no leo calorías" promete, "calorías, no muchas" informa. La cifra, en
// cambio, no tiene excepción y se comprueba aparte: un número dentro de una
// frase siempre se lee como exacto, venga como venga.
const NIEGA = /\b(no|ni|nunca|sin|jam[áa]s|tampoco)\b/i;

const daUnaCantidad = (texto) =>
  texto.split(/[.;:]/).some((frase) => {
    const medida = frase.search(MEDIDAS);
    if (medida === -1) return false;

    const niega = frase.search(NIEGA);
    return niega === -1 || niega > medida;
  });

test('ningún texto habla de cantidades, de macros ni de puntajes', () => {
  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(!daUnaCantidad(t), `"${t}" habla de cantidades`);
    assert.ok(!/\d/.test(t), `"${t}" lleva una cifra`);
  }
});

test('la excepción es solo para negar: afirmar una medida sigue estando mal', () => {
  // Si la excepción de arriba se abriera de más, la red dejaría de servir.
  assert.equal(daUnaCantidad('No leo calorías ni notas'), false);
  assert.equal(daUnaCantidad('Nunca cuento gramos'), false);

  assert.equal(daUnaCantidad('Trae azúcar de más'), true);
  assert.equal(daUnaCantidad('Son calorías vacías'), true);
  assert.equal(daUnaCantidad('Mira las proteínas, no la sal'), true);
});

test('ningún texto manda quitar algo: son de suma, no de resta', () => {
  const RESTA = /\b(evit\w*|deja de|quita|elimina|no comas|prohibid\w*|reduce|menos de)\b/i;

  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(!RESTA.test(t), `"${t}" manda quitar algo`);
  }
});

test('ningún texto califica el producto ni a quien lo compró', () => {
  const JUICIO =
    /\b(engorda\w*|chatarra|basura|pecado|culpa\w*|malo|mala|gordo|flaco|adelgaz\w*|dieta\w*|deber[íi]as|debes|tu cuerpo|tu peso)\b/i;

  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(!JUICIO.test(t), `"${t}" juzga`);
  }
});

test('la voz de Brío: máximo dos frases, sin gritos', () => {
  const frases = (t) => t.split(/[.?…]+/).map((f) => f.trim()).filter(Boolean).length;

  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(frases(t) <= 2, `"${t}" pasa de dos frases`);
    assert.ok(!t.includes('!') && !t.includes('¡'), `"${t}" grita`);
  }
});

test('hasta el rojo trae algo para sumar', () => {
  // Un punto rojo a secas es un castigo. Nadie se queda con el color solo.
  const rojo = leerProducto(off(CREMA));
  assert.equal(rojo.color, 'rojo');
  assert.ok(rojo.suma.length > 0);
  assert.match(rojo.suma, /s[úu]male|acomp[áa]ñalo|ponle/i);
});

test('a una bebida cargada se le suma agua, no un huevo', () => {
  assert.match(leerProducto(off(GASEOSA)).suma, /agua/i);
});

// --- Cuando no hay nada que decir -----------------------------------------

test('un producto que no está en la base no es un error', () => {
  assert.deepEqual(leerProducto({ status: 0 }), { hayProducto: false });
  assert.deepEqual(leerProducto(null), { hayProducto: false });
  assert.deepEqual(leerProducto({ status: 1 }), { hayProducto: false });
});

test('un producto sin nombre útil se cuenta como no encontrado', () => {
  // Enseñar una tarjeta con el nombre en blanco es peor que decir que no está.
  assert.deepEqual(leerProducto(off({ product_name: '500 g' })), { hayProducto: false });
});

test('un producto sin ficha no recibe un color inventado', () => {
  const r = leerProducto(off(SIN_FICHA));

  assert.equal(r.hayProducto, true);
  assert.equal(r.hayDatos, false);
  assert.equal(r.color, null);
  assert.ok(r.suma.length > 0, 'igual se le sugiere algo');
});

test('el nombre en español gana al de la base mundial', () => {
  const r = leerProducto(off({ product_name: 'Pâte à tartiner', product_name_es: 'Crema para untar' }));
  assert.equal(r.nombre, 'Crema para untar');
});

// --- Lo que está escrito en la pantalla -----------------------------------
//
// La mitad de lo que un ojo lee en el escáner no sale de producto.js: está
// quemado dentro del JSX de Escaner.js —la intro, la instrucción del visor,
// los dos avisos y la nota del pie— y por ahí no pasa ninguna función. Sin
// leer el archivo, la red de la regla 1 dejaba fuera justo los textos que
// alguien cambia de afán un martes.

const RUTA_PANTALLA = new URL('../src/screens/Escaner.js', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);

const PANTALLA = readFileSync(RUTA_PANTALLA, 'utf8');
const SIN_COMENTARIOS = PANTALLA.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');

function textosDeLaPantalla() {
  return [
    ...[...SIN_COMENTARIOS.matchAll(/'([^'\\\n]{6,})'/g)].map((m) => m[1]),
    // Solo el texto que termina en una etiqueta de cierre: sin eso, un
    // `length > 0 &&` del código entra como si fuera una frase de la app.
    ...[...SIN_COMENTARIOS.matchAll(/>\s*([^<>{}\n][^<>{}]*?)\s*<\//g)].map((m) => m[1]),
  ]
    .map((t) => t.replace(/\s+/g, ' ').trim())
    // Una frase tiene un espacio y letras. Lo que queda fuera son valores de
    // estilo y nombres de módulo: 'absolute', 'ean13', 'expo-camera'.
    .filter((t) => /\s/.test(t) && /[a-záéíóúñ]/i.test(t));
}

test('la red alcanza de verdad los textos de la pantalla', () => {
  // Una extracción que se rompa en silencio deja la red vacía, y una red
  // vacía pasa todas las pruebas de abajo. Por eso se comprueba que están.
  const textos = textosDeLaPantalla();
  assert.ok(textos.length >= 10, `solo encontré ${textos.length} textos en Escaner.js`);

  for (const trozo of [
    'No leo calorías ni notas',
    'Apunta al código de barras',
    'La base la llenamos entre todos',
    'Puede ser la señal',
    'Esto no se guarda en ninguna parte',
  ]) {
    assert.ok(
      textos.some((t) => t.includes(trozo)),
      `"${trozo}" ya no está entre los textos que se revisan`,
    );
  }
});

// Todo lo que un ojo puede llegar a leer en la pantalla del escáner: lo que
// escribe producto.js y lo que está escrito a mano en Escaner.js.
function TODOS_LOS_TEXTOS() {
  const senales = [
    { esBebida: true, altos: ['sugars'], bajos: [], nova: 4, nota: 'e' },
    { esBebida: false, altos: ['sugars'], bajos: [], nova: 4, nota: 'd' },
    { esBebida: false, altos: ['salt'], bajos: [], nova: 3, nota: 'c' },
    { esBebida: false, altos: ['saturated-fat'], bajos: [], nova: 4, nota: 'd' },
    { esBebida: false, altos: [], bajos: ['sugars', 'salt'], nova: 1, nota: 'a' },
    { esBebida: false, altos: [], bajos: [], nova: null, nota: null },
  ];

  const salida = senales.map(sumaPara);

  for (const p of [AGUA, ATUN, CREMA, GASEOSA, AGUACATE, SIN_FICHA]) {
    const r = leerProducto(off(p));
    salida.push(r.suma, r.mensaje);
  }

  return [...new Set([...salida, ...textosDeLaPantalla()])];
}

// --- Que la pantalla no se quede sin salida -------------------------------

test('lo que llega tarde no se pinta sobre una pantalla que ya se fue', () => {
  // La consulta espera hasta ocho segundos. En ese rato la persona pudo
  // salirse, y tres setState sobre una pantalla desmontada son un aviso de
  // React y una fuga. El resto del proyecto usa la misma bandera.
  const despues = SIN_COMENTARIOS.split('await buscarProducto(')[1] ?? '';
  assert.ok(despues, 'ya no se consulta el producto desde la pantalla');

  const guarda = despues.indexOf('!vivo.current');
  const primerPintado = despues.search(/set[A-Z]/);

  assert.ok(guarda !== -1, 'la respuesta se usa sin comprobar que la pantalla siga viva');
  assert.ok(guarda < primerPintado, 'la comprobación llega después de pintar');
  assert.match(SIN_COMENTARIOS, /vivo\.current = false/, 'la bandera nunca se baja al salir');
});

test('durante la espera sigue habiendo una salida', () => {
  // Con `cargando` en true la pantalla solo mostraba el Latido: los dos
  // botones vivían detrás de `!cargando` y el chip de Volver ya no estaba.
  // Ocho segundos con mala señal y sin forma de salir se sienten como una
  // app colgada, que es justo lo que ESPERA_MS quería evitar.
  const inicio = SIN_COMENTARIOS.indexOf('<View style={est.botones}>');
  assert.ok(inicio > 0, 'el bloque de botones cambió de nombre');

  const antes = SIN_COMENTARIOS.slice(0, inicio).trimEnd();
  assert.ok(!/&&\s*\($/.test(antes), 'el bloque entero de botones cuelga de una condición');

  const bloque = SIN_COMENTARIOS.slice(inicio, SIN_COMENTARIOS.indexOf('</View>', inicio));
  const antesDeVolver = bloque.slice(0, bloque.indexOf('Volver'));
  assert.ok(antesDeVolver, 'el botón de volver salió del bloque');

  const suBoton = antesDeVolver.slice(antesDeVolver.lastIndexOf('<Boton'));
  assert.ok(!/cargando/.test(suBoton), 'el botón de volver se esconde mientras se consulta');
});
