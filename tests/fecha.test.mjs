import test from 'node:test';
import assert from 'node:assert/strict';

import { nombreDia, fechaLarga, claveDia, claveAyer, franjaDelDia } from '../src/services/fecha.js';

test('claveDia rellena mes y día con cero', () => {
  assert.equal(claveDia(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(claveDia(new Date(2026, 11, 31)), '2026-12-31');
});

test('claveAyer cruza bien el cambio de mes', () => {
  assert.equal(claveAyer(new Date(2026, 2, 1)), '2026-02-28');
});

test('claveAyer cruza bien el cambio de año', () => {
  assert.equal(claveAyer(new Date(2026, 0, 1)), '2025-12-31');
});

test('claveAyer respeta el año bisiesto', () => {
  assert.equal(claveAyer(new Date(2028, 2, 1)), '2028-02-29');
});

test('nombreDia y fechaLarga van en español y en minúscula', () => {
  const jueves = new Date(2026, 7, 13);
  assert.equal(nombreDia(jueves), 'jueves');
  assert.equal(fechaLarga(jueves), 'jueves 13 de agosto');
});

test('la franja del día cambia en las horas esperadas', () => {
  const a = (h) => franjaDelDia(new Date(2026, 7, 13, h));
  assert.equal(a(7), 'manana');
  assert.equal(a(11), 'manana');
  assert.equal(a(12), 'tarde');
  assert.equal(a(18), 'tarde');
  assert.equal(a(19), 'noche');
  assert.equal(a(23), 'noche');
});
