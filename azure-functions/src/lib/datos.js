import { admin } from './supabase.js';
import { restarDias } from './fechas.js';

// Lecturas de Supabase que comparten las funciones. Todas filtran por el
// user_id que salió del token: la service role key salta RLS, así que el
// filtro explícito es la única barrera. Nunca quitarlo.

export async function leerPerfil(userId) {
  const { data } = await admin().from('profiles').select('*').eq('id', userId).maybeSingle();
  return data ?? null;
}

// Lee todas las filas, no las primeras mil.
//
// Supabase corta en mil sin avisar, y un tope silencioso se lee igual que un
// resultado completo. Recibe una función que arma la consulta de cero cada
// vez, porque una consulta de Supabase ya usada no se puede volver a correr.
async function todas(armar, tam = 1000) {
  const filas = [];

  for (let desde = 0; ; desde += tam) {
    const { data, error } = await armar().range(desde, desde + tam - 1);
    if (error) throw new Error(error.message);

    filas.push(...(data ?? []));
    if ((data?.length ?? 0) < tam) return filas;
  }
}

// Quién entra en la tanda del lunes: tiene plan y se movió hace poco.
//
// Se empieza por quién se movió y no por quién tiene plan. Así la lista la
// marca la gente que está usando la app, no la que se registró alguna vez.
export async function usuariosParaLaTanda(desde) {
  const registros = await todas(() =>
    admin().from('registros').select('user_id, fecha').eq('completado', true).gte('fecha', desde),
  );

  const movimiento = new Map();
  for (const r of registros) {
    const previo = movimiento.get(r.user_id);
    if (!previo || r.fecha > previo) movimiento.set(r.user_id, r.fecha);
  }

  if (!movimiento.size) return [];

  const activos = [...movimiento.keys()];
  const planes = await todas(() =>
    admin().from('planes').select('user_id, creado_en').in('user_id', activos),
  );

  const ultimoPlan = new Map();
  for (const p of planes) {
    const previo = ultimoPlan.get(p.user_id);
    if (!previo || String(p.creado_en) > previo) ultimoPlan.set(p.user_id, String(p.creado_en));
  }

  // Solo quien ya tiene al menos un plan: los demás lo reciben al terminar
  // el onboarding, no aquí.
  return [...ultimoPlan.entries()].map(([userId, planDesde]) => ({
    userId,
    planDesde,
    ultimoMovimiento: movimiento.get(userId) ?? null,
  }));
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
