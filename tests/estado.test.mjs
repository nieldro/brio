import test from 'node:test';
import assert from 'node:assert/strict';

import { reducer, estadoInicial, persistible } from '../src/state/usuarioReducer.js';
import { estaCompletado, rachaVigente, rachaRota } from '../src/services/racha.js';

const LUNES = new Date(2026, 7, 10);
const MARTES = new Date(2026, 7, 11);
const JUEVES = new Date(2026, 7, 13);

const aplicar = (estado, ...acciones) => acciones.reduce(reducer, estado);

const PERFIL = {
  nombre: 'Daniel',
  objetivo: 'Sentirme mejor',
  porque: 'Tener energía',
  edad: 30,
  estatura: 175,
  peso: 80,
  lugar: 'En casa',
  tiempo_min: 20,
  hora_recordatorio: '07:00',
};

// --- Arranque -------------------------------------------------------------

test('antes de hidratar, la app no muestra nada del usuario', () => {
  assert.equal(estadoInicial.hidratado, false);
  assert.equal(estadoInicial.onboardingListo, false);
});

test('hidratar con disco vacío deja el estado inicial listo', () => {
  const e = reducer(estadoInicial, { tipo: 'HIDRATAR', datos: null });
  assert.equal(e.hidratado, true);
  assert.equal(e.onboardingListo, false);
});

test('hidratar con datos guardados restaura la sesión', () => {
  const e = reducer(estadoInicial, {
    tipo: 'HIDRATAR',
    datos: {
      onboardingListo: true,
      perfil: { ...estadoInicial.perfil, nombre: 'Daniel' },
      rachaActual: 3,
      mejorRacha: 5,
      ultimoDiaCompletado: '2026-08-13',
      diasCompletados: ['2026-08-13'],
    },
  });

  assert.equal(e.onboardingListo, true);
  assert.equal(e.perfil.nombre, 'Daniel');
  assert.equal(e.rachaActual, 3);
});

// --- Onboarding -----------------------------------------------------------

test('terminar el onboarding guarda perfil y plan', () => {
  const plan = { semana: 1, dias: [] };
  const e = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: null },
    { tipo: 'TERMINAR_ONBOARDING', perfil: PERFIL, plan },
  );

  assert.equal(e.onboardingListo, true);
  assert.equal(e.perfil.nombre, 'Daniel');
  assert.equal(e.plan, plan);
});

test('si la IA no respondió, el onboarding termina igual y sin plan', () => {
  const e = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: null },
    { tipo: 'TERMINAR_ONBOARDING', perfil: PERFIL, plan: undefined },
  );

  assert.equal(e.onboardingListo, true, 'el usuario nunca se queda atrapado');
  assert.equal(e.plan, null, 'las pantallas caen al plan de arranque');
});

// --- Día a día ------------------------------------------------------------

test('marcar el día suma racha y lo agrega a los días completados', () => {
  const e = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: null },
    { tipo: 'COMPLETAR_DIA', hoy: LUNES },
  );

  assert.equal(e.rachaActual, 1);
  assert.equal(e.mejorRacha, 1);
  assert.deepEqual(e.diasCompletados, ['2026-08-10']);
  assert.equal(estaCompletado(e, LUNES), true);
});

test('marcar dos veces el mismo día no duplica nada', () => {
  const e = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: null },
    { tipo: 'COMPLETAR_DIA', hoy: LUNES },
    { tipo: 'COMPLETAR_DIA', hoy: LUNES },
  );

  assert.equal(e.rachaActual, 1);
  assert.equal(e.diasCompletados.length, 1);
});

test('dos días seguidos encadenan la racha', () => {
  const e = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: null },
    { tipo: 'COMPLETAR_DIA', hoy: LUNES },
    { tipo: 'COMPLETAR_DIA', hoy: MARTES },
  );

  assert.equal(e.rachaActual, 2);
  assert.deepEqual(e.diasCompletados, ['2026-08-11', '2026-08-10']);
});

test('saltarse días corta la racha pero conserva el historial', () => {
  const e = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: null },
    { tipo: 'COMPLETAR_DIA', hoy: LUNES },
    { tipo: 'COMPLETAR_DIA', hoy: MARTES },
  );

  // El jueves, sin haber marcado el miércoles.
  assert.equal(rachaVigente(e, JUEVES), 0);
  assert.equal(rachaRota(e, JUEVES), true);
  assert.equal(e.mejorRacha, 2, 'la mejor racha no se pierde');
  assert.equal(e.diasCompletados.length, 2);
});

test('el logro del día queda guardado bajo su fecha', () => {
  const e = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: null },
    { tipo: 'GUARDAR_LOGRO', texto: 'Caminé sin excusa', hoy: LUNES },
  );

  assert.equal(e.diario['2026-08-10'], 'Caminé sin excusa');
});

// --- Cerrar sesión --------------------------------------------------------

test('reiniciar borra los datos pero no vuelve a mostrar la espera', () => {
  const usado = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: null },
    { tipo: 'TERMINAR_ONBOARDING', perfil: PERFIL },
    { tipo: 'COMPLETAR_DIA', hoy: LUNES },
  );

  const limpio = reducer(usado, { tipo: 'REINICIAR' });

  assert.equal(limpio.onboardingListo, false);
  assert.equal(limpio.perfil.nombre, '');
  assert.equal(limpio.rachaActual, 0);
  assert.deepEqual(limpio.diasCompletados, []);
  assert.equal(limpio.hidratado, true, 'sin esto, Raiz mostraría la chispa para siempre');
});

// --- Qué se guarda en disco ----------------------------------------------

test('lo que va al disco no arrastra datos de la sesión', () => {
  const e = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: { userId: 'uuid-123', enNube: true } },
    { tipo: 'TERMINAR_ONBOARDING', perfil: PERFIL },
  );

  const guardado = persistible(e);

  assert.equal('hidratado' in guardado, false);
  assert.equal('userId' in guardado, false);
  assert.equal('enNube' in guardado, false);
  assert.equal(guardado.perfil.nombre, 'Daniel');
});

test('lo guardado se puede volver a hidratar sin perder nada', () => {
  const original = aplicar(
    estadoInicial,
    { tipo: 'HIDRATAR', datos: null },
    { tipo: 'TERMINAR_ONBOARDING', perfil: PERFIL },
    { tipo: 'COMPLETAR_DIA', hoy: LUNES },
    { tipo: 'GUARDAR_LOGRO', texto: 'Primer día', hoy: LUNES },
  );

  // Cierra la app y la vuelve a abrir.
  const revivido = reducer(estadoInicial, {
    tipo: 'HIDRATAR',
    datos: JSON.parse(JSON.stringify(persistible(original))),
  });

  assert.equal(revivido.onboardingListo, true);
  assert.equal(revivido.perfil.nombre, 'Daniel');
  assert.equal(revivido.rachaActual, 1);
  assert.equal(revivido.diario['2026-08-10'], 'Primer día');
  assert.equal(estaCompletado(revivido, LUNES), true);
  assert.equal(estaCompletado(revivido, MARTES), false, 'mañana vuelve a estar sin marcar');
});
