import { admin } from './supabase.js';
import { restarDias } from './fechas.js';

// Lecturas de Supabase que comparten las funciones. Todas filtran por el
// user_id que salió del token: la service role key salta RLS, así que el
// filtro explícito es la única barrera. Nunca quitarlo.

export async function leerPerfil(userId) {
  const { data } = await admin().from('profiles').select('*').eq('id', userId).maybeSingle();
  return data ?? null;
}

// Semana que toca generar y qué tan bien le fue en la anterior.
export async function contextoSemana(userId, hoy) {
  const [{ data: planes }, { data: hechos }] = await Promise.all([
    admin()
      .from('planes')
      .select('semana')
      .eq('user_id', userId)
      .order('semana', { ascending: false })
      .limit(1),
    admin()
      .from('registros')
      .select('fecha')
      .eq('user_id', userId)
      .eq('completado', true)
      .gte('fecha', restarDias(hoy, 7))
      .lt('fecha', hoy),
  ]);

  const semana = (planes?.[0]?.semana ?? 0) + 1;
  const cumplimiento = Math.round(((hechos?.length ?? 0) / 7) * 100);
  return { semana, cumplimiento };
}

export async function planActual(userId) {
  const { data } = await admin()
    .from('planes')
    .select('plan, semana')
    .eq('user_id', userId)
    .order('semana', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function ultimosMensajes(userId, cuantos = 10) {
  const { data } = await admin()
    .from('mensajes')
    .select('rol, texto')
    .eq('user_id', userId)
    .order('creado_en', { ascending: false })
    .limit(cuantos);
  // Vienen del más nuevo al más viejo; el modelo los necesita en orden.
  return (data ?? []).reverse();
}

export async function ultimoRegistro(userId) {
  const { data } = await admin()
    .from('registros')
    .select('fecha, completado, reto')
    .eq('user_id', userId)
    .eq('completado', true)
    .order('fecha', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}
