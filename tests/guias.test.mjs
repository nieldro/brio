import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizar, buscarGuia, guiaDe, busquedaDeVideo } from '../src/services/guias.js';
import { GUIAS } from '../src/data/guias.js';
import { POSTURAS, POSTURA_POR_DEFECTO } from '../src/data/posturas.js';
import { todosLosNombres, ejerciciosDe } from '../azure-functions/src/lib/catalogo.js';

// --- Normalización --------------------------------------------------------

test('normaliza tildes, mayúsculas y signos', () => {
  assert.equal(normalizar('Elevación de Talón'), 'elevacion de talon');
  assert.equal(normalizar('Flexiones (en la pared)'), 'flexiones en la pared');
  assert.equal(normalizar('  Puente   de  glúteos  '), 'puente de gluteos');
  assert.equal(normalizar(undefined), '');
});

// --- Emparejamiento con nombres reales de la IA ---------------------------

// Estos son los nombres que Gemini generó de verdad en el primer plan real.
// Si el emparejamiento se rompe, el usuario pierde la guía sin que nada falle.
const NOMBRES_REALES = [
  ['Movilidad articular', 'Movilidad articular'],
  ['Caminata en el sitio', 'Caminata'],
  ['Sentadillas a una silla', 'Sentadilla a la silla'],
  ['Elevaciones de talón', 'Elevación de talones'],
  ['Estiramiento suave', 'Estiramiento'],
  ['Estiramientos suaves', 'Estiramiento'],
  ['Pasos laterales', 'Pasos laterales'],
  ['Flexiones en la pared', 'Flexiones en la pared'],
  ['Estiramiento de torso', 'Estiramiento'],
  ['Puente de glúteos', 'Puente de glúteos'],
  ['Marcha suave en el lugar', 'Caminata'],
  ['Estiramientos finales', 'Estiramiento'],
  ['Caminata tranquila', 'Caminata'],
  ['Respiración y movilidad', 'Respiración'],
];

test('empareja los nombres que la IA generó de verdad', () => {
  for (const [nombreIA, esperado] of NOMBRES_REALES) {
    const g = buscarGuia(nombreIA);
    assert.ok(g, `"${nombreIA}" se quedó sin guía`);
    assert.equal(g.nombre, esperado, `"${nombreIA}" cayó en la guía equivocada`);
  }
});

test('gana la clave más específica, no la primera que aparezca', () => {
  // "paso lateral" tiene que ganarle a "marcha".
  assert.equal(buscarGuia('Pasos laterales').nombre, 'Pasos laterales');

  // "sentadilla bulgara" le gana a "sentadilla" a secas, que es otra cosa.
  assert.equal(buscarGuia('Sentadilla búlgara').nombre, 'Sentadilla búlgara');
  assert.equal(buscarGuia('Sentadilla a la silla').nombre, 'Sentadilla a la silla');

  // Estos tres comparten palabra con guías más generales y tienen que ganar.
  assert.equal(buscarGuia('Jalón al pecho').nombre, 'Jalón al pecho');
  assert.equal(buscarGuia('Press de hombro').nombre, 'Press de hombro');
  assert.equal(buscarGuia('Curl de bíceps').nombre, 'Curl de bíceps');
  assert.equal(buscarGuia('Polea de tríceps').nombre, 'Polea de tríceps');
});

test('sin coincidencia devuelve null, no una guía al azar', () => {
  assert.equal(buscarGuia('Burpee con salto'), null);
  assert.equal(buscarGuia(''), null);
  assert.equal(buscarGuia(undefined), null);
});

// --- Siempre hay algo que mostrar ----------------------------------------

test('un ejercicio desconocido recibe el consejo genérico, no técnica inventada', () => {
  const g = guiaDe({ nombre: 'Burpee con salto', detalle: '3 series de 10' });
  assert.equal(g.esGenerica, true);
  assert.equal(g.nombre, 'Burpee con salto');
  assert.ok(g.como.length > 0);
  assert.ok(g.cuidado.length > 0);
  assert.ok(g.masFacil.length > 0);
});

test('un ejercicio conocido trae su guía propia', () => {
  const g = guiaDe({ nombre: 'Sentadillas a una silla' });
  assert.equal(g.esGenerica, false);
  assert.equal(g.nombre, 'Sentadilla a la silla');
});

test('no revienta sin ejercicio', () => {
  assert.doesNotThrow(() => guiaDe(undefined));
  assert.doesNotThrow(() => guiaDe({}));
});

// --- Calidad y seguridad de la biblioteca --------------------------------

test('toda guía tiene su animación, y existe de verdad', () => {
  // Una figura mal escrita cae en la de por defecto sin avisar, y el
  // ejercicio se enseñaría con un movimiento que no es el suyo.
  const conocidas = new Set(Object.keys(POSTURAS));

  for (const g of GUIAS) {
    assert.ok(g.figura, `${g.nombre} no dice qué animación lo dibuja`);
    assert.ok(conocidas.has(g.figura), `${g.nombre} apunta a "${g.figura}", que no existe`);
  }
});

test('la postura por defecto existe, que es la red de seguridad', () => {
  assert.ok(Object.keys(POSTURAS).includes(POSTURA_POR_DEFECTO));
});

test('cada postura son dos posturas de 22 números', () => {
  // El componente lee por posición: si a una le falta un número, la figura
  // se dibuja rota y no falla nada.
  for (const [nombre, posturas] of Object.entries(POSTURAS)) {
    assert.equal(posturas.length, 2, `${nombre} necesita postura de ida y de vuelta`);
    for (const p of posturas) {
      assert.equal(p.length, 22, `${nombre} tiene una postura de ${p.length} números`);
      assert.ok(p.every(Number.isFinite), `${nombre} tiene una coordenada que no es número`);
    }
  }
});

test('las dos posturas de un movimiento son distintas', () => {
  // Si fueran iguales no habría animación, solo un monigote quieto.
  for (const [nombre, [a, b]] of Object.entries(POSTURAS)) {
    assert.ok(a.some((n, i) => n !== b[i]), `${nombre} no se mueve`);
  }
});

test('toda guía tiene pasos, cuidado y una versión más fácil', () => {
  for (const g of GUIAS) {
    assert.ok(g.claves?.length, `${g.nombre} sin claves`);
    assert.ok(g.como?.length >= 2, `${g.nombre} necesita al menos dos pasos`);
    assert.ok(g.cuidado?.length > 0, `${g.nombre} sin qué cuidar`);
    assert.ok(g.masFacil?.length > 0, `${g.nombre} sin versión más fácil`);
  }
});

test('las claves están normalizadas, o nunca harían match', () => {
  for (const g of GUIAS) {
    for (const clave of g.claves) {
      assert.equal(clave, normalizar(clave), `la clave "${clave}" de ${g.nombre} trae tildes o mayúsculas`);
    }
  }
});

test('ninguna guía usa las palabras prohibidas ni promete resultados', () => {
  const PROHIBIDAS = [
    'fracaso',
    'excusas',
    'deberias',
    'quemar grasa',
    'cuerpo ideal',
    'sin dolor',
    'caloria',
    'adelgaz',
    'baja de peso',
  ];

  for (const g of GUIAS) {
    const todo = normalizar([g.nombre, ...g.como, g.cuidado, g.masFacil, g.respira ?? ''].join(' '));
    for (const mala of PROHIBIDAS) {
      assert.ok(!todo.includes(mala), `${g.nombre} usa "${mala}"`);
    }
  }
});

test('los ejercicios de riesgo avisan que necesitan supervisión', () => {
  // Regla dura del documento: nada de ejercicios de riesgo sin supervisión.
  const press = GUIAS.find((g) => g.nombre === 'Press de pecho');
  assert.match(press.cuidado, /alguien que te vea|supervis/i);
});

test('ninguna clave es tan corta que empareje cualquier cosa', () => {
  for (const g of GUIAS) {
    for (const clave of g.claves) {
      assert.ok(clave.length >= 4, `la clave "${clave}" de ${g.nombre} es demasiado corta`);
    }
  }
});

// --- El catálogo y la biblioteca no se pueden separar ---------------------
//
// El servidor le da al modelo una lista cerrada de ejercicios y le prohíbe
// inventar. Esa lista solo sirve si CADA nombre encuentra aquí su guía y su
// figura. Si alguien agrega uno al catálogo y se le olvida la guía, la
// persona abre "cómo se hace" y recibe el consejo genérico con un monigote
// que no es el de su ejercicio. Estas pruebas atan las dos puntas.

test('todo ejercicio del catálogo tiene guía escrita a mano', () => {
  const huerfanos = todosLosNombres().filter((nombre) => guiaDe({ nombre }).esGenerica);
  assert.deepEqual(huerfanos, [], 'ejercicios del catálogo sin guía');
});

test('todo ejercicio del catálogo tiene su animación', () => {
  const sinFigura = todosLosNombres().filter((nombre) => {
    const g = guiaDe({ nombre });
    return !g.figura || !Object.keys(POSTURAS).includes(g.figura);
  });
  assert.deepEqual(sinFigura, [], 'ejercicios del catálogo sin figura');
});

test('el nombre del catálogo cae en la guía que le toca, no en una parecida', () => {
  // "Curl de bíceps" comparte palabra con "Trabajo con mancuernas", y
  // "Jalón al pecho" con "Remo en máquina". Si el emparejamiento se afloja,
  // la persona ve la técnica de otro ejercicio.
  for (const nombre of todosLosNombres()) {
    const g = guiaDe({ nombre });
    assert.equal(g.nombre, nombre, `"${nombre}" cae en la guía de "${g.nombre}"`);
  }
});

test('cada lugar ofrece con qué armar un día completo', () => {
  for (const lugar of ['En casa', 'En el gym', 'Mezclado']) {
    const e = ejerciciosDe(lugar);
    assert.ok(e.calentamiento.length >= 1, `${lugar} sin con qué calentar`);
    assert.ok(e.fuerza.length >= 6, `${lugar} tiene pocos de fuerza`);
    assert.ok(e.cardio.length >= 2, `${lugar} tiene poco cardio`);
    assert.ok(e.cierre.length >= 1, `${lugar} sin con qué cerrar`);
  }
});

test('el catálogo entero sirve para quien no puede saltar', () => {
  // Si algún día entra un ejercicio de impacto, el plan de alguien con
  // restricción se rechazaría en el servidor y se quedaría sin plan.
  const impacto = /\b(salt\w*|brinc\w*|burpee\w*|correr|carrera|trote|trotar|sprint\w*)\b/i;
  const malos = todosLosNombres().filter((n) => impacto.test(n));
  assert.deepEqual(malos, [], 'el catálogo trae ejercicios de impacto');
});

// --- Video ----------------------------------------------------------------

test('el video es una búsqueda, nunca un enlace a un video concreto', () => {
  // Si alguien cambia esto por un id de YouTube, esta prueba lo para: un id
  // escrito a mano se muere y uno inventado por la IA lleva a cualquier parte.
  for (const g of GUIAS) {
    const url = busquedaDeVideo(g);
    assert.match(url, /^https:\/\/www\.youtube\.com\/results\?search_query=/);
    assert.ok(!/\/watch\?v=|youtu\.be\//.test(url), `${g.nombre} apunta a un video fijo`);
  }
});

test('la búsqueda lleva el nombre del movimiento', () => {
  const url = busquedaDeVideo({ nombre: 'Sentadilla a la silla' });
  assert.ok(decodeURIComponent(url).includes('Sentadilla a la silla'));
});

test('un ejercicio desconocido igual tiene búsqueda', () => {
  const url = busquedaDeVideo(guiaDe({ nombre: 'Burpee con salto' }));
  assert.ok(decodeURIComponent(url).includes('Burpee con salto'));
  assert.doesNotThrow(() => busquedaDeVideo(undefined));
});

test('la url queda bien formada aunque el nombre traiga tildes y espacios', () => {
  const url = busquedaDeVideo({ nombre: 'Elevación de talones & más' });
  assert.ok(!/\s/.test(url), 'la url no puede llevar espacios sin escapar');
  assert.doesNotThrow(() => new URL(url));
});

