import test from 'node:test';
import assert from 'node:assert/strict';

import { extraerJson, validarPlan } from '../src/lib/planJson.js';

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// Plan mínimo válido: 5 de entrenamiento y 2 de descanso.
function planBueno(cambios = {}) {
  return {
    semana: 1,
    nivel: 'inicio',
    mensaje_semana: 'Esta semana solo construimos el arranque.',
    dias: DIAS.map((dia, i) => ({
      dia,
      tipo: i >= 5 ? 'descanso' : 'entrenamiento',
      reto: `Reto de ${dia}`,
      duracion_min: i >= 5 ? 0 : 10,
      ejercicios: i >= 5 ? [] : [{ nombre: 'Caminata', detalle: '10 minutos a paso cómodo' }],
      comida_tip: 'Agrega un vaso de agua al despertar',
      mensaje: 'Hoy solo arrancamos. Con eso basta.',
    })),
    ...cambios,
  };
}

// --- extraerJson ----------------------------------------------------------

test('extraerJson lee JSON limpio', () => {
  assert.deepEqual(extraerJson('{"a":1}'), { a: 1 });
});

test('extraerJson quita las comillas de markdown que el modelo suele meter', () => {
  assert.deepEqual(extraerJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extraerJson('```\n{"a":1}\n```'), { a: 1 });
});

test('extraerJson ignora el texto que sobra alrededor', () => {
  assert.deepEqual(extraerJson('Claro, aquí tienes:\n{"a":1}\nEspero te sirva.'), { a: 1 });
});

test('extraerJson devuelve null cuando no hay JSON', () => {
  assert.equal(extraerJson('lo siento, no puedo'), null);
  assert.equal(extraerJson('{roto'), null);
  assert.equal(extraerJson(null), null);
});

// --- validarPlan ----------------------------------------------------------

test('un plan correcto pasa', () => {
  const r = validarPlan(planBueno(), { tiempoMax: 20 });
  assert.equal(r.ok, true, r.errores.join('; '));
  assert.equal(r.plan.dias.length, 7);
});

test('rechaza un plan que no tenga siete días', () => {
  const corto = planBueno();
  corto.dias = corto.dias.slice(0, 5);
  const r = validarPlan(corto, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.match(r.errores[0], /7 días/);
});

test('rechaza menos de dos días de descanso o suaves', () => {
  const duro = planBueno();
  duro.dias.forEach((d) => {
    d.tipo = 'entrenamiento';
    d.duracion_min = 10;
    d.ejercicios = [{ nombre: 'x', detalle: 'y' }];
  });
  const r = validarPlan(duro, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /mínimo 2 días/.test(e)));
});

test('rechaza un día más largo que el tiempo del usuario', () => {
  const largo = planBueno();
  largo.dias[0].duracion_min = 45;
  const r = validarPlan(largo, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /45 min supera/.test(e)));
});

test('rechaza tips con calorías, cantidades o ayuno', () => {
  for (const tip of [
    'Cuenta las calorías del almuerzo',
    'Come 200 gramos de pollo',
    'Prueba el ayuno de 16 horas',
    'Controla tus macros del día',
  ]) {
    const malo = planBueno();
    malo.dias[0].comida_tip = tip;
    const r = validarPlan(malo, { tiempoMax: 20 });
    assert.equal(r.ok, false, `debió rechazar: ${tip}`);
  }
});

test('rechaza textos con palabras prohibidas', () => {
  const culposo = planBueno();
  culposo.dias[2].mensaje = 'Sin dolor no hay resultado, no pongas excusas.';
  const r = validarPlan(culposo, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /excusas|sin dolor/i.test(e)));
});

test('rechaza tipos y días inválidos o repetidos', () => {
  const raro = planBueno();
  raro.dias[0].tipo = 'cardio_extremo';
  raro.dias[1].dia = 'lunes';
  const r = validarPlan(raro, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /tipo inválido/.test(e)));
  assert.ok(r.errores.some((e) => /repetido/.test(e)));
});

test('exige ejercicios en los días que no son descanso', () => {
  const vacio = planBueno();
  vacio.dias[0].ejercicios = [];
  const r = validarPlan(vacio, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /necesita ejercicios/.test(e)));
});

test('normaliza el color del semáforo que el formato no incluye', () => {
  const r = validarPlan(planBueno(), { tiempoMax: 20 });
  assert.equal(r.plan.dias[0].comida_color, 'verde');

  const conColor = planBueno();
  conColor.dias[0].comida_color = 'ambar';
  conColor.dias[1].comida_color = 'fucsia';
  const r2 = validarPlan(conColor, { tiempoMax: 20 });
  assert.equal(r2.plan.dias[0].comida_color, 'ambar');
  assert.equal(r2.plan.dias[1].comida_color, 'verde', 'un color inventado cae a verde');
});

test('no revienta con basura', () => {
  assert.equal(validarPlan(null, { tiempoMax: 20 }).ok, false);
  assert.equal(validarPlan('hola', { tiempoMax: 20 }).ok, false);
  assert.equal(validarPlan({}, { tiempoMax: 20 }).ok, false);
});
