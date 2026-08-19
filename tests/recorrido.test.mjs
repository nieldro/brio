import test from 'node:test';
import assert from 'node:assert/strict';

import {
  totales,
  semanasConMovimiento,
  mapaDeDias,
  hitoAlcanzado,
  textoDeHito,
  proximoHito,
  textoDeTotales,
  HITOS,
} from '../src/services/recorrido.js';
import { hallazgos } from '../src/services/adaptacion.js';
import { claveDia, sumarDias } from '../src/services/fecha.js';

// Miércoles 19 de agosto de 2026, a mediodía.
const HOY = new Date(2026, 7, 19, 12);
const hace = (n) => sumarDias(claveDia(HOY), -n);

// --- Totales: todos suben, ninguno baja -----------------------------------

test('cuenta días, hábitos y líneas sin repetir', () => {
  const t = totales({
    diasCompletados: [hace(0), hace(1), hace(1)],
    habitosHechos: { agua: [hace(0), hace(1)], estirar: [hace(0)] },
    diario: { [hace(0)]: 'algo', [hace(1)]: '   ' },
  });

  assert.equal(t.dias, 2, 'el día repetido no cuenta dos veces');
  assert.equal(t.habitos, 3);
  assert.equal(t.lineas, 1, 'una línea en blanco no es una línea escrita');
});

test('sin nada hecho, todo en cero y sin reproche', () => {
  const t = totales({});
  assert.deepEqual(t, { dias: 0, habitos: 0, lineas: 0, semanas: 0 });
  assert.match(textoDeTotales(t), /empieza cuando quieras/i);
});

test('las semanas cuentan permanencia, no días seguidos', () => {
  // Dos días de la misma semana son una semana. Uno de cada semana, dos.
  assert.equal(semanasConMovimiento([hace(0), hace(1)]), 1);
  assert.equal(semanasConMovimiento([hace(0), hace(10)]), 2);
  assert.equal(semanasConMovimiento([]), 0);
});

test('faltar no baja ningún número', () => {
  // El mismo historial con un hueco enorme sigue sumando lo mismo.
  const seguidos = totales({ diasCompletados: [hace(0), hace(1), hace(2)] });
  const conHueco = totales({ diasCompletados: [hace(0), hace(40), hace(80)] });

  assert.equal(seguidos.dias, conHueco.dias);
});

// --- El mapa --------------------------------------------------------------

test('el mapa trae ocho semanas de siete días', () => {
  const mapa = mapaDeDias([], HOY);
  assert.equal(mapa.length, 8);
  assert.ok(mapa.every((s) => s.length === 7));
});

test('el mapa empieza en lunes', () => {
  // Si no empezara en lunes, las columnas no serían días de la semana y las
  // iniciales de abajo mentirían.
  const [primera] = mapaDeDias([], HOY);
  const [a, m, d] = primera[0].clave.split('-').map(Number);
  assert.equal(new Date(a, m - 1, d).getDay(), 1);
});

test('el mapa marca lo hecho, señala hoy y apaga el futuro', () => {
  const mapa = mapaDeDias([hace(3)], HOY).flat();

  assert.equal(mapa.filter((c) => c.hecho).length, 1);
  assert.equal(mapa.filter((c) => c.esHoy).length, 1);
  assert.ok(mapa.some((c) => c.futuro), 'la semana en curso tiene días por venir');
  assert.ok(!mapa.find((c) => c.esHoy).futuro, 'hoy no es futuro');
});

test('un día futuro nunca se muestra como hecho', () => {
  const mañana = sumarDias(claveDia(HOY), 1);
  const celda = mapaDeDias([mañana], HOY)
    .flat()
    .find((c) => c.clave === mañana);

  assert.equal(celda.futuro, true);
});

// --- Hitos ----------------------------------------------------------------

test('los hitos se celebran justo al llegar', () => {
  assert.equal(hitoAlcanzado(7), 7);
  assert.equal(hitoAlcanzado(8), null);
  assert.equal(hitoAlcanzado(0), null);
});

test('el próximo hito muestra avance, nunca cuenta regresiva', () => {
  // "Te faltan 3" es una cuenta que se puede perder. El avance solo sube.
  const p = proximoHito(5);
  assert.equal(p.meta, 7);
  assert.ok(p.fraccion > 0 && p.fraccion < 1);
});

test('el último hito no deja a nadie sin sitio a dónde ir', () => {
  assert.equal(proximoHito(HITOS[HITOS.length - 1]), null);
});

test('los textos de hito no prometen ni gritan', () => {
  for (const h of HITOS) {
    const t = textoDeHito(h);
    assert.ok(t.titulo && t.sub, `${h} sin texto`);
    assert.ok(!t.titulo.includes('!') && !t.sub.includes('!'), `${h} grita`);
    assert.ok(!/kilo|peso|cuerpo|adelgaz/i.test(`${t.titulo} ${t.sub}`), `${h} habla del cuerpo`);
  }
});

// --- Hallazgos ------------------------------------------------------------

test('sin historial no se inventa ningún hallazgo', () => {
  assert.deepEqual(hallazgos([], HOY), []);
});

test('cada hallazgo trae su evidencia', () => {
  // Cuatro semanas cumpliendo casi todo menos los lunes.
  const dias = [];
  for (let i = 0; i < 28; i += 1) {
    const clave = hace(i);
    const [a, m, d] = clave.split('-').map(Number);
    if (new Date(a, m - 1, d).getDay() !== 1) dias.push(clave);
  }

  const notas = hallazgos(dias, HOY, { regresos: 2, semanas: 5 });

  assert.ok(notas.length >= 2, `solo salieron ${notas.length}`);
  assert.ok(notas.every((n) => n.titulo && n.texto && n.tono));
  assert.ok(notas.some((n) => n.clave === 'dia-dificil'), 'no vio los lunes');
  assert.ok(notas.some((n) => n.clave === 'regresos'));
});

test('ningún hallazgo reprocha ni cuenta lo perdido', () => {
  const dias = Array.from({ length: 20 }, (_, i) => hace(i));
  const notas = hallazgos(dias, HOY, { regresos: 3, semanas: 4 });

  const REPROCHE = /fallaste|perdiste|te faltaron|llevas sin|deber[íi]as|excusa/i;

  for (const n of notas) {
    const todo = `${n.titulo} ${n.texto}`;
    assert.ok(!REPROCHE.test(todo), `"${todo}" reprocha`);
    assert.ok(!todo.includes('!'), `"${todo}" grita`);
  }
});

test('una semana peor se dice sin culpar a la persona', () => {
  // Semana pasada casi entera, esta casi nada.
  const dias = [];
  for (let i = 7; i < 14; i += 1) dias.push(hace(i));

  const notas = hallazgos(dias, HOY);
  const baja = notas.find((n) => n.clave === 'baja');

  assert.ok(baja, 'no notó la bajada');
  assert.match(baja.texto, /no significa nada sobre ti/i);
});
