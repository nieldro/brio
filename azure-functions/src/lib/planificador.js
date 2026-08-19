import { admin } from './supabase.js';
import { generar } from './gemini.js';
import { promptPlan } from './prompts.js';
import { extraerJson, validarPlan } from './planJson.js';
import { leerPerfil, contextoSemana } from './datos.js';

const TIEMPO_POR_DEFECTO = 20;

// Generación del plan semanal. La comparten la función HTTP `plan`
// (al terminar el onboarding) y el Timer `plan-semanal`.
//
// Devuelve { plan, semana, cumplimiento } o { error }.
export async function crearPlan(userId, hoy, log = console, ajustes = []) {
  const perfil = await leerPerfil(userId);
  if (!perfil) return { error: 'sin perfil' };

  const { semana, cumplimiento } = await contextoSemana(userId, hoy);
  const tiempo = perfil.tiempo_min ?? TIEMPO_POR_DEFECTO;

  const instruccion = promptPlan({
    edad: perfil.edad ?? 'no dice',
    peso: perfil.peso ?? 'no dice',
    estatura: perfil.estatura ?? 'no dice',
    objetivo: perfil.objetivo ?? 'Crear el hábito',
    lugar: perfil.lugar ?? 'En casa',
    tiempo,
    semana,
    cumplimiento,
    nivel: perfil.nivel ?? 'inicio',
    // Se filtra y se recorta: viene de la app, así que no se confía a ciegas.
    ajustes: (Array.isArray(ajustes) ? ajustes : [])
      .filter((a) => typeof a === 'string' && a.length < 200)
      .slice(0, 5),
  });

  // Se valida el JSON y se reintenta UNA vez, como manda el documento.
  let plan = null;
  let fallos = [];

  for (let intento = 1; intento <= 2 && !plan; intento += 1) {
    try {
      const crudo = await generar({
        instruccion,
        historial: [
          {
            rol: 'user',
            texto:
              intento === 1
                ? 'Genera el plan.'
                : `El intento anterior falló por: ${fallos.join('; ')}. Corrígelo y responde solo el JSON.`,
          },
        ],
        temperatura: 0.3,
        timeoutMs: 30000,
        log,
      });

      const revision = validarPlan(extraerJson(crudo), { tiempoMax: tiempo });
      if (revision.ok) plan = revision.plan;
      else {
        fallos = revision.errores;
        log.warn?.(`plan inválido (intento ${intento}) para ${userId}: ${fallos.join('; ')}`);
      }
    } catch (e) {
      fallos = [e.message];
      log.error?.(`fallo al generar plan (intento ${intento}) para ${userId}: ${e.message}`);
    }
  }

  if (!plan) return { error: fallos.join('; ') || 'la IA no devolvió un plan válido' };

  const { error } = await admin()
    .from('planes')
    .insert({ user_id: userId, semana, plan, cumplimiento });

  // El plan es bueno aunque no se haya podido guardar: se devuelve igual.
  if (error) log.error?.(`no se pudo guardar el plan de ${userId}: ${error.message}`);

  // El nivel del perfil sigue al cumplimiento, para el prompt de la próxima.
  const nivel = cumplimiento > 80 ? 'avance' : cumplimiento < 50 ? 'inicio' : 'constancia';
  await admin().from('profiles').update({ nivel }).eq('id', userId);

  return { plan, semana, cumplimiento };
}
