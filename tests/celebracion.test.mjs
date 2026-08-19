import test from 'node:test';
import assert from 'node:assert/strict';

import { queCelebrar } from '../src/services/celebracion.js';

const INSIGNIA = { titulo: 'Treinta días', texto: 'Esto ya no es un intento.' };

// --- El orden de importancia ----------------------------------------------

test('una insignia le gana a todo lo demás', () => {
  const r = queCelebrar({
    nuevasInsignias: [INSIGNIA],
    esRegreso: true,
    hito: 30,
    distancia: 'cerca',
  });

  assert.equal(r.motivo, 'insignia');
  assert.equal(r.titulo, 'Treinta días');
});

test('volver le gana al hito y al día normal', () => {
  const r = queCelebrar({ esRegreso: true, regresos: 2, diasSinVolver: 5, hito: 7 });
  assert.equal(r.motivo, 'regreso');
});

test('el hito le gana al día normal', () => {
  const r = queCelebrar({ hito: 7, distancia: 'cerca', racha: 7 });
  assert.equal(r.motivo, 'hito');
});

test('un día normal se celebra al principio', () => {
  const r = queCelebrar({ distancia: 'cerca', racha: 3 });
  assert.equal(r.motivo, 'dia');
  assert.equal(r.titulo, 'Hecho.');
});

// --- Lo que se apaga con el tiempo ----------------------------------------

test('con Brío lejos, un día normal ya no interrumpe', () => {
  // Este es el punto de todo: al tercer mes, marcar un martes cualquiera no
  // necesita pantalla completa. La app deja de tener que aplaudirte.
  assert.equal(queCelebrar({ distancia: 'medio', racha: 20 }), null);
  assert.equal(queCelebrar({ distancia: 'lejos', racha: 40 }), null);
});

test('volver se celebra siempre, aunque Brío esté lejísimos', () => {
  const r = queCelebrar({ esRegreso: true, regresos: 1, diasSinVolver: 20, distancia: 'lejos' });
  assert.equal(r.motivo, 'regreso');
});

test('los hitos se celebran siempre, aunque Brío esté lejísimos', () => {
  const r = queCelebrar({ hito: 100, distancia: 'lejos' });
  assert.equal(r.motivo, 'hito');
});

test('una insignia se celebra siempre, aunque Brío esté lejísimos', () => {
  const r = queCelebrar({ nuevasInsignias: [INSIGNIA], distancia: 'lejos' });
  assert.equal(r.motivo, 'insignia');
});

// --- Forma y voz ----------------------------------------------------------

test('varias insignias a la vez muestran una sola', () => {
  // Dos pantallas completas seguidas se sienten a premio de feria.
  const r = queCelebrar({
    nuevasInsignias: [INSIGNIA, { titulo: 'Otra', texto: 'x' }],
    distancia: 'cerca',
  });
  assert.equal(r.titulo, INSIGNIA.titulo);
});

test('siempre trae título y subtítulo, nunca medio vacío', () => {
  const casos = [
    { nuevasInsignias: [INSIGNIA] },
    { esRegreso: true, regresos: 1, diasSinVolver: 3 },
    { hito: 30 },
    { distancia: 'cerca', racha: 1 },
  ];

  for (const caso of casos) {
    const r = queCelebrar(caso);
    assert.ok(r?.titulo?.length > 0, JSON.stringify(caso));
    assert.ok(r?.sub?.length > 0, JSON.stringify(caso));
  }
});

test('ninguna celebración grita ni reprocha', () => {
  const casos = [
    { nuevasInsignias: [INSIGNIA] },
    { esRegreso: true, regresos: 4, diasSinVolver: 40 },
    { hito: 100 },
    { distancia: 'cerca', racha: 9 },
  ];

  for (const caso of casos) {
    const r = queCelebrar(caso);
    const todo = `${r.titulo} ${r.sub}`;
    assert.ok(!todo.includes('!') && !todo.includes('¡'), todo);
    assert.ok(!/fallaste|perdiste|por fin|ya era hora/i.test(todo), todo);
  }
});

test('sin nada especial y con Brío lejos, devuelve null y no una frase de relleno', () => {
  assert.equal(queCelebrar({ distancia: 'lejos' }), null);
  assert.equal(queCelebrar({ distancia: 'medio' }), null);
});

test('sin argumentos, se asume que la persona apenas empieza', () => {
  // El valor por defecto es 'cerca' a propósito: si algo falla al calcular la
  // distancia, es mejor celebrar de más que dejar a alguien sin respuesta.
  assert.equal(queCelebrar().motivo, 'dia');
});
