import { app } from '@azure/functions';

import { ajustesFaltantes } from '../lib/config.js';
import { crearPlan } from '../lib/planificador.js';
import { hoyUtc, restarDias } from '../lib/fechas.js';
import { usuariosParaLaTanda } from '../lib/datos.js';
import { aQuienLeToca, enTandas, DIAS_SIN_MOVERSE } from '../lib/tanda.js';

// Lunes a las 9:00 UTC (4 a. m. en Bogotá): el plan nuevo está listo
// antes de que nadie abra la app.
const LUNES_TEMPRANO = '0 0 9 * * 1';

async function manejar(_temporizador, context) {
  const faltan = ajustesFaltantes();
  if (faltan.length) {
    context.error(`plan-semanal sin configurar: ${faltan.join(', ')}`);
    return;
  }

  const hoy = hoyUtc();

  let candidatos = [];
  try {
    candidatos = await usuariosParaLaTanda(restarDias(hoy, DIAS_SIN_MOVERSE));
  } catch (e) {
    context.error(`no se pudieron leer los usuarios: ${e.message}`);
    return;
  }

  const fila = aQuienLeToca(candidatos, hoy);
  context.log(`plan nuevo para ${fila.length} de ${candidatos.length} con plan y movimiento`);

  const { hechos, quedaron, sinTiempo } = await enTandas(fila, async ({ userId }) => {
    const resultado = await crearPlan(userId, hoy, context);
    if (resultado.error) context.warn(`sin plan nuevo para ${userId}: ${resultado.error}`);
    return resultado;
  });

  const listos = hechos.filter((h) => h.resultado && !h.resultado.error).length;
  context.log(`planes nuevos: ${listos} de ${fila.length}`);

  // Si el tiempo no alcanzó se dice, y se dice fuerte. Una tanda recortada en
  // silencio se lee igual que una que terminó. La semana entrante estos son
  // los primeros de la fila, porque el orden es por plan más viejo.
  if (sinTiempo) context.error(`se acabó el tiempo: ${quedaron} quedaron para la próxima`);
}

app.timer('plan-semanal', { schedule: LUNES_TEMPRANO, handler: manejar });
