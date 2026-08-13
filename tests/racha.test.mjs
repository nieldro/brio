import test from 'node:test';
import assert from 'node:assert/strict';

import {
  completarDia,
  estaCompletado,
  rachaVigente,
  rachaRota,
  textoHecho,
  subCelebracion,
  fraseDelDia,
} from '../src/services/racha.js';

// Fechas fijas para que las pruebas no dependan del día en que se corren.
const LUNES = new Date(2026, 7, 10);
const MARTES = new Date(2026, 7, 11);
const MIERCOLES = new Date(2026, 7, 12);
const VIERNES = new Date(2026, 7, 14);

const limpio = { ultimoDiaCompletado: null, rachaActual: 0, mejorRacha: 0 };

test('el primer día marcado arranca la racha en 1', () => {
  const e = completarDia(limpio, LUNES);
  assert.equal(e.rachaActual, 1);
  assert.equal(e.mejorRacha, 1);
  assert.equal(e.ultimoDiaCompletado, '2026-08-10');
});

test('marcar dos veces el mismo día no infla la racha', () => {
  const uno = completarDia(limpio, LUNES);
  const dos = completarDia(uno, LUNES);
  assert.equal(dos.rachaActual, 1);
  assert.equal(dos, uno, 'devuelve el mismo objeto, sin cambios');
});

test('días consecutivos encadenan', () => {
  let e = completarDia(limpio, LUNES);
  e = completarDia(e, MARTES);
  e = completarDia(e, MIERCOLES);
  assert.equal(e.rachaActual, 3);
  assert.equal(e.mejorRacha, 3);
});

test('saltarse un día reinicia la racha en 1 pero conserva la mejor', () => {
  let e = completarDia(limpio, LUNES);
  e = completarDia(e, MARTES);
  e = completarDia(e, MIERCOLES); // racha 3
  e = completarDia(e, VIERNES); // se saltó el jueves
  assert.equal(e.rachaActual, 1);
  assert.equal(e.mejorRacha, 3, 'la mejor racha nunca baja');
});

test('estaCompletado solo es cierto el día que se marcó', () => {
  const e = completarDia(limpio, MARTES);
  assert.equal(estaCompletado(e, MARTES), true);
  assert.equal(estaCompletado(e, MIERCOLES), false);
});

test('la racha sigue viva al día siguiente sin haber marcado aún', () => {
  const e = completarDia(limpio, MARTES);
  assert.equal(rachaVigente(e, MIERCOLES), 1, 'todavía puede marcar hoy');
  assert.equal(rachaRota(e, MIERCOLES), false);
});

test('la racha se corta si pasan dos días sin marcar', () => {
  const e = completarDia(limpio, MARTES);
  assert.equal(rachaVigente(e, VIERNES), 0);
  assert.equal(rachaRota(e, VIERNES), true);
});

test('usuario nuevo no tiene racha rota', () => {
  assert.equal(rachaVigente(limpio, LUNES), 0);
  assert.equal(rachaRota(limpio, LUNES), false, 'nunca empezó, no rompió nada');
});

test('la racha rota da la frase sin culpa del documento', () => {
  const frase = fraseDelDia({ completadoHoy: false, racha: 0, rota: true });
  assert.equal(frase, 'Ayer no se pudo. Normal. Hoy arrancamos suave.');
});

test('ningún texto usa palabras prohibidas', () => {
  const PROHIBIDAS = [
    'fracaso',
    'excusas',
    'deberías',
    'quemar grasa',
    'cuerpo ideal',
    'sin dolor',
  ];

  const textos = [
    textoHecho(1),
    textoHecho(5),
    subCelebracion(1),
    subCelebracion(3),
    subCelebracion(10),
    fraseDelDia({ completadoHoy: true, racha: 1 }),
    fraseDelDia({ completadoHoy: true, racha: 4 }),
    fraseDelDia({ completadoHoy: false, racha: 0 }),
    fraseDelDia({ completadoHoy: false, racha: 3 }),
    fraseDelDia({ completadoHoy: false, racha: 0, rota: true }),
  ];

  for (const t of textos) {
    for (const mala of PROHIBIDAS) {
      assert.ok(
        !t.toLowerCase().includes(mala),
        `"${t}" contiene la palabra prohibida "${mala}"`,
      );
    }
    assert.ok(t.length > 0, 'ningún texto puede quedar vacío');
  }
});
