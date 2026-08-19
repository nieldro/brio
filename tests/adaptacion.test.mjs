import test from 'node:test';
import assert from 'node:assert/strict';

import {
  porDiaDeLaSemana,
  diaMasDificil,
  diaMasFuerte,
  tendencia,
  analizar,
  loQueNote,
  instruccionesParaElPlan,
  MINIMO_PARA_CONCLUIR,
} from '../src/services/adaptacion.js';
import { claveDia } from '../src/services/fecha.js';

// Miércoles 19 de agosto de 2026. Todas las pruebas parten de aquí.
const HOY = new Date(2026, 7, 19);
const DIA_MS = 86_400_000;

const haceDias = (n) => claveDia(new Date(HOY.getTime() - n * DIA_MS));

const martes = [1, 8, 15, 22].map(haceDias);

// El caso que de verdad importa: alguien CONSTANTE al que se le atraviesa un
// día concreto. Cumple los 28 días MENOS los lunes.
const LUNES_ES_MI_ENEMIGO = (() => {
  const salida = [];
  for (let n = 0; n < 28; n += 1) {
    const fecha = new Date(HOY.getTime() - n * DIA_MS);
    if (fecha.getDay() !== 1) salida.push(claveDia(fecha));
  }
  return salida;
})();

// Alguien parejo: día sí, día no. Ningún día de la semana destaca ni flojea,
// y el cumplimiento queda en la zona de "mantener". No hay nada que ajustar.
const PAREJO = Array.from({ length: 14 }, (_, i) => haceDias(i * 2));

// --- Reparto por día de la semana ----------------------------------------

test('cuenta cuántas veces ocurrió cada día y cuántas se cumplió', () => {
  const c = porDiaDeLaSemana(martes, HOY);
  assert.equal(c.martes.hechos, 4);
  assert.ok(c.martes.vistos >= 4);
  assert.equal(c.martes.tasa, c.martes.hechos / c.martes.vistos);
});

test('un día sin marcar nunca queda en cero de vistos', () => {
  const c = porDiaDeLaSemana([], HOY);
  for (const d of ['lunes', 'martes', 'domingo']) {
    assert.ok(c[d].vistos >= 4, `${d} debió aparecer en la ventana`);
    assert.equal(c[d].hechos, 0);
    assert.equal(c[d].tasa, 0);
  }
});

// --- El hallazgo que el cumplimiento global esconde -----------------------

test('encuentra el día que se le atraviesa cuando de verdad contrasta', () => {
  const d = diaMasDificil(LUNES_ES_MI_ENEMIGO, HOY);
  assert.ok(d, 'debió encontrar el lunes');
  assert.equal(d.dia, 'lunes');
  assert.equal(d.hechos, 0);
  assert.ok(d.global > 0.7, 'y es un patrón porque en general sí cumple');
});

test('NO señala un día cuando en general cumple poco', () => {
  // Solo martes: seis días empatan en cero. Eso no es "los jueves te
  // cuestan", es poca adherencia en general. Culpar a un día al azar sería
  // inventar un patrón, y encima sonaría a reproche.
  assert.equal(diaMasDificil(martes, HOY), null);
});

test('no opina de un día que ha visto pocas veces', () => {
  const c = porDiaDeLaSemana([], HOY);
  assert.ok(c.lunes.vistos >= MINIMO_PARA_CONCLUIR, 'la ventana da suficientes lunes');
  assert.equal(diaMasDificil(LUNES_ES_MI_ENEMIGO, HOY, 2), null);
});

test('encuentra el día fuerte solo si de verdad casi nunca falla', () => {
  const f = diaMasFuerte(martes, HOY);
  assert.ok(f);
  assert.equal(f.dia, 'martes');
  assert.equal(f.tasa, 1);
});

test('sin ningún día bueno, no inventa uno', () => {
  assert.equal(diaMasFuerte([], HOY), null);
});

test('un día a medias no cuenta ni como fuerte ni como difícil', () => {
  const mitad = [martes[0], martes[1]];
  assert.ok(diaMasDificil(mitad, HOY)?.dia !== 'martes', 'no es flojo');
  assert.equal(diaMasFuerte(mitad, HOY), null, 'ni fuerte');
});

// --- Tendencia ------------------------------------------------------------

test('detecta que esta semana va mejor que la pasada', () => {
  assert.equal(tendencia([0, 1, 2, 3, 4].map(haceDias), HOY).direccion, 'sube');
});

test('detecta que va peor', () => {
  assert.equal(tendencia([8, 9, 10, 11, 12].map(haceDias), HOY).direccion, 'baja');
});

test('dos semanas iguales no son ni subida ni bajada', () => {
  assert.equal(tendencia([0, 1, 7, 8].map(haceDias), HOY).direccion, 'igual');
});

// --- La decisión completa -------------------------------------------------

test('poco cumplimiento manda bajar la dificultad', () => {
  const a = analizar([haceDias(3)], HOY);
  assert.ok(a.cumplimiento < 50);
  assert.equal(a.nivel, 'bajar');
});

test('mucho cumplimiento permite subir', () => {
  const a = analizar([0, 1, 2, 3, 4, 5, 6].map(haceDias), HOY);
  assert.equal(a.cumplimiento, 100);
  assert.equal(a.nivel, 'subir');
});

test('cuando hay un día flojo, el ajuste apunta a ESE día', () => {
  const a = analizar(LUNES_ES_MI_ENEMIGO, HOY);
  const aliviar = a.ajustes.find((x) => x.tipo === 'aliviar-dia');
  assert.ok(aliviar, 'debió proponer aliviar un día');
  assert.equal(aliviar.dia, 'lunes');
  assert.match(aliviar.porque, /cumpliste 0 de \d+ lunes/);
});

test('el ajuste siempre trae su porqué, nunca es una orden a ciegas', () => {
  const escenarios = [
    LUNES_ES_MI_ENEMIGO,
    [haceDias(3)],
    [0, 1, 2, 3, 4, 5, 6].map(haceDias),
    PAREJO,
  ];

  for (const dias of escenarios) {
    for (const a of analizar(dias, HOY).ajustes) {
      assert.ok(a.porque?.length > 0, `el ajuste ${a.tipo} no explica por qué`);
    }
  }
});

// --- Lo que se le dice al usuario ----------------------------------------

test('Brío se calla cuando no tiene nada que notar', () => {
  assert.equal(loQueNote(analizar(PAREJO, HOY), 'Daniel'), null);
});

test('cuando nota algo, lo dice sin culpar', () => {
  const texto = loQueNote(analizar(LUNES_ES_MI_ENEMIGO, HOY), 'Daniel');
  assert.ok(texto);
  assert.match(texto, /lunes/);

  const bajo = texto.toLowerCase();
  for (const mala of ['fracaso', 'excusas', 'deberías', 'fallaste', 'nunca cumples']) {
    assert.ok(!bajo.includes(mala), `"${texto}" usa "${mala}"`);
  }
  assert.ok(!texto.includes('!'), 'sin signos de admiración');

  const frases = texto.split(/[.!?]+/).filter((f) => f.trim());
  assert.ok(frases.length <= 2, `demasiadas frases: ${frases.length}`);
});

test('funciona sin nombre', () => {
  const texto = loQueNote(analizar(LUNES_ES_MI_ENEMIGO, HOY), '');
  assert.ok(!texto.startsWith(','), 'no empieza con coma suelta');
});

// --- Lo que se le manda a la IA ------------------------------------------

test('el análisis se traduce en órdenes, no en datos crudos', () => {
  const lineas = instruccionesParaElPlan(analizar(LUNES_ES_MI_ENEMIGO, HOY));
  assert.ok(lineas.length > 0);
  assert.match(lineas[0], /^El lunes debe ser descanso o suave/);
  assert.match(lineas[0], /cumpliste/, 'la orden lleva su justificación');
});

test('sin nada que ajustar no se le manda ruido a la IA', () => {
  // Cumplimiento parejo y en zona de mantener: no hay orden que dar.
  const a = analizar(PAREJO, HOY);
  assert.equal(a.nivel, 'mantener');
  assert.deepEqual(instruccionesParaElPlan(a), []);
});

test('cumplir poco SÍ genera una orden: bajar toda la semana', () => {
  const lineas = instruccionesParaElPlan(analizar([haceDias(3)], HOY));
  assert.equal(lineas.length, 1);
  assert.match(lineas[0], /^Baja la dificultad de toda la semana/);
});

test('no revienta sin historial', () => {
  assert.doesNotThrow(() => analizar([], HOY));
  assert.doesNotThrow(() => analizar(undefined, HOY));
  assert.equal(analizar([], HOY).cumplimiento, 0);
});
