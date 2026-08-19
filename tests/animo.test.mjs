import test from 'node:test';
import assert from 'node:assert/strict';

import {
  pruebasDeLoQueHizo,
  insigniasGanadas,
  mensajeDeDiaDificil,
  cierreDeDiaDificil,
} from '../src/services/animo.js';
import { claveDia, sumarDias } from '../src/services/fecha.js';

const HOY = new Date(2026, 7, 19, 12);
const hace = (n) => sumarDias(claveDia(HOY), -n);

// El día difícil es el momento más delicado de la app. Estas pruebas están
// para que nadie lo convierta sin querer en una lista de pendientes.

test('quien nunca escribió en el diario igual recibe algo', () => {
  // Este era el fallo: el botón solo mostraba líneas del diario, así que la
  // persona que no escribe —la que no se felicita— abría su peor momento y
  // no recibía nada.
  const pruebas = pruebasDeLoQueHizo({ diasCompletados: [hace(0), hace(3)], diario: {} });

  assert.ok(pruebas.length > 0);
  assert.ok(pruebas.some((p) => p.clave === 'dias'));
});

test('junta lo que hizo, venga de donde venga', () => {
  const pruebas = pruebasDeLoQueHizo({
    diasCompletados: [hace(0), hace(9), hace(20)],
    habitosHechos: { agua: [hace(0), hace(1)] },
    mejorRacha: 5,
    rutinasCompletas: 2,
  });

  const claves = pruebas.map((p) => p.clave);
  assert.ok(claves.includes('dias'));
  assert.ok(claves.includes('semanas'));
  assert.ok(claves.includes('regresos'));
  assert.ok(claves.includes('rutinas'));
  assert.ok(claves.includes('habitos'));
  assert.ok(claves.includes('racha'));
});

test('sin nada hecho no se inventa una prueba', () => {
  // Enseñarle un "0 días" a alguien en un mal momento es exactamente lo
  // contrario de lo que hay que hacer.
  assert.deepEqual(pruebasDeLoQueHizo({}), []);
  assert.deepEqual(pruebasDeLoQueHizo({ diasCompletados: [] }), []);
});

test('ninguna prueba muestra un cero', () => {
  const pruebas = pruebasDeLoQueHizo({
    diasCompletados: [hace(0)],
    mejorRacha: 1,
    rutinasCompletas: 0,
  });

  assert.ok(pruebas.every((p) => p.cifra > 0), JSON.stringify(pruebas));
});

test('el singular y el plural están bien', () => {
  const una = pruebasDeLoQueHizo({ diasCompletados: [hace(0)] });
  assert.match(una[0].texto, /^día /);

  const varias = pruebasDeLoQueHizo({ diasCompletados: [hace(0), hace(1)] });
  assert.match(varias[0].texto, /^días /);
});

test('una racha de un día no se presume como racha', () => {
  const pruebas = pruebasDeLoQueHizo({ diasCompletados: [hace(0)], mejorRacha: 1 });
  assert.ok(!pruebas.some((p) => p.clave === 'racha'));
});

// --- La voz ---------------------------------------------------------------

test('nada de lo que se dice es un consejo ni un pendiente', () => {
  // En un día difícil, "podrías intentar" es una piedra más.
  const textos = [
    mensajeDeDiaDificil('Daniel', 0),
    mensajeDeDiaDificil('Daniel', 4),
    mensajeDeDiaDificil('', 2),
    cierreDeDiaDificil(true),
    cierreDeDiaDificil(false),
    ...pruebasDeLoQueHizo({
      diasCompletados: [hace(0), hace(9)],
      habitosHechos: { agua: [hace(0)] },
      mejorRacha: 4,
      rutinasCompletas: 1,
    }).map((p) => p.texto),
  ];

  // "no tienes que" es lo contrario de una exigencia: es soltar a la persona.
  // Por eso el lookbehind, y no un "tienes que" a secas.
  const EXIGENCIA = /(?<!no )\b(deber[íi]as|tienes que|ten[ée]s que|[áa]nimo|esfu[ée]rzate|no te rindas)\b/i;
  const MINIMIZA = /no es para tanto|no pasa nada|ya se te pasa/i;

  for (const t of textos) {
    assert.ok(!EXIGENCIA.test(t), `"${t}" exige algo`);
    assert.ok(!MINIMIZA.test(t), `"${t}" minimiza`);
    assert.ok(!t.includes('!') && !t.includes('¡'), `"${t}" grita`);
  }
});

test('sin nada hecho, no se le pide nada en absoluto', () => {
  const m = mensajeDeDiaDificil('Daniel', 0);
  assert.match(m, /no tienes que hacer nada/i);
});

test('el cierre ofrece la versión mínima, nunca la exige', () => {
  const conPlan = cierreDeDiaDificil(true);
  assert.match(conPlan, /si quieres/i);
  assert.match(conPlan, /también está bien/i);
});

test('las insignias ganadas se pueden mostrar como cosas conseguidas', () => {
  const ganadas = insigniasGanadas({ dias: 30, semanas: 5, regresos: 1 });
  assert.ok(ganadas.length > 0);
  assert.ok(ganadas.every((i) => i.ganada));
});
