import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CATEGORIAS,
  CLAVES_CATEGORIA,
  MINIMO,
  analizarGasto,
  categoriaDeTexto,
  formatearMonto,
  gastosDelMes,
  mesDeClave,
  montoDeTexto,
  notaDeTexto,
  pareceRecurrente,
  porCategoria,
  siguienteId,
  textoDelMes,
  tituloDeCategoria,
  total,
  totalPorCategoria,
  ultimos,
} from '../src/services/gastos.js';
import { estadoInicial } from '../src/state/usuarioReducer.js';

const ruta = (relativa) =>
  new URL(relativa, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const leer = (relativa) => readFileSync(ruta(relativa), 'utf8');

const sinComentarios = (codigo) =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');

const HOY = new Date(2026, 7, 19, 12); // 19 de agosto de 2026

// Los montos llevan puntos de miles, así que hay que sacarlos antes de contar
// frases: si no, "$15.000" parece tres oraciones.
const frases = (texto) =>
  texto.replace(/\d[\d.,]*/g, 'X').split(/[.?…]+/).filter((f) => f.trim()).length;

const gasto = (cambios = {}) => ({
  id: 'g-1',
  fecha: '2026-08-19',
  monto: 10000,
  categoria: 'otros',
  nota: '',
  recurrente: false,
  ...cambios,
});

// --- El catálogo ----------------------------------------------------------

test('las categorías son las ocho acordadas y no se repiten', () => {
  assert.deepEqual(CLAVES_CATEGORIA, [
    'mercado', 'transporte', 'casa', 'salud', 'ocio', 'antojos', 'suscripciones', 'otros',
  ]);
  assert.equal(new Set(CLAVES_CATEGORIA).size, CATEGORIAS.length);
});

test('toda categoría tiene título, y una inventada cae en otros', () => {
  for (const c of CATEGORIAS) assert.ok(c.titulo.length > 2, c.clave);
  assert.equal(tituloDeCategoria('inventada'), 'Otros');
});

// --- Leer la plata como se escribe en la calle ----------------------------

test('entiende las formas de escribir doce mil pesos', () => {
  const formas = [
    '12 mil', '12mil', '12k', '12.000', '$12.000', '$ 12.000', 'doce mil',
    '12 lucas', '12 luca', 'doce lucas',
  ];

  for (const forma of formas) {
    assert.equal(montoDeTexto(forma), 12000, `"${forma}" no dio 12000`);
  }
});

test('entiende las barras y los palos', () => {
  assert.equal(montoDeTexto('20 barras'), 20000);
  assert.equal(montoDeTexto('un palo de arriendo'), 1000000);
  assert.equal(montoDeTexto('millon y medio'), 1000000); // el "medio" no se inventa
  assert.equal(montoDeTexto('dos millones'), 2000000);
});

test('el punto separa miles y la coma decimales, como en Colombia', () => {
  assert.equal(montoDeTexto('1.250.000 de arriendo'), 1250000);
  assert.equal(montoDeTexto('12,5 mil'), 12500);
});

test('junta el número con lo que le sigue en letras', () => {
  assert.equal(montoDeTexto('12 mil quinientos'), 12500);
  assert.equal(montoDeTexto('doce mil quinientos'), 12500);
  assert.equal(montoDeTexto('ciento veinte mil'), 120000);
});

test('gana el número que trae señal de plata, no el más grande a secas', () => {
  // "2 tintos 6 mil" son seis mil pesos, no dos.
  assert.equal(montoDeTexto('2 tintos 6 mil'), 6000);
  assert.equal(montoDeTexto('3 pasajes de 2.500'), 2500);
  // Y si ninguno trae señal, se toma el mayor: "cine 20000".
  assert.equal(montoDeTexto('cine 20000'), 20000);
});

test('sin número no se inventa un monto', () => {
  for (const texto of ['almuerzo', '', null, undefined, 'me gasté una plata']) {
    const leido = montoDeTexto(texto);
    assert.ok(leido === null || leido < MINIMO, `"${texto}" sacó ${leido}`);
  }
});

test('"un almuerzo" no vale un peso', () => {
  // El artículo "un" es un número en letras, y sin este freno se registraba
  // un gasto de un peso sin que nadie lo notara.
  const r = analizarGasto('un almuerzo', { hoy: HOY });
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /monto/i);
});

// --- Adivinar la categoría ------------------------------------------------

test('saca la categoría por las palabras de siempre', () => {
  const casos = [
    ['almuerzo 12 mil', 'mercado'],
    ['mercado del mes 250 mil', 'mercado'],
    ['20.000 de gasolina', 'transporte'],
    ['uber 15 mil', 'transporte'],
    ['bus 2.700', 'transporte'],
    ['arriendo 900 mil', 'casa'],
    ['recibo de la luz 80 mil', 'casa'],
    ['farmacia 30 mil', 'salud'],
    ['cine 20 mil', 'ocio'],
    ['helado 6 mil', 'antojos'],
    ['netflix 16.900', 'suscripciones'],
  ];

  for (const [texto, esperada] of casos) {
    assert.equal(categoriaDeTexto(texto).categoria, esperada, texto);
  }
});

test('"gas" no se enciende dentro de "gasolina"', () => {
  // Sin límites de palabra, cargar gasolina se guardaba como servicios de casa.
  assert.equal(categoriaDeTexto('gasolina 50 mil').categoria, 'transporte');
  assert.equal(categoriaDeTexto('gas 40 mil').categoria, 'casa');
});

test('cuando no sabe, dice que no sabe en vez de adivinar', () => {
  const r = categoriaDeTexto('regalo para mi tia');
  assert.equal(r.categoria, 'otros');
  assert.equal(r.segura, false);

  assert.equal(categoriaDeTexto('almuerzo').segura, true);
});

test('lo que se repite cada mes queda marcado', () => {
  assert.equal(pareceRecurrente('netflix 16.900'), true);
  assert.equal(pareceRecurrente('arriendo 900 mil'), true);
  assert.equal(pareceRecurrente('cuota de la moto 180 mil'), true);
  assert.equal(pareceRecurrente('helado 6 mil'), false);
});

// --- De una frase a un gasto ----------------------------------------------

test('una frase suelta sale con la forma exacta que espera la app', () => {
  const r = analizarGasto('almuerzo 12 mil', { id: 'g-17', hoy: HOY });

  assert.equal(r.ok, true);
  assert.deepEqual(r.gasto, {
    id: 'g-17',
    fecha: '2026-08-19',
    monto: 12000,
    categoria: 'mercado',
    nota: 'almuerzo',
    recurrente: false,
  });
});

test('la nota guarda lo que la persona escribió, sin la plata', () => {
  assert.equal(notaDeTexto('20.000 de gasolina'), 'gasolina');
  assert.equal(notaDeTexto('almuerzo 12 mil'), 'almuerzo');
  assert.equal(notaDeTexto('pagué 12 mil de uber al centro'), 'uber al centro');
  assert.equal(notaDeTexto('doce mil almuerzo'), 'almuerzo');
  assert.equal(notaDeTexto('12k'), '');
  // Las tildes son suyas: la nota no se normaliza para mostrarla.
  assert.equal(notaDeTexto('cafés 8 mil'), 'cafés');
});

test('una suscripción entra marcada aunque no lo diga', () => {
  const r = analizarGasto('spotify 16.900', { hoy: HOY });
  assert.equal(r.gasto.categoria, 'suscripciones');
  assert.equal(r.gasto.recurrente, true);
});

test('cuando la categoría es un tiro al aire, lo dice y deja cambiarla', () => {
  const r = analizarGasto('regalo 50 mil', { hoy: HOY });

  assert.equal(r.ok, true);
  assert.equal(r.segura, false);
  assert.equal(r.gasto.categoria, 'otros');
  assert.ok(r.mensaje && /otros/i.test(r.mensaje));
});

test('los id no se pisan entre sí', () => {
  assert.equal(siguienteId([]), 'g-1');
  assert.equal(siguienteId([gasto({ id: 'g-3' }), gasto({ id: 'g-17' })]), 'g-18');
  assert.equal(siguienteId([{ id: 'lo-que-sea' }]), 'g-1');
});

test('un gasto analizado toma su id de la lista que ya existe', () => {
  // Sin la lista, `siguienteId()` arranca de cero y devuelve 'g-1' siempre.
  // Dos gastos con la misma clave rompen las listas de React y hacen que
  // borrar quite el que no era.
  const ya = [gasto({ id: 'g-1' }), gasto({ id: 'g-2' })];

  assert.equal(analizarGasto('almuerzo 12 mil', { gastos: ya, hoy: HOY }).gasto.id, 'g-3');

  // Y anotando de a uno, los id salen distintos cada vez.
  const vistos = [];
  let lista = [];
  for (let i = 0; i < 3; i += 1) {
    const nuevo = analizarGasto('bus 2.700', { gastos: lista, hoy: HOY }).gasto;
    vistos.push(nuevo.id);
    lista = [nuevo, ...lista];
  }

  assert.equal(new Set(vistos).size, 3, `se repitieron: ${vistos.join(', ')}`);
});

test('un id dado a mano manda sobre el calculado', () => {
  const r = analizarGasto('almuerzo 12 mil', { id: 'g-99', gastos: [gasto()], hoy: HOY });
  assert.equal(r.gasto.id, 'g-99');
});

// --- Sumas ----------------------------------------------------------------

const MES = [
  gasto({ id: 'g-1', fecha: '2026-08-01', monto: 250000, categoria: 'mercado' }),
  gasto({ id: 'g-2', fecha: '2026-08-05', monto: 12000, categoria: 'mercado' }),
  gasto({ id: 'g-3', fecha: '2026-08-10', monto: 60000, categoria: 'transporte' }),
  gasto({ id: 'g-4', fecha: '2026-07-30', monto: 900000, categoria: 'casa' }),
];

test('el mes se separa por su clave, no por lo que haya en la lista', () => {
  assert.equal(mesDeClave('2026-08-19'), '2026-08');
  assert.equal(gastosDelMes(MES, '2026-08').length, 3);
  assert.equal(total(gastosDelMes(MES, '2026-08')), 322000);
});

test('las categorías salen ordenadas y sin las vacías', () => {
  const filas = porCategoria(gastosDelMes(MES, '2026-08'));

  assert.deepEqual(filas.map((f) => f.clave), ['mercado', 'transporte']);
  assert.equal(filas[0].total, 262000);
  assert.ok(Math.abs(filas[0].fraccion - 262000 / 322000) < 1e-9);
});

test('una categoría que no existe no se pierde: cae en otros', () => {
  const sumas = totalPorCategoria([gasto({ categoria: 'cripto', monto: 5000 })]);
  assert.deepEqual(sumas, { otros: 5000 });
});

test('los últimos son los últimos, y no más de los que se piden', () => {
  const lista = ultimos(MES, 2);
  assert.deepEqual(lista.map((g) => g.id), ['g-3', 'g-2']);
});

test('el formato de plata es el de acá, sin decimales', () => {
  assert.equal(formatearMonto(12500), '$12.500');
  assert.equal(formatearMonto(1250000), '$1.250.000');
  assert.equal(formatearMonto(900), '$900');
  assert.equal(formatearMonto(0), '$0');
  assert.equal(formatearMonto(-3000), '-$3.000');
});

// --- Un solo motor de "lo pequeño y repetido" -----------------------------
//
// Hubo dos: uno aquí, con un tope fijo de 15.000, y el de hormiga.js, que mide
// lo pequeño contra el gasto típico de cada persona y descuenta los cobros
// fijos. Con el tope fijo, un mes normal de pasajes de bus salía como un
// hallazgo. Estas pruebas están para que la copia no vuelva.

test('gastos.js no trae su propia versión del detector de hormigas', async () => {
  const modulo = await import('../src/services/gastos.js');

  for (const nombre of ['comprasChicas', 'textoDeComprasChicas', 'TOPE_CHICO']) {
    assert.equal(modulo[nombre], undefined, `gastos.js volvió a exportar ${nombre}`);
  }

  // Un umbral fijo de plata es la marca del motor burdo: lo que es pequeño
  // para alguien es la mitad de un mercado para otro. Se mira el código y no
  // los comentarios, que es donde queda escrito por qué se fue.
  const codigo = sinComentarios(leer('../src/services/gastos.js'));
  assert.ok(!/15[_.]?000/.test(codigo), 'volvió el tope fijo');
});

test('la pantalla del dinero usa hormiga.js, que es el entregable 1.7.4', () => {
  const pantalla = leer('../src/screens/Dinero.js');

  assert.match(pantalla, /from '\.\.\/services\/hormiga'/);
  assert.match(pantalla, /hallazgosDeGasto/);
  assert.ok(!/comprasChicas/.test(pantalla), 'la pantalla sigue con el motor viejo');
});

// --- La voz ---------------------------------------------------------------

test('ningún texto de gastos juzga, ordena ni grita', () => {
  const textos = [
    textoDelMes([], '2026-08'),
    textoDelMes([gasto()], '2026-08'),
    textoDelMes(MES, '2026-08'),
    analizarGasto('', { hoy: HOY }).mensaje,
    analizarGasto('almuerzo', { hoy: HOY }).mensaje,
    analizarGasto('regalo 50 mil', { hoy: HOY }).mensaje,
  ].filter(Boolean);

  const JUICIO =
    /\b(deber[íi]as|debes|ten[eé]s que|controla|ahorra|recorta|evita|deja de|no gastes|no compres|gastaste mucho|te pasaste|exceso|excesiv\w*|innecesari\w*|derroch\w*|despilfarr\w*|malgast\w*|culpa|fracaso|excusas)\b/i;

  for (const t of textos) {
    assert.ok(!JUICIO.test(t), `"${t}" juzga o manda`);
    assert.ok(!t.includes('!') && !t.includes('¡'), `"${t}" grita`);
    assert.ok(frases(t) <= 2, `"${t}" pasa de 2 frases`);
  }
});

// --- La pantalla ----------------------------------------------------------
//
// Los textos escritos a mano dentro de la pantalla no pasan por ninguna
// función, así que ninguna prueba los miraría. Y son justo los que alguien
// cambia de afán un martes.

const textosDeLaPantalla = () => {
  const codigo = leer('../src/screens/Dinero.js')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ');

  return [
    ...[...codigo.matchAll(/'([^'\\\n]{6,})'/g)].map((m) => m[1]),
    // Solo el texto que termina en una etiqueta de cierre: sin eso, un
    // `length > 0 &&` del código entra como si fuera una frase de la app.
    ...[...codigo.matchAll(/>\s*([^<>{}\n][^<>{}]*?)\s*<\//g)].map((m) => m[1].trim()),
  ].filter((t) => /\s/.test(t) && /[a-záéíóúñ]/i.test(t));
};

test('la pantalla del dinero no grita ni regaña', () => {
  const PROHIBIDO =
    /\b(te pasaste|deber[íi]as|debes|controla|ahorra|recorta|deja de|no gastes|no compres|gastaste mucho|excesiv\w*|innecesari\w*|derroch\w*|despilfarr\w*|malgast\w*|culpable|fracaso|excusas|cuidado|alerta|peligro)\b/i;

  const textos = textosDeLaPantalla();
  assert.ok(textos.length > 10, `solo encontré ${textos.length} textos en la pantalla`);

  for (const t of textos) {
    assert.ok(!t.includes('!') && !t.includes('¡'), `"${t}" grita`);
    assert.ok(!PROHIBIDO.test(t), `"${t}" regaña o manda`);
  }
});

test('la pantalla promete lo que el servidor cumple: la foto no se guarda', () => {
  assert.match(leer('../src/screens/Dinero.js'), /La foto no se guarda/);
});

test('el mes sin nada anotado no reclama nada', () => {
  const texto = textoDelMes([], '2026-08');
  assert.ok(!/olvidaste|no has|llevas sin|perdiste/i.test(texto), texto);
  assert.match(texto, /cuando anotes/i);
});

// --- La pantalla contra lo que de verdad existe ---------------------------
//
// Estas tres no miran lo que la pantalla hace, sino si lo que llama existe.
// Es el defecto que ninguna prueba de reglas puede ver: la pantalla pedía
// `agregarGasto`, `quitarGasto` y `fijarPresupuesto`, que no existen, y como
// caía en un respaldo local en `useState`, todo "funcionaba" hasta que la
// persona salía de la pantalla y sus gastos ya no estaban.

// Lo que UsuarioContext pone de verdad en el valor del contexto: las claves
// del estado más las que añade el `useMemo`, que van a seis espacios de
// sangría. Cuentan las dos formas de escribirlas: `nombre:` y `nombre,`.
const expuestoPorElContexto = () => {
  const contexto = leer('../src/state/UsuarioContext.js');
  return new Set([
    ...Object.keys(estadoInicial),
    ...[...contexto.matchAll(/^ {6}([A-Za-z_$][\w$]*)\s*[:,]/gm)].map((m) => m[1]),
  ]);
};

const sacadoDelContexto = (pantalla) => {
  const bloque = pantalla.match(/const\s*\{([^}]*)\}\s*=\s*useUsuario\(\)/);
  assert.ok(bloque, 'la pantalla no saca nada de useUsuario()');

  return bloque[1]
    .split(',')
    .map((parte) => (parte.split(':')[1] ?? parte.split(':')[0]).trim())
    .filter(Boolean);
};

test('la pantalla pide al contexto solo nombres que el contexto tiene', () => {
  const pantalla = leer('../src/screens/Dinero.js');
  const hay = expuestoPorElContexto();

  for (const nombre of sacadoDelContexto(pantalla)) {
    assert.ok(hay.has(nombre), `UsuarioContext no expone "${nombre}"`);
  }

  // Y los tres del dinero se usan de verdad, no solo se sacan.
  for (const nombre of ['anotarGasto', 'borrarGasto', 'guardarPresupuesto']) {
    assert.match(pantalla, new RegExp(`${nombre}\\(`), `la pantalla no llama a ${nombre}()`);
  }
});

test('no hay copia local de los gastos ni del presupuesto', () => {
  // Un respaldo en `useState` esconde el fallo de arriba y encima pierde los
  // datos al salir: no llegan al reducer, ni al disco, ni a la cola.
  const pantalla = leer('../src/screens/Dinero.js');

  assert.ok(!/setLocal|local\.(gastos|presupuesto)/.test(pantalla), 'volvió el respaldo local');
  // `presupuesto` del contexto siempre es un objeto: cualquier `?? algo`
  // detrás de él es código muerto que nunca se lee.
  assert.ok(!/presupuesto\s*\?\?\s*local/.test(pantalla));
});

test('la pantalla solo importa de api.js lo que api.js exporta', () => {
  // `api.leerFactura?.()` dejaba el botón muerto y le echaba la culpa a la
  // señal: el optional call se traga que la función no exista.
  const pantalla = leer('../src/screens/Dinero.js');
  const api = leer('../src/lib/api.js');

  const exporta = new Set(
    [...api.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z_$][\w$]*)/g)].map(
      (m) => m[1],
    ),
  );

  const traidos = pantalla.match(/import\s*\{([^}]*)\}\s*from\s*'\.\.\/lib\/api'/);
  assert.ok(traidos, 'la pantalla no importa la API por nombre');

  for (const parte of traidos[1].split(',')) {
    const nombre = (parte.split(/\s+as\s+/)[0] ?? '').trim();
    if (nombre) assert.ok(exporta.has(nombre), `src/lib/api.js no exporta "${nombre}"`);
  }

  // Sin API no es lo mismo que sin red, y no se dice igual.
  assert.match(pantalla, /hayApi/);
});

// --- El esquema: lo que la capa de datos escribe tiene que existir --------

test('las tablas que lee la capa de datos existen en el SQL', () => {
  // La migración creaba `presupuesto` en singular y repositorio.js escribe en
  // `presupuestos`. Guardar el tope devolvía error y la cola reintentaba para
  // siempre, en silencio.
  const sql = [
    '../supabase/schema.sql',
    '../supabase/migrations/004_habitos.sql',
    '../supabase/migrations/005_gastos.sql',
    '../supabase/migrations/006_pareja.sql',
  ]
    .map(leer)
    .join('\n');

  const creadas = new Set(
    [...sql.matchAll(/create table (?:if not exists )?([a-z_]+)/g)].map((m) => m[1]),
  );

  const usadas = new Set(
    [...leer('../src/lib/repositorio.js').matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]),
  );

  for (const tabla of usadas) {
    assert.ok(creadas.has(tabla), `repositorio.js usa "${tabla}" y ningún .sql la crea`);
  }

  assert.ok(usadas.has('gastos') && usadas.has('presupuestos'), 'las dos del dinero');
});

test('el id de un gasto es texto, porque lo pone la app y no la base', () => {
  // La app manda 'g-1' a propósito: es lo que permite anotar sin señal y
  // borrar después sin haber hablado nunca con el servidor. Con `uuid`,
  // Postgres lo rechaza y ningún gasto llega jamás a la nube.
  const bloque = leer('../supabase/migrations/005_gastos.sql').match(
    /create table if not exists gastos \(([\s\S]*?)\n\);/,
  );

  assert.ok(bloque, 'no encontré la tabla gastos');
  assert.match(bloque[1], /^\s*id\s+text\b/m);
  assert.ok(!/gen_random_uuid/.test(bloque[1]), 'el id lo vuelve a generar la base');

  // Y 'g-1' es único DENTRO de una persona, no en toda la tabla.
  assert.match(bloque[1], /primary key \(user_id, id\)/);
});
