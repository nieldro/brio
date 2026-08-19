import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  MINIMO_GASTOS,
  MINIMO_APARICIONES,
  MINIMO_COBROS,
  MAXIMO_HALLAZGOS,
  TITULO_HORMIGAS,
  TITULO_SUSCRIPCIONES,
  gastoTipico,
  umbralPequeno,
  mediana,
  hormigas,
  suscripciones,
  analizarGastos,
  hallazgosDeGasto,
  textoDeHormiga,
  textoDeSuscripcion,
  textoSinHallazgos,
  formatoMonto,
} from '../src/services/hormiga.js';
import { claveDia } from '../src/services/fecha.js';

// Miércoles 19 de agosto de 2026.
const HOY = new Date(2026, 7, 19);
const clave = (n) => claveDia(new Date(2026, 7, 19 - n));

let contador = 0;
const g = (atras, monto, categoria, nota, recurrente = false) => {
  contador += 1;
  return { id: `g-${contador}`, fecha: clave(atras), monto, categoria, nota, recurrente };
};

const repetir = (dias, monto, categoria, nota) =>
  dias.map((d) => g(d, monto, categoria, nota));

const frasesDe = (texto) =>
  String(texto)
    .replace(/(\d)\.(\d)/g, '$1$2')
    .split(/[.!?]+/)
    .filter((f) => f.trim());

// Un mes de una persona real: el mercado semanal, el café casi diario, el bus
// y tres cosas sueltas.
const MES = [
  ...repetir([28, 21, 14, 7], 90000, 'mercado', 'mercado'),
  ...repetir([1, 3, 5, 8, 10, 12, 15, 17, 20], 4000, 'antojos', 'café'),
  ...repetir([2, 4, 6, 11], 2500, 'transporte', 'bus'),
  g(9, 30000, 'salud', 'farmacia'),
  g(16, 25000, 'ocio', 'cine'),
  g(23, 40000, 'casa', 'gas'),
];

const buscar = (lista, clv) => lista.find((h) => h.clave === clv);

// --- La disciplina de la evidencia ---------------------------------------

test('con cuatro apuntes no se opina de nada', () => {
  const pocos = repetir([1, 2, 3, 4], 4000, 'antojos', 'café');
  assert.ok(pocos.length < MINIMO_GASTOS);

  assert.deepEqual(hormigas(pocos, HOY), []);
  assert.equal(analizarGastos(pocos, HOY).suficiente, false);
});

test('con dos apariciones no hay patrón, hay casualidad', () => {
  const conDos = [
    ...MES.filter((x) => x.nota !== 'café'),
    ...repetir([1, 3], 4000, 'antojos', 'café'),
  ];

  assert.ok(conDos.length >= MINIMO_GASTOS, 'el historial sí alcanza');
  assert.ok(MINIMO_APARICIONES > 2, 'el mínimo tiene que ser mayor que dos');
  assert.equal(buscar(hormigas(conDos, HOY), 'cafe'), undefined);
});

test('devolver una lista vacía es una respuesta correcta', () => {
  // Alguien que solo apunta gastos grandes y distintos entre sí: no hay nada
  // pequeño ni repetido, y la respuesta honesta es que no hay nada.
  const grandes = [
    g(2, 800000, 'casa', 'arriendo'),
    g(5, 200000, 'casa', 'servicios'),
    g(8, 150000, 'salud', 'consulta'),
    g(11, 90000, 'mercado', 'mercado'),
    g(14, 70000, 'ocio', 'salida'),
    g(17, 60000, 'transporte', 'gasolina'),
    g(20, 120000, 'casa', 'internet'),
    g(23, 95000, 'mercado', 'mercado dos'),
    g(26, 45000, 'salud', 'farmacia'),
    g(29, 55000, 'ocio', 'concierto'),
    g(32, 40000, 'otros', 'regalo'),
    g(35, 30000, 'otros', 'papeleria'),
  ];

  assert.deepEqual(hormigas(grandes, HOY), []);
  assert.equal(analizarGastos(grandes, HOY).suficiente, true);
  assert.match(textoSinHallazgos(true), /no hay nada peque/i);
});

// --- Lo pequeño y repetido ------------------------------------------------

test('encuentra lo pequeño que se repite, con sus veces y su total', () => {
  const encontradas = hormigas(MES, HOY);
  const cafe = buscar(encontradas, 'cafe');

  assert.ok(cafe, 'no encontró el café');
  assert.equal(cafe.veces, 9);
  assert.equal(cafe.dias, 9);
  assert.equal(cafe.total, 36000);
  assert.equal(cafe.etiqueta, 'café');
});

test('lo grande y repetido no es una hormiga', () => {
  // El mercado aparece cuatro veces y es lo que más suma. No es un gasto
  // pequeño que se coló: es la comida.
  assert.equal(buscar(hormigas(MES, HOY), 'mercado'), undefined);
});

test('vienen ordenadas por lo que sumaron, que es la pregunta real', () => {
  const encontradas = hormigas(MES, HOY);
  assert.ok(encontradas.length >= 2);

  for (let i = 1; i < encontradas.length; i += 1) {
    assert.ok(encontradas[i - 1].total >= encontradas[i].total);
  }
  assert.equal(encontradas[0].clave, 'cafe');
});

test('el umbral sale de la persona: la misma vida a otra escala da lo mismo', () => {
  // La prueba de que "pequeño" no es un número inventado. Quien gasta en
  // millones tiene sus propios gastos pequeños.
  const cien = MES.map((x) => ({ ...x, monto: x.monto * 100 }));

  const unos = hormigas(MES, HOY);
  const otros = hormigas(cien, HOY);

  assert.deepEqual(
    otros.map((h) => h.clave),
    unos.map((h) => h.clave),
  );
  assert.deepEqual(
    otros.map((h) => h.total),
    unos.map((h) => h.total * 100),
  );
});

test('muchos gastos pequeños no suben la vara hasta esconderse solos', () => {
  // El fallo que casi se cuela: contando compras, veinte cafés arrastran la
  // mediana hasta el precio del café, el umbral cae por debajo y justo lo que
  // se busca desaparece. El gasto típico se mide por COSA, no por compra.
  const dominado = [
    ...repetir(
      Array.from({ length: 20 }, (_, i) => i + 1),
      4000,
      'antojos',
      'café',
    ),
    ...repetir([5, 12, 19], 90000, 'mercado', 'mercado'),
  ];

  assert.equal(mediana(dominado.map((x) => x.monto)), 4000, 'por compra la mediana es el café');
  assert.ok(gastoTipico(dominado) > 4000, 'por cosa, no');
  assert.ok(umbralPequeno(dominado) > 4000);
  assert.ok(buscar(hormigas(dominado, HOY), 'cafe'), 'el café tenía que aparecer');
});

test('lo que la persona marcó como cobro fijo no se cuenta dos veces', () => {
  const conApp = [...MES, ...repetir([1, 2, 3, 4, 5], 8000, 'suscripciones', 'app')].map((x) =>
    x.nota === 'app' ? { ...x, recurrente: true } : x,
  );

  assert.equal(buscar(hormigas(conApp, HOY), 'app'), undefined, 'salió como hormiga');
  assert.ok(buscar(suscripciones(conApp, HOY), 'app'), 'y no salió como cobro fijo');
});

// --- Lo que se cobra solo -------------------------------------------------

const STREAMING = [
  g(96, 26000, 'suscripciones', 'streaming'),
  g(66, 25500, 'suscripciones', 'streaming'),
  g(35, 26000, 'suscripciones', 'streaming'),
  g(5, 26000, 'suscripciones', 'streaming'),
];

test('tres cobros mensuales iguales sí son una suscripción', () => {
  const s = buscar(suscripciones(STREAMING, HOY), 'streaming');

  assert.ok(s);
  assert.equal(s.monto, 26000);
  assert.equal(s.veces, 4);
  assert.equal(s.declarada, false);
  assert.ok(MINIMO_COBROS >= 3);
});

test('dos cobros no son una periodicidad, son dos cobros', () => {
  assert.deepEqual(suscripciones(STREAMING.slice(2), HOY), []);
});

test('cobros mensuales de cantidades muy distintas no son un cobro fijo', () => {
  const irregular = [
    g(96, 26000, 'ocio', 'salidas'),
    g(66, 60000, 'ocio', 'salidas'),
    g(35, 120000, 'ocio', 'salidas'),
    g(5, 45000, 'ocio', 'salidas'),
  ];

  assert.deepEqual(suscripciones(irregular, HOY), []);
});

test('algo que se repite cada semana no se llama mensual', () => {
  const semanal = repetir([28, 21, 14, 7], 30000, 'mercado', 'mercado');
  assert.deepEqual(suscripciones(semanal, HOY), []);
});

test('un mes sin apuntar no borra la evidencia que ya estaba', () => {
  // Se mira la racha más larga de cobros mensuales, no todos los saltos: el
  // mes que no se apuntó parte la cadena, y con exigir la cadena entera
  // perfecta se perdían cobros que sí existen.
  const conOlvido = [
    g(126, 26000, 'suscripciones', 'streaming'),
    g(96, 26000, 'suscripciones', 'streaming'),
    g(66, 26000, 'suscripciones', 'streaming'),
    // el mes de aquí no se apuntó
    g(5, 26000, 'suscripciones', 'streaming'),
  ];

  assert.ok(buscar(suscripciones(conOlvido, HOY), 'streaming'));
});

test('con la cadena rota y sin tres cobros seguidos, no se afirma nada', () => {
  // El error preferido es callarse. Y si de verdad es una suscripción, la
  // persona puede marcarla como cobro fijo y se le cree de una.
  const partido = [
    g(126, 26000, 'suscripciones', 'streaming'),
    g(96, 26000, 'suscripciones', 'streaming'),
    g(35, 26000, 'suscripciones', 'streaming'),
    g(5, 26000, 'suscripciones', 'streaming'),
  ];

  assert.deepEqual(suscripciones(partido, HOY), []);
  assert.ok(
    buscar(suscripciones(partido.map((x) => ({ ...x, recurrente: true })), HOY), 'streaming'),
  );
});

test('lo que la persona declaró recurrente se cree, aunque solo haya uno', () => {
  const s = buscar(suscripciones([g(3, 12000, 'suscripciones', 'nube', true)], HOY), 'nube');

  assert.ok(s);
  assert.equal(s.declarada, true);
  assert.equal(s.monto, 12000);
});

// --- Todo junto -----------------------------------------------------------

test('los hallazgos vienen recortados: una lista larga se lee como una lista de reproches', () => {
  const variado = [
    g(2, 800000, 'casa', 'arriendo'),
    g(6, 200000, 'casa', 'servicios'),
    g(10, 150000, 'salud', 'consulta'),
    g(14, 90000, 'mercado', 'mercado'),
    ...repetir([1, 3, 5, 8], 4000, 'antojos', 'café'),
    ...repetir([2, 4, 7, 9], 2500, 'transporte', 'bus'),
    ...repetir([3, 6, 11, 13], 1500, 'antojos', 'dulce'),
    ...repetir([1, 5, 9, 12], 3000, 'transporte', 'parqueo'),
  ];

  assert.ok(hormigas(variado, HOY).length > MAXIMO_HALLAZGOS);

  const salida = hallazgosDeGasto(variado, HOY);
  const deHormigas = salida.filter((h) => h.grupo === 'hormigas');

  assert.equal(deHormigas.length, MAXIMO_HALLAZGOS);
  for (const h of salida) {
    assert.ok(h.clave && h.titulo && h.texto);
  }
});

test('no revienta con datos ausentes ni con basura', () => {
  assert.doesNotThrow(() => analizarGastos());
  assert.doesNotThrow(() => hormigas(undefined, HOY));
  assert.doesNotThrow(() => suscripciones([{}, { monto: 'x' }, null].filter(Boolean), HOY));
  assert.doesNotThrow(() => gastoTipico([]));

  assert.deepEqual(analizarGastos().hormigas, []);
  assert.equal(gastoTipico([]), 0);
});

test('lo de hace medio año no entra en la ventana', () => {
  const viejos = repetir([200, 202, 204, 206, 208, 210, 212, 214, 216, 218, 220, 222], 4000, 'antojos', 'café');
  assert.deepEqual(hormigas(viejos, HOY), []);
});

// --- La voz, que aquí es lo más delicado ----------------------------------

const TEXTOS = [
  ...hormigas(MES, HOY).map(textoDeHormiga),
  ...suscripciones(STREAMING, HOY).map(textoDeSuscripcion),
  textoDeSuscripcion({ declarada: true, monto: 12000, veces: 1 }),
  textoSinHallazgos(true),
  textoSinHallazgos(false),
  TITULO_HORMIGAS,
  TITULO_SUSCRIPCIONES,
];

test('ningún texto dice qué quitar: la app informa, no ordena', () => {
  const ORDEN =
    /\b(deja de|dejar de|quita|quitar|elimina|eliminar|recorta|recortar|corta|ahorra|no gastes|evita|reduce|reducir)\b/i;

  for (const texto of TEXTOS) {
    assert.ok(!ORDEN.test(texto), `"${texto}" le está diciendo qué hacer`);
  }
});

test('ningún texto juzga ni pone adjetivos al gasto', () => {
  const JUICIO =
    /innecesari|absurd|excesiv|de m[áa]s|te pasaste|malgast|derroch|despilfarr|deber[íi]as|fracaso|excusas|culpa/i;

  for (const texto of TEXTOS) {
    assert.ok(!JUICIO.test(texto), `"${texto}" juzga`);
    assert.ok(!texto.includes('!'), `"${texto}" grita`);
    assert.ok(frasesDe(texto).length <= 2, `"${texto}" son más de dos frases`);
  }
});

test('ningún texto proyecta ni compara con nadie', () => {
  const PROYECTA = /al a[ñn]o|en un a[ñn]o|podr[íi]as ahorrar|la gente|otras personas|el promedio de/i;

  for (const texto of TEXTOS) {
    assert.ok(!PROYECTA.test(texto), `"${texto}" proyecta o compara`);
  }
});

test('la palabra "hormiga" no sale nunca en pantalla', () => {
  // Es el nombre del módulo, no el nombre de lo que se le dice a la persona:
  // con dedo señalando incluido, y aquí es solo un dato.
  for (const texto of TEXTOS) {
    assert.ok(!/hormiga/i.test(texto), `"${texto}"`);
  }
});

test('lo que se dice está en pasado y son solo hechos', () => {
  const cafe = textoDeHormiga(buscar(hormigas(MES, HOY), 'cafe'));

  assert.match(cafe, /9 veces/);
  assert.match(cafe, new RegExp(formatoMonto(36000).replace('.', '\\.')));
  assert.match(cafe, /fueron/, 'tiene que estar en pasado');
});

test('no haber apuntado nada no se reclama', () => {
  const texto = textoSinHallazgos(false);
  assert.ok(!/deber[íi]as|apunta m[áa]s|no has|olvidaste/i.test(texto), `"${texto}"`);
  assert.match(texto, /no corre prisa/i);
});

// --- Que esto llegue a alguien, y a UNA sola persona ---------------------
//
// Un módulo entero, probado y sin una sola pantalla que lo pinte, es un
// entregable que no existe. Pero pintarlo en DOS es peor: hormiga.js corta
// en tres hallazgos justo porque una lista larga se lee como una lista de
// reproches, y repetir esa lista en dos pantallas deshace esa contención en
// lo más delicado de tono de toda la app.
//
// Por eso la prueba no nombra una pantalla: recorre todas y exige exactamente
// una. Antes apuntaba a Ahorro.js y por eso no vio que Dinero.js pintaba lo
// mismo.

const CARPETA = new URL('../src/screens/', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);

const pantallas = readdirSync(CARPETA)
  .filter((n) => n.endsWith('.js'))
  .map((n) => ({ nombre: n, texto: readFileSync(join(CARPETA, n), 'utf8') }));

const consumidoras = pantallas.filter((p) => /from '\.\.\/services\/hormiga'/.test(p.texto));

test('los hallazgos los pinta una pantalla, y solo una', () => {
  assert.equal(
    consumidoras.length,
    1,
    `lo pintan ${consumidoras.length}: ${consumidoras.map((p) => p.nombre).join(', ') || 'ninguna'}`,
  );
});

test('la pantalla que los pinta los pide y los enseña', () => {
  const { texto } = consumidoras[0];

  assert.match(texto, /hallazgosDeGasto\(/, 'los hallazgos no se piden');

  for (const titulo of ['TITULO_HORMIGAS', 'TITULO_SUSCRIPCIONES']) {
    // Importado y además puesto en el JSX: importarlo y no pintarlo deja el
    // título viviendo en un archivo que nadie ve.
    assert.match(texto, new RegExp(`${titulo}\\b`), `falta ${titulo}`);
    assert.match(texto, new RegExp(`\\{${titulo}\\}|titulo: ${titulo}`), `${titulo} no se pinta`);
  }
});

// Los comentarios se quitan antes de buscar reproches. Si no, la propia
// cabecera de Dinero.js —que dice "aquí no hay alarmas rojas, ni 'te
// pasaste'"— hacía fallar la prueba por explicar la regla que cumple.
const sinComentarios = (codigo) =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');

test('la pantalla no reescribe los textos del módulo', () => {
  // Los títulos y las frases se redactan aquí, con las reglas al lado. Una
  // pantalla que escriba las suyas es por donde vuelve a colarse el reproche.
  const { texto } = consumidoras[0];

  assert.match(texto, /<Etiqueta>\{TITULO_/, 'el título de la sección no sale del módulo');
  assert.match(texto, /\{h\.texto\}/, 'la frase del hallazgo no sale del módulo');
  assert.ok(
    !/gastaste|te pasaste|deber[íi]as|innecesari|malgast/i.test(sinComentarios(texto)),
    'la pantalla escribe un reproche que el módulo no escribiría',
  );
});
