import test from 'node:test';
import assert from 'node:assert/strict';

import {
  contarRegresos,
  diasSinVolver,
  hoySeriaRegreso,
  celebrarRegreso,
  textoRegresos,
} from '../src/services/regresos.js';
import { versionMinima } from '../src/services/plan.js';

// --- Contar regresos ------------------------------------------------------

test('empezar no es volver', () => {
  assert.equal(contarRegresos([]), 0);
  assert.equal(contarRegresos(['2026-08-10']), 0);
});

test('días seguidos no son regresos', () => {
  assert.equal(contarRegresos(['2026-08-10', '2026-08-11', '2026-08-12']), 0);
});

test('parar y volver cuenta como un regreso', () => {
  // 10, 11, se pierde el 12, vuelve el 13.
  assert.equal(contarRegresos(['2026-08-10', '2026-08-11', '2026-08-13']), 1);
});

test('cuenta cada regreso, no solo el último', () => {
  const dias = [
    '2026-08-01', '2026-08-02', // arranca
    '2026-08-10', // vuelve (1)
    '2026-08-11',
    '2026-08-20', // vuelve (2)
    '2026-09-05', // vuelve (3)
  ];
  assert.equal(contarRegresos(dias), 3);
});

test('el orden de entrada no importa ni los repetidos', () => {
  assert.equal(contarRegresos(['2026-08-13', '2026-08-10', '2026-08-11', '2026-08-10']), 1);
});

test('un abandono largo sigue siendo un solo regreso', () => {
  assert.equal(contarRegresos(['2026-01-05', '2026-08-18']), 1);
});

// --- Días sin volver ------------------------------------------------------

test('cuenta los días desde la última vez', () => {
  const hoy = new Date(2026, 7, 18);
  assert.equal(diasSinVolver(['2026-08-15'], hoy), 3);
  assert.equal(diasSinVolver(['2026-08-18'], hoy), 0);
  assert.equal(diasSinVolver([], hoy), null);
});

// --- ¿Hoy sería un regreso? ----------------------------------------------

test('marcar hoy después de un hueco es un regreso', () => {
  const hoy = new Date(2026, 7, 18);
  assert.equal(hoySeriaRegreso({ diasCompletados: ['2026-08-15'] }, hoy), true);
});

test('marcar hoy después de ayer NO es un regreso, es seguir', () => {
  const hoy = new Date(2026, 7, 18);
  assert.equal(hoySeriaRegreso({ diasCompletados: ['2026-08-17'] }, hoy), false);
});

test('el primer día de la vida no es un regreso', () => {
  assert.equal(hoySeriaRegreso({ diasCompletados: [] }, new Date(2026, 7, 18)), false);
});

test('si ya marcó hoy, no vuelve a contar', () => {
  const hoy = new Date(2026, 7, 18);
  assert.equal(hoySeriaRegreso({ diasCompletados: ['2026-08-18', '2026-08-15'] }, hoy), false);
});

// --- Los textos -----------------------------------------------------------

const PROHIBIDAS = [
  'fracaso', 'excusas', 'deberías', 'perdiste', 'fallaste', 'abandonaste', 'otra vez fallaste',
];

function revisarVoz(texto) {
  assert.ok(texto?.length > 0);
  const bajo = texto.toLowerCase();
  for (const mala of PROHIBIDAS) {
    assert.ok(!bajo.includes(mala), `"${texto}" usa "${mala}"`);
  }
  assert.ok(!texto.includes('!'), `"${texto}" lleva signo de admiración`);
}

test('los textos de regreso nunca mencionan los días perdidos', () => {
  const casos = [
    celebrarRegreso(1, 3),
    celebrarRegreso(4, 10),
    celebrarRegreso(2, 45),
    textoRegresos(0),
    textoRegresos(1),
    textoRegresos(7),
  ];

  for (const c of casos) {
    revisarVoz(c.titulo ?? c.cifra);
    revisarVoz(c.sub ?? c.frase);
  }
});

test('un abandono largo se celebra más, no menos', () => {
  const largo = celebrarRegreso(1, 45);
  assert.match(largo.sub, /vale más|tanto tiempo/i);
});

test('el texto nunca dice cuántos días estuvo fuera', () => {
  for (const dias of [3, 15, 60, 200]) {
    const c = celebrarRegreso(2, dias);
    assert.ok(!`${c.titulo} ${c.sub}`.includes(String(dias)), 'no se le recuerdan los días perdidos');
  }
});

// --- Versión mínima -------------------------------------------------------

const DIA = {
  dia: 'martes',
  tipo: 'entrenamiento',
  reto: 'Despertar el cuerpo',
  duracion_min: 12,
  ejercicios: [
    { nombre: 'Sentadillas a una silla', detalle: '2 series de 8' },
    { nombre: 'Elevaciones de talón', detalle: '2 series de 10' },
    { nombre: 'Estiramiento suave', detalle: '3 minutos' },
  ],
  comida_tip: 'Agrega una fruta',
  mensaje: 'Movimiento sencillo.',
};

test('la versión mínima deja un solo ejercicio y dos minutos', () => {
  const m = versionMinima(DIA);
  assert.equal(m.ejercicios.length, 1);
  assert.equal(m.ejercicios[0].nombre, 'Sentadillas a una silla');
  assert.equal(m.duracion_min, 2);
  assert.equal(m.minima, true);
});

test('la versión mínima dice que cuenta igual', () => {
  const m = versionMinima(DIA);
  assert.match(m.mensaje, /cuenta igual/i);
  revisarVoz(m.mensaje);
});

test('un día de descanso sin ejercicios no se rompe', () => {
  const descanso = { dia: 'jueves', tipo: 'descanso', reto: 'Descanso', duracion_min: 0, ejercicios: [] };
  const m = versionMinima(descanso);
  assert.equal(m.ejercicios.length, 0);
  assert.equal(m.reto, 'Descanso');
  assert.equal(m.duracion_min, 2);
});

test('no revienta sin día', () => {
  assert.equal(versionMinima(null), null);
  assert.equal(versionMinima(undefined), null);
});

test('la versión mínima conserva el tip de comida del día', () => {
  assert.equal(versionMinima(DIA).comida_tip, 'Agrega una fruta');
});
