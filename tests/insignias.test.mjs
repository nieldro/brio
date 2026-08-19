import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INSIGNIAS,
  GRUPOS,
  estadoDeInsignias,
  porGrupo,
  cuantasGanadas,
  reciénGanadas,
  textoDelResumen,
} from '../src/services/insignias.js';
import {
  nivelDeAcompanamiento,
  saludoSegunDistancia,
  porQueHabloMenos,
  debeCelebrar,
  NIVELES,
} from '../src/services/acompanamiento.js';
import { claveDia, sumarDias } from '../src/services/fecha.js';

const HOY = new Date(2026, 7, 19, 12);
const hace = (n) => sumarDias(claveDia(HOY), -n);

// --- Las insignias --------------------------------------------------------

test('las claves no se repiten y cada una está en un grupo que existe', () => {
  const claves = INSIGNIAS.map((i) => i.clave);
  assert.equal(new Set(claves).size, claves.length);

  const grupos = new Set(GRUPOS.map((g) => g.clave));
  for (const i of INSIGNIAS) assert.ok(grupos.has(i.grupo), `${i.clave} en "${i.grupo}"`);
});

test('sin nada hecho no se gana ninguna, y no se regaña por eso', () => {
  const todas = estadoDeInsignias({});
  assert.equal(todas.filter((i) => i.ganada).length, 0);
  assert.ok(todas.every((i) => i.fraccion === 0));
  assert.match(textoDelResumen(0, INSIGNIAS.length), /se va a ir llenando/i);
});

test('cada insignia se gana con trabajo comprobable', () => {
  // Ninguna se puede ganar por abrir la app: todas leen un contador de algo
  // que la persona hizo.
  for (const i of INSIGNIAS) {
    assert.equal(typeof i.de, 'function', `${i.clave} no lee ningún dato`);
    assert.ok(i.meta >= 1, `${i.clave} tiene meta ${i.meta}`);
    assert.equal(i.de({}), undefined, `${i.clave} se gana sin datos`);
  }
});

test('el primer día gana la primera insignia', () => {
  const ganadas = estadoDeInsignias({ dias: 1 }).filter((i) => i.ganada);
  assert.equal(ganadas.length, 1);
  assert.equal(ganadas[0].clave, 'primer-dia');
});

test('una insignia ganada no se pierde al fallar después', () => {
  // Esto es lo que la separa de una racha. Si se pudiera perder, sería un
  // castigo esperando.
  const conTreinta = cuantasGanadas({ dias: 30, semanas: 5 });
  const luegoFalla = cuantasGanadas({ dias: 30, semanas: 5, mejorRacha: 0 });
  assert.equal(luegoFalla, conTreinta);
});

test('las que faltan muestran avance, no un candado', () => {
  const treinta = estadoDeInsignias({ dias: 18 }).find((i) => i.clave === 'dias-30');
  assert.equal(treinta.ganada, false);
  assert.equal(treinta.valor, 18);
  assert.ok(treinta.fraccion > 0.5 && treinta.fraccion < 1);
});

test('el avance nunca pasa de uno', () => {
  const i = estadoDeInsignias({ dias: 900 }).find((x) => x.clave === 'dias-7');
  assert.equal(i.fraccion, 1);
});

test('volver tiene su propio grupo, que es lo que ninguna otra app cuenta', () => {
  const volver = porGrupo({}).find((g) => g.clave === 'volver');
  assert.ok(volver, 'no existe el grupo volver');
  assert.ok(volver.insignias.length >= 3);
});

test('reconoce cuáles se acaban de ganar, para poder celebrarlas', () => {
  const nuevas = reciénGanadas({ dias: 6 }, { dias: 7 });
  assert.equal(nuevas.length, 1);
  assert.equal(nuevas[0].clave, 'dias-7');

  assert.deepEqual(reciénGanadas({ dias: 7 }, { dias: 8 }), []);
});

test('ningún texto de insignia reprocha ni habla del cuerpo', () => {
  const MALO = /fallaste|perdiste|deber[íi]as|kilo|adelgaz|tu peso|tu cuerpo/i;
  for (const i of INSIGNIAS) {
    const todo = `${i.titulo} ${i.texto}`;
    assert.ok(!MALO.test(todo), `"${todo}"`);
    assert.ok(!todo.includes('!'), `"${todo}" grita`);
  }
});

// --- El acompañamiento que se retira --------------------------------------

const constante = (cuantos) => Array.from({ length: cuantos }, (_, i) => hace(i));

test('al principio Brío está cerca', () => {
  assert.equal(nivelDeAcompanamiento({ semanas: 1, diasCompletados: constante(5) }, HOY), 'cerca');
});

test('se aparta cuando la persona ya lleva tiempo apareciendo', () => {
  const dias = constante(21);
  assert.equal(nivelDeAcompanamiento({ semanas: 5, diasCompletados: dias }, HOY), 'medio');
  assert.equal(nivelDeAcompanamiento({ semanas: 12, diasCompletados: dias }, HOY), 'lejos');
});

test('vuelve a acercarse si la persona lleva tiempo sin aparecer', () => {
  // La distancia se gana, pero también se devuelve cuando hace falta. Alguien
  // con doce semanas que lleva un mes parado necesita a Brío cerca otra vez.
  const viejo = [hace(40), hace(41), hace(42)];
  assert.equal(nivelDeAcompanamiento({ semanas: 12, diasCompletados: viejo }, HOY), 'cerca');
});

test('el saludo se acorta a medida que Brío se aparta', () => {
  const estado = { completadoHoy: false, racha: 0, rota: false };
  const cerca = saludoSegunDistancia('cerca', estado);
  const lejos = saludoSegunDistancia('lejos', estado);

  assert.ok(cerca.length > lejos.length, 'de lejos debería hablar menos');
  assert.ok(lejos.length > 0, 'nunca se calla del todo');
});

test('el cambio de distancia se explica, no se deja sentir como frialdad', () => {
  assert.ok(porQueHabloMenos('medio'));
  assert.ok(porQueHabloMenos('lejos'));
  assert.equal(porQueHabloMenos('cerca'), null, 'al principio no hay nada que explicar');

  assert.match(porQueHabloMenos('medio'), /no es que me haya ido/i);
});

test('ningún saludo reprocha, en ninguna distancia', () => {
  const REPROCHE = /fallaste|perdiste|otra vez|deber[íi]as|llevas sin/i;

  for (const nivel of NIVELES) {
    for (const estado of [
      { completadoHoy: true, racha: 5, rota: false },
      { completadoHoy: false, racha: 0, rota: true },
      { completadoHoy: false, racha: 3, rota: false },
    ]) {
      const texto = saludoSegunDistancia(nivel, estado);
      assert.ok(!REPROCHE.test(texto), `"${texto}" en ${nivel}`);
      assert.ok(!texto.includes('!'), `"${texto}" grita`);
    }
  }
});

test('volver y los hitos se celebran siempre, aunque Brío esté lejos', () => {
  assert.equal(debeCelebrar('lejos', { esRegreso: true }), true);
  assert.equal(debeCelebrar('lejos', { esHito: true }), true);
  assert.equal(debeCelebrar('lejos', {}), false);
  assert.equal(debeCelebrar('cerca', {}), true);
});
