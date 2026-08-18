import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizar, buscarGuia, guiaDe } from '../src/services/guias.js';
import { GUIAS } from '../src/data/guias.js';

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
  assert.equal(buscarGuia('Sentadilla búlgara').nombre, 'Sentadilla a la silla');
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
