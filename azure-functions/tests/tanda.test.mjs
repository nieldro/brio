import test from 'node:test';
import assert from 'node:assert/strict';

import { aQuienLeToca, enTandas, DIAS_SIN_MOVERSE } from '../src/lib/tanda.js';

const HOY = '2026-08-19';

const persona = (userId, ultimoMovimiento, planDesde) => ({ userId, ultimoMovimiento, planDesde });

// --- A quién le toca ------------------------------------------------------

test('quien no se ha movido en tres semanas no entra', () => {
  const fila = aQuienLeToca(
    [
      persona('activa', '2026-08-18', '2026-08-10T09:00:00Z'),
      persona('perdida', '2026-06-01', '2026-06-01T09:00:00Z'),
      persona('nunca', null, '2026-06-01T09:00:00Z'),
    ],
    HOY,
  );

  assert.deepEqual(
    fila.map((u) => u.userId),
    ['activa'],
  );
});

test('el borde de los veintiún días entra, el día siguiente no', () => {
  const justo = aQuienLeToca([persona('a', '2026-07-29', '2026-07-01T09:00:00Z')], HOY);
  assert.equal(justo.length, 1, `${DIAS_SIN_MOVERSE} días atrás debería entrar`);

  const tarde = aQuienLeToca([persona('a', '2026-07-28', '2026-07-01T09:00:00Z')], HOY);
  assert.equal(tarde.length, 0);
});

test('un plan de hace dos días no se rehace', () => {
  // Sin esto, correr el Timer dos veces le daba dos planes a la misma persona
  // y la saltaba dos semanas de golpe.
  const fila = aQuienLeToca(
    [
      persona('recien', '2026-08-18', '2026-08-17T09:00:00Z'),
      persona('vencido', '2026-08-18', '2026-08-11T09:00:00Z'),
    ],
    HOY,
  );

  assert.deepEqual(
    fila.map((u) => u.userId),
    ['vencido'],
  );
});

test('correrlo dos veces seguidas no le hace nada a nadie', () => {
  const gente = [persona('a', '2026-08-18', '2026-08-01T09:00:00Z')];

  assert.equal(aQuienLeToca(gente, HOY).length, 1);

  // Ya se le hizo el plan hoy.
  const despues = [persona('a', '2026-08-18', `${HOY}T09:00:00Z`)];
  assert.equal(aQuienLeToca(despues, HOY).length, 0);
});

test('primero el del plan más viejo', () => {
  // Este orden es el que evita que los mismos se queden por fuera todas las
  // semanas: si el tiempo se acaba, se corta por el final, y el final son los
  // planes más nuevos.
  const fila = aQuienLeToca(
    [
      persona('nueva', '2026-08-18', '2026-08-12T09:00:00Z'),
      persona('vieja', '2026-08-18', '2026-07-20T09:00:00Z'),
      persona('media', '2026-08-18', '2026-08-03T09:00:00Z'),
    ],
    HOY,
  );

  assert.deepEqual(
    fila.map((u) => u.userId),
    ['vieja', 'media', 'nueva'],
  );
});

test('quien se quedó sin plan la semana pasada es el primero de la próxima', () => {
  // La prueba de que la fila rota. Se corre una tanda que solo alcanza para
  // dos, y la siguiente arranca justo por quien se quedó.
  const gente = [
    persona('a', '2026-08-18', '2026-08-01T00:00:00Z'),
    persona('b', '2026-08-18', '2026-08-02T00:00:00Z'),
    persona('c', '2026-08-18', '2026-08-03T00:00:00Z'),
  ];

  const primera = aQuienLeToca(gente, HOY).slice(0, 2).map((u) => u.userId);
  assert.deepEqual(primera, ['a', 'b']);

  // A y B recibieron plan hoy; C sigue con el suyo del día 3.
  const despues = [
    persona('a', '2026-08-18', '2026-08-19T00:00:00Z'),
    persona('b', '2026-08-18', '2026-08-19T00:00:00Z'),
    persona('c', '2026-08-18', '2026-08-03T00:00:00Z'),
  ];

  assert.equal(aQuienLeToca(despues, '2026-08-26')[0].userId, 'c');
});

test('sin plan previo va de primero', () => {
  const fila = aQuienLeToca(
    [persona('con', '2026-08-18', '2026-08-01T00:00:00Z'), persona('sin', '2026-08-18', null)],
    HOY,
  );

  assert.equal(fila[0].userId, 'sin');
});

test('una lista vacía o rara no rompe nada', () => {
  assert.deepEqual(aQuienLeToca(null, HOY), []);
  assert.deepEqual(aQuienLeToca([], HOY), []);
  assert.deepEqual(aQuienLeToca([{}, null, { userId: '' }], HOY), []);
});

// --- La tanda -------------------------------------------------------------

test('atiende a todos cuando el tiempo alcanza', async () => {
  const { hechos, quedaron, sinTiempo } = await enTandas([1, 2, 3, 4, 5], async (n) => n * 2);

  assert.equal(quedaron, 0);
  assert.equal(sinTiempo, false);
  assert.deepEqual(
    hechos.map((h) => h.resultado).sort((a, b) => a - b),
    [2, 4, 6, 8, 10],
  );
});

test('para cuando se acaba el tiempo y dice cuántos quedaron', async () => {
  // Este es el fallo que estamos arreglando: antes se cortaba sin decir nada.
  let ahora = 0;
  const reloj = () => ahora;

  const { hechos, quedaron, sinTiempo } = await enTandas(
    [1, 2, 3, 4, 5, 6],
    async (n) => {
      ahora += 40;
      return n;
    },
    { aLaVez: 1, presupuestoMs: 100, reloj },
  );

  assert.equal(sinTiempo, true);
  assert.equal(hechos.length, 3);
  assert.equal(quedaron, 3);
});

test('que uno falle no tumba la tanda', async () => {
  const { hechos, quedaron } = await enTandas([1, 2, 3], async (n) => {
    if (n === 2) throw new Error('gemini se cayó');
    return n;
  });

  assert.equal(quedaron, 0);
  assert.equal(hechos.length, 3);
  assert.equal(hechos.find((h) => h.item === 2).error, 'gemini se cayó');
  assert.equal(hechos.find((h) => h.item === 3).resultado, 3);
});

test('trabaja de a varios, no de a uno', async () => {
  let ahora = 0;
  let vivos = 0;
  let pico = 0;

  await enTandas(
    [1, 2, 3, 4, 5, 6],
    async () => {
      vivos += 1;
      pico = Math.max(pico, vivos);
      await new Promise((r) => setTimeout(r, 5));
      vivos -= 1;
      ahora += 1;
    },
    { aLaVez: 3, presupuestoMs: 10_000, reloj: () => ahora },
  );

  assert.equal(pico, 3);
});

test('una tanda vacía no se queda colgada', async () => {
  const { hechos, quedaron } = await enTandas([], async () => 1);
  assert.deepEqual(hechos, []);
  assert.equal(quedaron, 0);
});
