import test from 'node:test';
import assert from 'node:assert/strict';

import { HABITOS, MAXIMO } from '../src/data/habitos.js';
import {
  catalogoDeHabitos,
  habitoPorClave,
  habitosElegidos,
  puedeAgregar,
  alternarElegido,
  estaHecho,
  alternarHecho,
  vecesHecho,
  avanceDeHoy,
  constancia,
  textoDeConstancia,
  frasePorAvance,
} from '../src/services/habitos.js';

const LUNES = new Date(2026, 7, 10, 12);
const MARTES = new Date(2026, 7, 11, 12);

// --- El catálogo ----------------------------------------------------------

test('las claves de los hábitos no se repiten', () => {
  const claves = HABITOS.map((h) => h.clave);
  assert.equal(new Set(claves).size, claves.length);
});

test('cada hábito está en una zona que existe', () => {
  const zonas = new Set(catalogoDeHabitos().map((z) => z.clave));
  for (const h of HABITOS) assert.ok(zonas.has(h.zona), `${h.clave} está en "${h.zona}"`);
});

test('cada zona tiene con qué llenar los tres huecos', () => {
  for (const z of catalogoDeHabitos()) {
    assert.ok(z.habitos.length >= 3, `${z.clave} solo tiene ${z.habitos.length}`);
  }
});

test('ningún hábito habla de cantidades, del peso ni del cuerpo', () => {
  const PROHIBIDO =
    /calor[íi]as?|gramos?|\bkcal\b|kilos?|\bpeso\b|adelgaz\w*|dieta\w*|barriga|abdomen plano/i;

  for (const h of HABITOS) assert.ok(!PROHIBIDO.test(h.texto), h.texto);
});

test('ningún hábito manda dejar de hacer algo', () => {
  // Igual que la mesa: los hábitos de Brío se suman, no se quitan.
  const RESTA = /\b(deja de|no comas|evit\w*|prohibid\w*|elimina|reduce)\b/i;
  for (const h of HABITOS) assert.ok(!RESTA.test(h.texto), h.texto);
});

// --- Elegir ---------------------------------------------------------------

test('se pueden llevar tres, y el cuarto no entra', () => {
  let claves = [];
  claves = alternarElegido(claves, 'agua');
  claves = alternarElegido(claves, 'estirar');
  claves = alternarElegido(claves, 'caminar');
  assert.equal(claves.length, MAXIMO);
  assert.equal(puedeAgregar(claves), false);

  // El cuarto no reemplaza al más viejo por sorpresa: simplemente no entra.
  const conCuarto = alternarElegido(claves, 'dormir');
  assert.deepEqual(conCuarto, claves);
});

test('soltar uno deja hueco para otro', () => {
  const tres = ['agua', 'estirar', 'caminar'];
  const dos = alternarElegido(tres, 'estirar');

  assert.deepEqual(dos, ['agua', 'caminar']);
  assert.equal(puedeAgregar(dos), true);
});

test('una clave que ya no existe no deja una casilla en blanco', () => {
  // Si un día se quita un hábito del catálogo, quien lo llevaba no puede
  // quedarse con una fila vacía que no se puede marcar.
  assert.equal(habitoPorClave('inventado'), null);
  assert.deepEqual(habitosElegidos(['agua', 'inventado']).map((h) => h.clave), ['agua']);
});

// --- Marcar ---------------------------------------------------------------

test('marcar y desmarcar el mismo día', () => {
  let hechos = {};
  assert.equal(estaHecho(hechos, 'agua', LUNES), false);

  hechos = alternarHecho(hechos, 'agua', LUNES);
  assert.equal(estaHecho(hechos, 'agua', LUNES), true);

  hechos = alternarHecho(hechos, 'agua', LUNES);
  assert.equal(estaHecho(hechos, 'agua', LUNES), false);
});

test('marcar hoy no marca mañana', () => {
  const hechos = alternarHecho({}, 'agua', LUNES);
  assert.equal(estaHecho(hechos, 'agua', MARTES), false);
});

test('el total solo sube', () => {
  let hechos = alternarHecho({}, 'agua', LUNES);
  hechos = alternarHecho(hechos, 'agua', MARTES);
  assert.equal(vecesHecho(hechos, 'agua'), 2);
});

test('marcar dos veces el mismo día no cuenta doble', () => {
  let hechos = alternarHecho({}, 'agua', LUNES);
  hechos = alternarHecho(hechos, 'agua', LUNES); // desmarca
  hechos = alternarHecho(hechos, 'agua', LUNES); // vuelve a marcar
  assert.equal(vecesHecho(hechos, 'agua'), 1);
});

// --- Avance del día -------------------------------------------------------

test('cuenta cuántos de los míos van hoy', () => {
  const mios = ['agua', 'estirar'];
  const hechos = alternarHecho({}, 'agua', LUNES);

  assert.deepEqual(avanceDeHoy(mios, hechos, LUNES), { hechos: 1, total: 2, completo: false });
});

test('sin hábitos elegidos no hay nada completo que celebrar', () => {
  assert.deepEqual(avanceDeHoy([], {}, LUNES), { hechos: 0, total: 0, completo: false });
});

test('la constancia mira las últimas dos semanas, no toda la vida', () => {
  const viejo = { agua: ['2026-07-01', '2026-08-09', '2026-08-10'] };
  assert.equal(vecesHecho(viejo, 'agua'), 3);
  assert.equal(constancia(viejo, 'agua', 14, LUNES), 2);
});

// --- Voz ------------------------------------------------------------------

test('los textos nunca cuentan lo que faltó', () => {
  const textos = [
    textoDeConstancia(0),
    textoDeConstancia(1),
    textoDeConstancia(7),
    textoDeConstancia(14),
    frasePorAvance({ hechos: 0, total: 0, completo: false }),
    frasePorAvance({ hechos: 0, total: 3, completo: false }),
    frasePorAvance({ hechos: 2, total: 3, completo: false }),
    frasePorAvance({ hechos: 3, total: 3, completo: true }),
  ];

  const REPROCHE = /fallaste|perdiste|te faltaron|llevas sin|rompiste|solo \d+/i;

  for (const t of textos) {
    assert.ok(!REPROCHE.test(t), `"${t}" reprocha`);
    assert.ok(!t.includes('!') && !t.includes('¡'), `"${t}" grita`);
  }
});

test('sin hábitos elegidos, se invita en vez de regañar', () => {
  assert.match(frasePorAvance({ hechos: 0, total: 0, completo: false }), /elige|empezar/i);
});
