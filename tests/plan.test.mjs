import test from 'node:test';
import assert from 'node:assert/strict';

import { diaDelPlan, resumenReto, esDescanso } from '../src/services/plan.js';
import { interpolar } from '../src/services/texto.js';
import { planDemo } from '../src/data/planDemo.js';

test('el plan demo cumple las reglas duras del producto', () => {
  assert.equal(planDemo.dias.length, 7, 'siete días');

  const suaves = planDemo.dias.filter((d) => d.tipo === 'descanso' || d.tipo === 'suave');
  assert.ok(suaves.length >= 2, 'mínimo dos días de descanso o suaves');

  for (const dia of planDemo.dias) {
    assert.ok(['entrenamiento', 'descanso', 'suave'].includes(dia.tipo));
    assert.ok(dia.comida_tip.length > 0, `${dia.dia} necesita tip de comida`);
    assert.ok(dia.mensaje.length > 0, `${dia.dia} necesita mensaje`);
    // Nunca calorías, macros ni cantidades exactas.
    assert.ok(
      !/calor[íi]a|macro|gramos|\bkcal\b/i.test(dia.comida_tip),
      `el tip de ${dia.dia} no puede hablar de calorías ni cantidades`,
    );
  }
});

test('diaDelPlan devuelve el día que corresponde a la fecha', () => {
  const jueves = new Date(2026, 7, 13);
  assert.equal(diaDelPlan(planDemo, jueves).dia, 'jueves');
});

test('diaDelPlan nunca deja la pantalla vacía', () => {
  assert.equal(diaDelPlan(null), null);
  assert.equal(diaDelPlan({ dias: [] }), null);

  // Plan incompleto: cae al primer día antes que devolver nada.
  const cojo = { dias: [{ dia: 'lunes', reto: 'x' }] };
  assert.equal(diaDelPlan(cojo, new Date(2026, 7, 13)).dia, 'lunes');
});

test('resumenReto omite la duración en días de descanso', () => {
  const descanso = planDemo.dias.find((d) => d.tipo === 'descanso');
  assert.equal(esDescanso(descanso), true);
  assert.equal(resumenReto(descanso, 'En casa'), 'En casa');
});

test('resumenReto junta duración y lugar', () => {
  const lunes = planDemo.dias[0];
  assert.equal(resumenReto(lunes, 'En casa'), '10 min  ·  En casa');
});

test('interpolar rellena el nombre y no deja marcadores sueltos', () => {
  assert.equal(interpolar('{nombre}, ¿qué buscas?', { nombre: 'Ana' }), 'Ana, ¿qué buscas?');
  assert.equal(interpolar('{nombre}, hola', {}), ', hola', 'sin dato, no imprime la llave');
  assert.equal(interpolar(undefined, {}), undefined);
});
