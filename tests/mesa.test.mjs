import test from 'node:test';
import assert from 'node:assert/strict';

import { IDEAS, MOMENTOS } from '../src/data/mesa.js';
import { ideasDe, porMomento, ideaDelDia, mesaDelDia, fraseDelDia } from '../src/services/mesa.js';

const LUNES = new Date(2026, 7, 10, 12);
const MARTES = new Date(2026, 7, 11, 12);

// --- La regla 1, comprobada ------------------------------------------------
//
// La comida es donde más fácil se cuela una dieta disfrazada de consejo.
// Estas pruebas son el freno.

test('ninguna idea habla de calorías, macros ni cantidades', () => {
  const MEDIDAS =
    /calor[íi]as?|macros?|\bkcal\b|gramos?|\bml\b|prote[íi]nas?|carbohidratos?|porciones?|ayuno|d[ée]ficit/i;

  for (const i of IDEAS) {
    assert.ok(!MEDIDAS.test(i.texto), `"${i.texto}" habla de cantidades`);
  }
});

test('ninguna idea manda quitar algo: son de suma, no de resta', () => {
  // La regla del documento dice "tips de suma, no de resta. Agrega, no
  // elimines". Sin esta prueba, una sola idea con "evita" convierte la
  // pantalla en una dieta.
  const RESTA = /\b(evit\w*|deja de|quita|elimina|no comas|prohibid\w*|reduce|menos de)\b/i;

  for (const i of IDEAS) {
    assert.ok(!RESTA.test(i.texto), `"${i.texto}" manda quitar algo`);
  }
});

test('ninguna idea juzga la comida ni el cuerpo', () => {
  const JUICIO = /\b(engorda\w*|chatarra|basura|malo|mala|culpa\w*|gordo|flaco|adelgaz\w*|dieta\w*)\b/i;

  for (const i of IDEAS) {
    assert.ok(!JUICIO.test(i.texto), `"${i.texto}" juzga`);
  }
});

test('ninguna idea lleva signos de admiración', () => {
  for (const i of IDEAS) {
    assert.ok(!i.texto.includes('!') && !i.texto.includes('¡'), i.texto);
  }
});

test('el semáforo solo tiene sus tres colores, y ninguna idea es roja', () => {
  // Rojo aquí no tendría sentido: estas son cosas que se SUMAN. Si algo se
  // suma, no puede estar en rojo.
  for (const i of IDEAS) {
    assert.ok(['verde', 'ambar'].includes(i.color), `"${i.texto}" es ${i.color}`);
  }
});

// --- Que haya de todo, todos los días -------------------------------------

test('cada momento del día tiene varias ideas', () => {
  for (const m of MOMENTOS) {
    assert.ok(ideasDe(m.clave).length >= 4, `${m.clave} solo tiene ${ideasDe(m.clave).length}`);
  }
});

test('porMomento no deja ningún momento vacío', () => {
  const lista = porMomento();
  assert.equal(lista.length, MOMENTOS.length);
  assert.ok(lista.every((m) => m.ideas.length > 0));
});

test('la mesa del día trae una idea por momento', () => {
  const mesa = mesaDelDia(LUNES);
  assert.equal(mesa.length, MOMENTOS.length);
  assert.ok(mesa.every((m) => !!m.idea?.texto));
});

// --- Estable dentro del día, distinta al siguiente ------------------------

test('la idea no cambia durante el día', () => {
  // Si cambiara en cada render, la pantalla bailaría al desplazarse.
  const a = ideaDelDia('desayuno', LUNES);
  const b = ideaDelDia('desayuno', new Date(2026, 7, 10, 23));
  assert.equal(a.texto, b.texto);
});

test('mañana hay algo distinto', () => {
  const distintos = MOMENTOS.filter(
    (m) => ideaDelDia(m.clave, LUNES).texto !== ideaDelDia(m.clave, MARTES).texto,
  );
  assert.ok(distintos.length >= 1, 'ningún momento cambió de un día al otro');
});

test('la frase también es estable en el día', () => {
  assert.equal(fraseDelDia(LUNES), fraseDelDia(new Date(2026, 7, 10, 6)));
  assert.ok(fraseDelDia(LUNES).length > 0);
});

test('nada de esto lleva cuenta de nada', () => {
  // La mesa no registra comidas y no debe empezar a hacerlo: contar comidas
  // es el primer paso hacia contar calorías.
  for (const m of mesaDelDia(LUNES)) {
    assert.equal(m.idea.hecho, undefined, 'una idea no puede marcarse como cumplida');
  }
});
