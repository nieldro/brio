import test from 'node:test';
import assert from 'node:assert/strict';

import { validarPlato, COLORES } from '../src/lib/platoJson.js';
import { extraerJson } from '../src/lib/planJson.js';

const BUENO = {
  plato: 'Arroz con pollo y ensalada',
  color: 'verde',
  suma: 'Acompáñalo con algo fresco de color',
  mensaje: 'Se ve completo. Así vas bien.',
};

const con = (cambios) => validarPlato({ ...BUENO, ...cambios });

// --- Lo que sí pasa -------------------------------------------------------

test('una respuesta limpia pasa y llega normalizada', () => {
  const r = validarPlato({ ...BUENO, plato: '  Arroz con pollo  ' });

  assert.equal(r.ok, true);
  assert.deepEqual(r.errores, []);
  assert.equal(r.resultado.hayPlato, true);
  assert.equal(r.resultado.plato, 'Arroz con pollo');
  assert.equal(r.resultado.color, 'verde');
});

test('los tres colores del semáforo son válidos', () => {
  for (const color of COLORES) {
    assert.equal(con({ color }).ok, true, color);
  }
});

test('sirve con el JSON envuelto en comillas de markdown', () => {
  const crudo = '```json\n' + JSON.stringify(BUENO) + '\n```';
  assert.equal(validarPlato(extraerJson(crudo)).ok, true);
});

test('"aquí no hay comida" es una respuesta válida, no un fallo', () => {
  const r = validarPlato({ plato: null });

  assert.equal(r.ok, true);
  assert.equal(r.resultado.hayPlato, false);
});

// --- La regla 1: nunca calorías -------------------------------------------
// Esta es la razón de existir del archivo. El prompt lo pide; esto lo obliga.

test('rechaza cualquier cifra de comida', () => {
  const salidas = [
    'Tiene unas 600 calorías',
    'Son 600 kcal aproximadamente',
    'Unos 40 gramos de proteína',
    'Calcula 250 ml de jugo',
    'Le faltan proteínas',
    'Muchos carbohidratos para la noche',
    'Prueba un ayuno de 16 horas',
  ];

  for (const mensaje of salidas) {
    const r = con({ mensaje });
    assert.equal(r.ok, false, `debería rechazar: ${mensaje}`);
    assert.ok(
      r.errores.some((e) => e.includes('cantidades')),
      `${mensaje} → ${r.errores.join('; ')}`,
    );
  }
});

test('las cifras tampoco pasan escondidas en la suma o en el nombre', () => {
  assert.equal(con({ suma: 'Súmale 200 gramos de verdura' }).ok, false);
  assert.equal(con({ plato: 'Pechuga de 150 gramos' }).ok, false);
});

// --- Nada de juicio -------------------------------------------------------

test('rechaza calificar la comida', () => {
  const salidas = [
    'Eso engorda mucho',
    'Es comida chatarra',
    'Evita el frito la próxima',
    'Deberías quitarle el arroz',
    'Ese plato está malo',
    'No entra en tu dieta',
  ];

  for (const mensaje of salidas) {
    assert.equal(con({ mensaje }).ok, false, `debería rechazar: ${mensaje}`);
  }
});

test('rechaza el verbo conjugado, no solo la forma de diccionario', () => {
  // La primera versión solo atrapaba "evita" y dejaba pasar "evitar" y
  // "evitando", que dicen exactamente lo mismo.
  for (const mensaje of ['Trata de evitar el pan', 'Vas evitando lo frito, bien']) {
    assert.equal(con({ mensaje }).ok, false, mensaje);
  }
});

test('rechaza hablar del cuerpo o del peso', () => {
  const salidas = [
    'Con esto no vas a bajar de peso',
    'Tu cuerpo necesita otra cosa',
    'Ideal para el sobrepeso',
  ];

  for (const mensaje of salidas) {
    assert.equal(con({ mensaje }).ok, false, `debería rechazar: ${mensaje}`);
  }
});

// --- Voz de Brío ----------------------------------------------------------

test('rechaza los signos de admiración', () => {
  assert.equal(con({ mensaje: 'Qué buen plato.' }).ok, true);
  assert.equal(con({ mensaje: 'Qué buen plato!' }).ok, false);
  assert.equal(con({ suma: '¡Súmale agua!' }).ok, false);
});

test('rechaza pasar de dos frases', () => {
  assert.equal(con({ mensaje: 'Se ve bien. Con eso vas.' }).ok, true);

  const r = con({ mensaje: 'Se ve bien. Con eso vas. Nos vemos mañana.' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => e.includes('2 frases')));
});

test('rechaza las palabras prohibidas del documento', () => {
  assert.equal(con({ mensaje: 'Eso es un fracaso.' }).ok, false);
  assert.equal(con({ suma: 'Súmale algo para quemar grasa' }).ok, false);
});

// --- Estructura -----------------------------------------------------------

test('rechaza un color que no es del semáforo', () => {
  const r = con({ color: 'azul' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => e.includes('color inválido')));
});

test('rechaza los campos que faltan', () => {
  assert.equal(validarPlato({ plato: 'Arroz', color: 'verde' }).ok, false);
  assert.equal(con({ suma: '   ' }).ok, false);
});

test('rechaza los textos larguísimos', () => {
  assert.equal(con({ mensaje: 'a'.repeat(300) }).ok, false);
});

test('no revienta con basura', () => {
  for (const basura of [null, undefined, 'texto suelto', 42, []]) {
    const r = validarPlato(basura);
    assert.equal(typeof r.ok, 'boolean');
    if (r.ok) assert.equal(r.resultado.hayPlato, false);
  }
});

test('"no hay comida" y "no entendí la respuesta" no son lo mismo', () => {
  // Confundirlos sería lo peor: un fallo del modelo se le mostraría a la
  // persona como "en tu foto no hay comida", y no se reintentaría.
  const sinComida = validarPlato({ plato: null });
  assert.equal(sinComida.ok, true);
  assert.equal(sinComida.resultado.hayPlato, false);

  const ilegible = validarPlato(extraerJson('lo siento, no puedo ayudarte con eso'));
  assert.equal(ilegible.ok, false);
  assert.equal(ilegible.resultado, null);
});
