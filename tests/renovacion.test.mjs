import test from 'node:test';
import assert from 'node:assert/strict';

import {
  planVencido,
  sePuedeIntentar,
  ajustesParaRenovar,
  queHacerConElPlan,
  DIAS_DE_VIGENCIA,
} from '../src/services/renovacion.js';
import { claveDia, sumarDias } from '../src/services/fecha.js';

const HOY = new Date(2026, 7, 19, 12);
const hace = (n) => sumarDias(claveDia(HOY), -n);

const PLAN = { semana: 1, dias: [] };

// --- Cuándo está vencido --------------------------------------------------

test('un plan de esta semana no se toca', () => {
  assert.equal(planVencido({ plan: PLAN, planDesde: hace(0) }, HOY), false);
  assert.equal(planVencido({ plan: PLAN, planDesde: hace(3) }, HOY), false);
  assert.equal(planVencido({ plan: PLAN, planDesde: hace(6) }, HOY), false);
});

test('a los siete días se renueva', () => {
  assert.equal(planVencido({ plan: PLAN, planDesde: hace(DIAS_DE_VIGENCIA) }, HOY), true);
  assert.equal(planVencido({ plan: PLAN, planDesde: hace(30) }, HOY), true);
});

test('sin plan no se pide nada: de eso se encarga el onboarding', () => {
  // Pedirlo aquí le pisaría el paso al paso 10, y la persona vería dos
  // peticiones al mismo tiempo en su primera pantalla.
  assert.equal(planVencido({ plan: null, planDesde: null }, HOY), false);
});

test('un plan sin fecha se da por vencido', () => {
  // Viene de una versión anterior, cuando la fecha no se guardaba. Es mejor
  // renovar de más que dejar a alguien clavado en un plan viejo.
  assert.equal(planVencido({ plan: PLAN, planDesde: null }, HOY), true);
});

// --- El reintento ---------------------------------------------------------

test('sin señal no se machaca la red', () => {
  const ahora = 1_000_000_000;
  assert.equal(sePuedeIntentar(null, ahora), true);
  assert.equal(sePuedeIntentar(ahora - 60_000, ahora), false);
  assert.equal(sePuedeIntentar(ahora - 7 * 3_600_000, ahora), true);
});

// --- Los ajustes que viajan -----------------------------------------------

test('lo que Brío notó llega a quien arma el plan', () => {
  // Este era el cable suelto: el análisis existía y solo se mostraba en
  // Progreso. Una app que dice "noté que los lunes te cuestan" y a la semana
  // siguiente te vuelve a poner el lunes pesado no notó nada.
  const dias = [];
  for (let i = 0; i < 28; i += 1) {
    const clave = hace(i);
    const [a, m, d] = clave.split('-').map(Number);
    const esLunes = new Date(Date.UTC(a, m - 1, d)).getUTCDay() === 1;
    if (!esLunes) dias.push(clave);
  }

  const ajustes = ajustesParaRenovar(dias, HOY);
  assert.ok(
    ajustes.some((a) => /lunes/i.test(a) && /descanso o suave/i.test(a)),
    JSON.stringify(ajustes),
  );
});

test('quien vuelve después de semanas recibe una semana más suave', () => {
  // Sin días marcados el cumplimiento es cero, y de ahí sale la orden de bajar
  // toda la semana. Es exactamente lo que tiene que pasar: volver y encontrar
  // el plan exigente que se abandonó es la forma más rápida de volverse a ir.
  const ajustes = ajustesParaRenovar([], HOY);

  assert.ok(
    ajustes.some((a) => /baja la dificultad/i.test(a)),
    JSON.stringify(ajustes),
  );
});

test('ningún ajuste le habla al usuario: son órdenes para la IA', () => {
  // Van dentro del prompt, no a la pantalla. Si alguno sonara a reproche y
  // el modelo lo repitiera, saldría en la app.
  const PROHIBIDO = /fracas|excusa|deber[íi]as|culpa|gord|flac|quemar grasa/i;

  for (const a of ajustesParaRenovar([], HOY)) {
    assert.ok(!PROHIBIDO.test(a), `"${a}" no debería existir`);
  }
});

// --- La decisión completa -------------------------------------------------

test('decide renovar y con qué', () => {
  const que = queHacerConElPlan(
    { plan: PLAN, planDesde: hace(9), diasCompletados: [] },
    HOY,
    null,
    Date.parse('2026-08-19T12:00:00Z'),
  );

  assert.equal(que.renovar, true);
  assert.ok(Array.isArray(que.ajustes));
});

test('no renueva dos veces seguidas aunque el plan siga vencido', () => {
  const estado = { plan: PLAN, planDesde: hace(9), diasCompletados: [] };
  const ahora = Date.parse('2026-08-19T12:00:00Z');

  assert.equal(queHacerConElPlan(estado, HOY, null, ahora).renovar, true);
  assert.equal(queHacerConElPlan(estado, HOY, ahora - 1000, ahora).motivo, 'espera');
});

test('con el plan vigente no hace nada', () => {
  const que = queHacerConElPlan({ plan: PLAN, planDesde: hace(1), diasCompletados: [] }, HOY);
  assert.equal(que.renovar, false);
  assert.equal(que.motivo, 'vigente');
});
