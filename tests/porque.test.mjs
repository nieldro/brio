import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  enSegundaPersona,
  hayPorque,
  recordatorioDePorque,
  porqueCorto,
  toca,
} from '../src/services/porque.js';

// pasos.js se lee como texto y no se importa: adentro hay imports sin
// extensión, que Metro resuelve y Node no. Lo que hace falta aquí son las
// opciones del paso 4, y para eso alcanza con leerlas.
function opcionesDelPorque() {
  const fuente = readFileSync(
    new URL('../src/screens/onboarding/pasos.js', import.meta.url),
    'utf8',
  );

  const bloque = fuente.split("id: 'porque'")[1];
  assert.ok(bloque, 'el paso del porqué desapareció del onboarding');

  const opciones = bloque.split('opciones: [')[1]?.split(']')[0] ?? '';
  return [...opciones.matchAll(/valor:\s*'([^']+)'/g)].map((m) => m[1]);
}

// El porqué es lo más delicado que guarda la app: la persona lo escribió
// porque le prometimos que quedaba entre ella y Brío. Devolvérselo mal es
// convertir una confianza en un reproche.

test('las opciones del paso 4 se voltean a segunda persona', () => {
  // Sin esto salía "esto era por mi salud", que suena a que el motivo es de
  // Brío y no de la persona.
  assert.equal(enSegundaPersona('Mi salud'), 'tu salud');
  assert.equal(enSegundaPersona('Mi familia'), 'tu familia');
  assert.equal(enSegundaPersona('Volver a gustarme'), 'volver a gustarte');
});

test('las tildes y las mayúsculas no lo rompen', () => {
  assert.equal(enSegundaPersona('TENER ENERGÍA'), 'tener energía');
  assert.equal(enSegundaPersona('tener energia'), 'tener energía');
  assert.equal(enSegundaPersona('  Mi Salud  '), 'tu salud');
});

test('toda opción del onboarding tiene su forma en segunda persona', () => {
  // Ata las dos puntas: si mañana alguien agrega "Por mis hijos" al paso 4 y
  // se le olvida aquí, la frase saldría en primera persona sin que nada falle.
  const opciones = opcionesDelPorque();
  assert.ok(opciones.length >= 4, `solo se leyeron ${opciones.length} opciones`);

  const sinVoltear = opciones.filter((o) => !enSegundaPersona(o));
  assert.deepEqual(sinVoltear, [], 'opciones del paso 4 sin forma en segunda persona');
});

test('lo que escribió a mano se cita, no se parafrasea', () => {
  // Sus palabras pesan más que cualquiera que le pongamos nosotros.
  const suyo = 'Para no cansarme subiendo las escaleras de la casa';
  assert.ok(recordatorioDePorque(suyo).includes(suyo));
});

test('sin porqué no se inventa uno', () => {
  assert.equal(recordatorioDePorque(''), null);
  assert.equal(recordatorioDePorque(null), null);
  assert.equal(recordatorioDePorque('   '), null);
  assert.equal(porqueCorto(''), null);
  assert.equal(hayPorque('  '), false);
});

// --- Cuándo se saca, que es la mitad del asunto ---------------------------

test('solo aparece cuando vuelve después de parar', () => {
  // Todos los días lo gasta hasta volverlo decoración, y en un día que va
  // bien es empujar a quien ya va caminando.
  assert.equal(toca('Mi salud', { rota: true, completadoHoy: false }), true);
  assert.equal(toca('Mi salud', { rota: false, completadoHoy: false }), false);
});

test('a quien ya cerró el día no se le recuerda nada', () => {
  // Ya lo hizo. Sacarle el motivo ahí es cobrarle algo que ya pagó.
  assert.equal(toca('Mi salud', { rota: true, completadoHoy: true }), false);
});

test('sin porqué guardado nunca aparece', () => {
  assert.equal(toca('', { rota: true }), false);
  assert.equal(toca(null, { rota: true }), false);
});

// --- La voz ---------------------------------------------------------------

test('no exige, no reprocha y no grita', () => {
  const textos = [
    recordatorioDePorque('Mi salud'),
    recordatorioDePorque('Volver a gustarme'),
    recordatorioDePorque('Por mi hija'),
  ];

  // "Recuerda que", "no olvides" y "pero" son las tres formas de convertir un
  // motivo en una deuda.
  const REPROCHE = /\b(recuerda que|no olvides|dijiste que|prometiste|pero)\b/i;
  const EXIGENCIA = /\b(deber[íi]as|tienes que|[áa]nimo|esfu[ée]rzate|vamos)\b/i;

  for (const t of textos) {
    assert.ok(!REPROCHE.test(t), `"${t}" se lee como reproche`);
    assert.ok(!EXIGENCIA.test(t), `"${t}" exige algo`);
    assert.ok(!/[!¡]/.test(t), `"${t}" grita`);
    assert.ok(t.split('.').filter((f) => f.trim()).length <= 2, `"${t}" pasa de dos frases`);
  }
});
