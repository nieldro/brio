import { app } from '@azure/functions';

import { ajustesFaltantes } from '../lib/config.js';
import { usuarioDelToken } from '../lib/supabase.js';
import { crearPlan } from '../lib/planificador.js';
import { fechaValida, hoyUtc } from '../lib/fechas.js';
import { ok, noAutorizado, malaPeticion, sinConfigurar, falloIA, cuerpoJson } from '../lib/http.js';

// POST /api/plan
// Genera el plan de la semana y lo guarda en `planes`.
// Se invoca al terminar el onboarding; el Timer `plan-semanal` hace lo mismo
// cada semana usando la misma función `crearPlan`.
async function manejar(request, context) {
  const faltan = ajustesFaltantes();
  if (faltan.length) return sinConfigurar(faltan);

  const usuario = await usuarioDelToken(request);
  if (!usuario) return noAutorizado();

  const cuerpo = await cuerpoJson(request);
  const hoy = fechaValida(cuerpo.fecha) ?? hoyUtc();

  const resultado = await crearPlan(usuario.id, hoy, context, cuerpo.ajustes);

  if (resultado.error === 'sin perfil') {
    return malaPeticion('todavía no hay perfil para este usuario');
  }
  if (resultado.error) return falloIA();

  return ok(resultado);
}

app.http('plan', {
  methods: ['POST'],
  // La autorización real es el token de Supabase, no una clave de función.
  authLevel: 'anonymous',
  handler: manejar,
});
