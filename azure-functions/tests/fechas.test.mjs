import test from 'node:test';
import assert from 'node:assert/strict';

import { fechaValida, diaDeLaSemana, restarDias } from '../src/lib/fechas.js';

test('fechaValida acepta solo el formato exacto', () => {
  assert.equal(fechaValida('2026-08-14'), '2026-08-14');
  assert.equal(fechaValida('2026-8-14'), null);
  assert.equal(fechaValida('14/08/2026'), null);
  assert.equal(fechaValida(''), null);
  assert.equal(fechaValida(undefined), null);
});

test('fechaValida rechaza fechas que no existen', () => {
  assert.equal(fechaValida('2026-02-31'), null, 'febrero no tiene 31');
  assert.equal(fechaValida('2026-13-01'), null, 'no hay mes 13');
  assert.equal(fechaValida('2026-02-29'), null, '2026 no es bisiesto');
  assert.equal(fechaValida('2028-02-29'), '2028-02-29', '2028 sí es bisiesto');
});

test('fechaValida bloquea intentos de inyección en la consulta', () => {
  assert.equal(fechaValida("2026-08-14' or '1'='1"), null);
});

test('diaDeLaSemana devuelve el día en español', () => {
  assert.equal(diaDeLaSemana('2026-08-14'), 'viernes');
  assert.equal(diaDeLaSemana('2026-08-16'), 'domingo');
  assert.equal(diaDeLaSemana('2026-08-17'), 'lunes');
});

test('restarDias cruza mes, año y bisiesto', () => {
  assert.equal(restarDias('2026-08-14', 7), '2026-08-07');
  assert.equal(restarDias('2026-03-05', 7), '2026-02-26');
  assert.equal(restarDias('2026-01-03', 7), '2025-12-27');
  assert.equal(restarDias('2028-03-01', 1), '2028-02-29');
});
