import { app } from '@azure/functions';

import { ajustesFaltantes } from '../lib/config.js';
import { admin } from '../lib/supabase.js';
import { crearPlan } from '../lib/planificador.js';
import { hoyUtc } from '../lib/fechas.js';

// Lunes a las 9:00 UTC (4 a. m. en Bogotá): el plan nuevo está listo
// antes de que nadie abra la app.
const LUNES_TEMPRANO = '0 0 9 * * 1';

// Espacia las llamadas para no golpear la capa gratuita de Gemini de golpe.
const PAUSA_MS = 1500;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function manejar(_temporizador, context) {
  const faltan = ajustesFaltantes();
  if (faltan.length) {
    context.error(`plan-semanal sin configurar: ${faltan.join(', ')}`);
    return;
  }

  const hoy = hoyUtc();

  // Solo quien ya tiene al menos un plan: los demás lo reciben al terminar
  // el onboarding, no aquí.
  const { data: conPlan, error } = await admin().from('planes').select('user_id');

  if (error) {
    context.error(`no se pudieron leer los planes: ${error.message}`);
    return;
  }

  const usuarios = [...new Set((conPlan ?? []).map((p) => p.user_id))];
  context.log(`regenerando el plan de ${usuarios.length} usuario(s)`);

  let listos = 0;

  for (const userId of usuarios) {
    const resultado = await crearPlan(userId, hoy, context);
    if (resultado.error) context.warn(`sin plan nuevo para ${userId}: ${resultado.error}`);
    else listos += 1;

    await espera(PAUSA_MS);
  }

  context.log(`planes nuevos: ${listos} de ${usuarios.length}`);
}

app.timer('plan-semanal', { schedule: LUNES_TEMPRANO, handler: manejar });
