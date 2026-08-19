import test from 'node:test';
import assert from 'node:assert/strict';

import {
  horaLocal,
  debeEnviarse,
  textoRecordatorio,
  MAXIMO_DIARIO,
} from '../src/lib/recordatorio.js';

// 14 de agosto de 2026, 12:00 UTC = 07:00 en Bogotá (UTC-5).
const MEDIODIA_UTC = new Date('2026-08-14T12:00:00Z');

const perfilBase = {
  push_token: 'ExponentPushToken[abc]',
  hora_recordatorio: '07:00',
  zona_horaria: 'America/Bogota',
  recordatorios_fecha: null,
  recordatorios_enviados: 0,
};

// --- horaLocal ------------------------------------------------------------

test('horaLocal traduce UTC a la hora del usuario', () => {
  const bogota = horaLocal(MEDIODIA_UTC, 'America/Bogota');
  assert.equal(bogota.hora, 7);
  assert.equal(bogota.fecha, '2026-08-14');

  const madrid = horaLocal(MEDIODIA_UTC, 'Europe/Madrid');
  assert.equal(madrid.hora, 14);
});

test('horaLocal cambia de día antes que el servidor', () => {
  // 03:00 UTC del 15 son todavía las 22:00 del 14 en Bogotá.
  const local = horaLocal(new Date('2026-08-15T03:00:00Z'), 'America/Bogota');
  assert.equal(local.fecha, '2026-08-14');
  assert.equal(local.hora, 22);
});

test('una zona inválida cae a la de por defecto en vez de reventar', () => {
  const local = horaLocal(MEDIODIA_UTC, 'Marte/Olympus');
  assert.equal(local.zona, 'America/Bogota');
  assert.equal(local.hora, 7);
});

// --- debeEnviarse ---------------------------------------------------------

test('envía a la hora que el usuario eligió', () => {
  assert.equal(debeEnviarse(perfilBase, MEDIODIA_UTC), true);
});

test('no envía a una hora que no es la suya', () => {
  assert.equal(debeEnviarse({ ...perfilBase, hora_recordatorio: '20:00' }, MEDIODIA_UTC), false);
});

test('los minutos que eligió también cuentan', () => {
  // El selector ofrece :00, :15, :30 y :45, y la pantalla dice por escrito
  // "Te escribo a las 07:45". Antes solo se comparaba la hora, así que ese
  // aviso salía a las 07:00: cuarenta y cinco minutos antes de lo prometido,
  // y sin ninguna corrida después que lo entregara a tiempo.
  const alasSieteCuarentaYCinco = { ...perfilBase, hora_recordatorio: '07:45' };

  // 12:00 UTC son las 07:00 en Bogotá: todavía no le toca.
  assert.equal(debeEnviarse(alasSieteCuarentaYCinco, MEDIODIA_UTC), false);

  // 12:45 UTC son las 07:45: ahora sí.
  const suHora = new Date('2026-08-14T12:45:00Z');
  assert.equal(debeEnviarse(alasSieteCuarentaYCinco, suHora), true);
});

test('quien pidió en punto no recibe a y cuarto', () => {
  const yCuarto = new Date('2026-08-14T12:15:00Z');
  assert.equal(debeEnviarse(perfilBase, yCuarto), false);
});

test('unos segundos tarde no le quitan el aviso a nadie', () => {
  // El Timer no arranca clavado. Se compara el cuarto de hora, no el minuto
  // exacto, para que un arranque de 12:45:40 siga contando como las 07:45.
  const conRetraso = new Date('2026-08-14T12:45:40Z');
  assert.equal(debeEnviarse({ ...perfilBase, hora_recordatorio: '07:45' }, conRetraso), true);
});

test('una hora mal escrita no manda nada', () => {
  assert.equal(debeEnviarse({ ...perfilBase, hora_recordatorio: '07' }, MEDIODIA_UTC), false);
  assert.equal(debeEnviarse({ ...perfilBase, hora_recordatorio: 'siete' }, MEDIODIA_UTC), false);
});

test('no envía sin token ni sin hora', () => {
  assert.equal(debeEnviarse({ ...perfilBase, push_token: null }, MEDIODIA_UTC), false);
  assert.equal(debeEnviarse({ ...perfilBase, hora_recordatorio: null }, MEDIODIA_UTC), false);
});

test('respeta el tope de dos notificaciones al día', () => {
  const alTope = {
    ...perfilBase,
    recordatorios_fecha: '2026-08-14',
    recordatorios_enviados: MAXIMO_DIARIO,
  };
  assert.equal(debeEnviarse(alTope, MEDIODIA_UTC), false);

  const conUna = { ...alTope, recordatorios_enviados: 1 };
  assert.equal(debeEnviarse(conUna, MEDIODIA_UTC), true);
});

test('el tope se cuenta por el día local, no por el del servidor', () => {
  // Ayer llegó al tope; hoy vuelve a tener cupo.
  const ayerLleno = {
    ...perfilBase,
    recordatorios_fecha: '2026-08-13',
    recordatorios_enviados: MAXIMO_DIARIO,
  };
  assert.equal(debeEnviarse(ayerLleno, MEDIODIA_UTC), true);
});

test('la hora se compara contra la zona del usuario', () => {
  // Las 07:00 en Madrid no son las 07:00 en Bogotá.
  const enMadrid = { ...perfilBase, zona_horaria: 'Europe/Madrid' };
  assert.equal(debeEnviarse(enMadrid, MEDIODIA_UTC), false);
  assert.equal(debeEnviarse(enMadrid, new Date('2026-08-14T05:00:00Z')), true);
});

// --- textoRecordatorio ----------------------------------------------------

const PROHIBIDAS = ['fracaso', 'excusas', 'deberías', 'quemar grasa', 'cuerpo ideal', 'sin dolor'];

function revisarVoz(texto) {
  const todo = `${texto.titulo} ${texto.cuerpo}`.toLowerCase();
  for (const mala of PROHIBIDAS) {
    assert.ok(!todo.includes(mala), `"${todo}" usa "${mala}"`);
  }
  // Máximo 2 frases entre título y cuerpo.
  const frases = `${texto.titulo}. ${texto.cuerpo}`.split(/[.!?]+/).filter((f) => f.trim());
  assert.ok(frases.length <= 2, `demasiadas frases: ${frases.length}`);
}

test('a quien ya cumplió no se le insiste', () => {
  const texto = textoRecordatorio({
    nombre: 'Daniel',
    dia: { tipo: 'entrenamiento', reto: 'Primer paso', duracion_min: 10 },
    completadoHoy: true,
  });
  assert.equal(texto, null);
});

test('el recordatorio nombra el reto y su duración', () => {
  const texto = textoRecordatorio({
    nombre: 'Daniel',
    dia: { tipo: 'entrenamiento', reto: 'Primer paso', duracion_min: 10 },
    completadoHoy: false,
  });
  assert.match(texto.titulo, /Daniel/);
  assert.match(texto.titulo, /Primer paso/);
  assert.match(texto.cuerpo, /10 minutos/);
  revisarVoz(texto);
});

test('el día de descanso no empuja a entrenar', () => {
  const texto = textoRecordatorio({
    nombre: 'Daniel',
    dia: { tipo: 'descanso', reto: 'Descanso de verdad', duracion_min: 0 },
    completadoHoy: false,
  });
  assert.match(texto.cuerpo, /parte del plan/);
  revisarVoz(texto);
});

test('sin plan todavía, el mensaje no exige nada', () => {
  const texto = textoRecordatorio({ nombre: 'Daniel', dia: null, completadoHoy: false });
  revisarVoz(texto);
  assert.ok(texto.cuerpo.length > 0);
});

test('funciona sin nombre', () => {
  const texto = textoRecordatorio({
    nombre: '',
    dia: { tipo: 'entrenamiento', reto: 'Caminata', duracion_min: 15 },
    completadoHoy: false,
  });
  assert.ok(!texto.titulo.startsWith(','), 'no puede empezar con una coma suelta');
  revisarVoz(texto);
});
