import { cargarEstado, guardarEstado, borrarEstado } from './almacenamiento';
import { supabase, hayNube, sesionAnonima } from './supabase';

// Único contrato de datos de la app. El estado no sabe si hay nube o no.
//
// Regla: el disco local manda para responder rápido y funcionar sin señal.
// La nube manda para el contenido que ella misma calcula (perfil, racha,
// registros). Si la nube falla o no está configurada, se sigue con lo local.

// --- Traducción entre el perfil de la app y la fila de `profiles` ---------

function aFila(perfil) {
  return {
    nombre: perfil.nombre || null,
    edad: perfil.edad ?? null,
    peso: perfil.peso ?? null,
    estatura: perfil.estatura ?? null,
    objetivo: perfil.objetivo || null,
    porque: perfil.porque || null,
    lugar: perfil.lugar || null,
    tiempo_min: perfil.tiempo_min ?? null,
    hora_recordatorio: perfil.hora_recordatorio || null,
  };
}

function aPerfil(fila) {
  return {
    nombre: fila.nombre ?? '',
    edad: fila.edad ?? null,
    peso: fila.peso ?? null,
    estatura: fila.estatura ?? null,
    objetivo: fila.objetivo ?? '',
    porque: fila.porque ?? '',
    lugar: fila.lugar ?? '',
    tiempo_min: fila.tiempo_min ?? null,
    hora_recordatorio: fila.hora_recordatorio?.slice(0, 5) ?? '',
  };
}

// --- Lectura --------------------------------------------------------------

async function leerNube(userId) {
  const [perfil, ultimo, entradas] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('registros')
      .select('fecha')
      .eq('user_id', userId)
      .eq('completado', true)
      .order('fecha', { ascending: false })
      .limit(1),
    supabase.from('diario').select('fecha, texto').eq('user_id', userId),
  ]);

  // Sin fila de perfil, el onboarding todavía no terminó en este dispositivo.
  if (perfil.error || !perfil.data) return null;

  return {
    onboardingListo: true,
    perfil: aPerfil(perfil.data),
    rachaActual: perfil.data.racha_actual ?? 0,
    mejorRacha: perfil.data.mejor_racha ?? 0,
    ultimoDiaCompletado: ultimo.data?.[0]?.fecha ?? null,
    diario: Object.fromEntries((entradas.data ?? []).map((e) => [e.fecha, e.texto])),
  };
}

export async function cargar() {
  const local = (await cargarEstado()) ?? {};

  if (!hayNube) return { ...local, userId: null, enNube: false };

  try {
    const sesion = await sesionAnonima();
    if (!sesion) return { ...local, userId: null, enNube: false };

    const userId = sesion.user.id;
    const nube = await leerNube(userId);
    if (!nube) return { ...local, userId, enNube: true };

    // La nube pisa lo local, salvo los campos que solo viven en el teléfono
    // (por ejemplo el permiso de notificaciones, que aún no tiene columna).
    return {
      ...local,
      ...nube,
      perfil: { ...(local.perfil ?? {}), ...nube.perfil },
      userId,
      enNube: true,
    };
  } catch {
    return { ...local, userId: null, enNube: false };
  }
}

// --- Escritura ------------------------------------------------------------
// Ninguna de estas funciones puede tumbar la pantalla: si la nube falla,
// el dato ya quedó en disco y se reintentará en el próximo cambio.

export const guardarLocal = guardarEstado;

export async function guardarPerfil(userId, perfil) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('profiles').upsert({ id: userId, ...aFila(perfil) });
  } catch {}
}

export async function marcarRegistro(userId, { fecha, reto, rachaActual, mejorRacha }) {
  if (!supabase || !userId) return;
  try {
    await supabase
      .from('registros')
      .upsert({ user_id: userId, fecha, completado: true, reto }, { onConflict: 'user_id,fecha' });

    await supabase
      .from('profiles')
      .update({ racha_actual: rachaActual, mejor_racha: mejorRacha })
      .eq('id', userId);
  } catch {}
}

export async function guardarLogro(userId, { fecha, texto }) {
  if (!supabase || !userId) return;
  try {
    // `diario` no tiene único por (user_id, fecha): se reemplaza la línea del día.
    await supabase.from('diario').delete().eq('user_id', userId).eq('fecha', fecha);
    if (texto) await supabase.from('diario').insert({ user_id: userId, fecha, texto });
  } catch {}
}

export async function olvidar() {
  await borrarEstado();
  try {
    await supabase?.auth.signOut();
  } catch {}
}
