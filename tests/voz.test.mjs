import test from 'node:test';
import assert from 'node:assert/strict';

import { guionDeGuia } from '../src/lib/voz.js';
import { guiaDe } from '../src/services/guias.js';
import { todosLosNombres } from '../azure-functions/src/lib/catalogo.js';

// El guion se arma en un solo sitio y se prueba sin encender el altavoz.

test('el guion dice el nombre, los pasos y qué cuidar', () => {
  const g = guiaDe({ nombre: 'Sentadilla a la silla' });
  const guion = guionDeGuia(g, { detalle: '3 series de 8' });

  assert.match(guion, /Sentadilla a la silla/);
  assert.match(guion, /3 series de 8/);
  assert.match(guion, /1\./);
  assert.match(guion, /Fíjate en esto/);
  assert.match(guion, /Si hoy no puedes/);
});

test('el guion numera los pasos en orden', () => {
  const g = guiaDe({ nombre: 'Zancada' });
  const guion = guionDeGuia(g);

  const posiciones = g.como.map((_, i) => guion.indexOf(`${i + 1}.`));
  for (let i = 1; i < posiciones.length; i += 1) {
    assert.ok(posiciones[i] > posiciones[i - 1], 'los pasos salen desordenados');
  }
});

test('sin guía no se dice nada, en vez de leer "undefined"', () => {
  assert.equal(guionDeGuia(null), '');
  assert.equal(guionDeGuia(undefined, { detalle: 'x' }), '');
});

test('sin detalle el guion sigue siendo válido', () => {
  const guion = guionDeGuia(guiaDe({ nombre: 'Caminata' }));
  assert.ok(guion.length > 40);
  assert.ok(!guion.includes('undefined'));
});

test('todo ejercicio del catálogo se puede escuchar', () => {
  // Si un ejercicio no tiene pasos, la voz diría solo el nombre y la persona
  // se queda igual que antes.
  for (const nombre of todosLosNombres()) {
    const guion = guionDeGuia(guiaDe({ nombre }));
    assert.ok(guion.includes(nombre), `${nombre} no se nombra`);
    assert.ok(guion.length > 60, `${nombre} tiene un guion de ${guion.length} caracteres`);
    assert.ok(!guion.includes('undefined'), `${nombre} lee "undefined"`);
  }
});

test('el guion no lleva signos que la voz lea raro', () => {
  for (const nombre of todosLosNombres()) {
    const guion = guionDeGuia(guiaDe({ nombre }));
    assert.ok(!guion.includes('▸'), `${nombre} lleva un símbolo de la interfaz`);
    assert.ok(!/\{|\}|\|/.test(guion), `${nombre} lleva llaves o barras`);
  }
});
