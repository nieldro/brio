import { app } from '@azure/functions';

import { ajustesFaltantes } from '../lib/config.js';
import { admin, usuarioDelToken } from '../lib/supabase.js';
import { generar } from '../lib/gemini.js';
import { promptPlan } from '../lib/prompts.js';
import { extraerJson, validarPlan } from '../lib/planJson.js';
import { leerPerfil, contextoSemana } from '../lib/datos.js';
import { fechaValida, hoyUtc } from '../lib/fechas.js';
import { ok, noAutorizado, malaPeticion, sinConfigurar, falloIA, cuerpoJson } from '../lib/http.js';

const TIEMPO_POR_DEFECTO = 20;

// POST /api/plan
// Genera el plan de la semana y lo guarda en `planes`.
// Se invoca al terminar el onboarding y cada semana (fase 6, Timer Trigger).
async function manejar(request, context) {
  const faltan = ajustesFaltantes();
  if (faltan.length) return sinConfigurar(faltan);

  const usuario = await usuarioDelToken(request);
  if (!usuario) return noAutorizado();

  const cuerpo = await cuerpoJson(request);
  const hoy = fechaValida(cuerpo.fecha) ?? hoyUtc();

  const perfil = await leerPerfil(usuario.id);
  if (!perfil) return malaPeticion('todavía no hay perfil para este usuario');

  const { semana, cumplimiento } = await contextoSemana(usuario.id, hoy);
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
  });

  // Se valida el JSON y se reintenta UNA vez si falla, como manda el documento.
  let plan = null;
  let ultimosErrores = [];

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
                : `El intento anterior falló por: ${ultimosErrores.join('; ')}. Corrígelo y responde solo el JSON.`,
          },
        ],
        temperatura: 0.3,
        timeoutMs: 30000,
      });

      const revision = validarPlan(extraerJson(crudo), { tiempoMax: tiempo });
      if (revision.ok) {
        plan = revision.plan;
      } else {
        ultimosErrores = revision.errores;
        context.warn(`plan inválido en el intento ${intento}: ${revision.errores.join('; ')}`);
      }
    } catch (e) {
      ultimosErrores = [e.message];
      context.error(`fallo al generar el plan en el intento ${intento}: ${e.message}`);
    }
  }

  if (!plan) return falloIA();

  const { error } = await admin()
    .from('planes')
    .insert({ user_id: usuario.id, semana, plan, cumplimiento });

  if (error) {
    context.error(`no se pudo guardar el plan: ${error.message}`);
    // El plan es bueno: se devuelve aunque no se haya podido guardar.
  }

  return ok({ semana, cumplimiento, plan });
}

app.http('plan', {
  methods: ['POST'],
  // La autorización real es el token de Supabase, no una clave de función.
  authLevel: 'anonymous',
  handler: manejar,
});
