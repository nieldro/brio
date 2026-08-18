import { cargarEstado, guardarEstado } from './almacenamiento';
import { fusionar } from '../services/fusion';
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
    push_token: perfil.push_token || null,
    zona_horaria: perfil.zona_horaria || null,
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
    push_token: fila.push_token ?? null,
    zona_horaria: fila.zona_horaria ?? null,
  };
}

// --- Lectura --------------------------------------------------------------

async function leerNube(userId) {
  const [perfil, hechos, entradas, plan] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    // Los últimos 30 días alcanzan para la semana en curso y para la racha.
    supabase
      .from('registros')
      .select('fecha')
      .eq('user_id', userId)
      .eq('completado', true)
      .order('fecha', { ascending: false })
      .limit(30),
    supabase.from('diario').select('fecha, texto').eq('user_id', userId),
    supabase
      .from('planes')
      .select('plan, semana')
      .eq('user_id', userId)
      .order('semana', { ascending: false })
      .limit(1),
  ]);

  // Estos tres casos son distintos y antes se confundían en un solo `null`:
  //
  //   'fallo'      la consulta no se pudo hacer. NO se sabe nada del usuario.
  //   'sin-perfil' se preguntó bien y este usuario aún no terminó el onboarding.
  //   'ok'         hay datos.
  //
  // Confundir 'fallo' con 'sin-perfil' mandaba a alguien con cuenta a rehacer
  // el onboarding, y al terminarlo sobrescribía su perfil real en la nube.
  if (perfil.error) return { estado: 'fallo' };
  if (!perfil.data) return { estado: 'sin-perfil' };

  const fechas = (hechos.data ?? []).map((r) => r.fecha);

  return {
    estado: 'ok',
    datos: {
      onboardingListo: true,
      perfil: aPerfil(perfil.data),
      rachaActual: perfil.data.racha_actual ?? 0,
      mejorRacha: perfil.data.mejor_racha ?? 0,
      ultimoDiaCompletado: fechas[0] ?? null,
      diasCompletados: fechas,
      diario: Object.fromEntries((entradas.data ?? []).map((e) => [e.fecha, e.texto])),
      plan: plan.data?.[0]?.plan ?? null,
    },
  };
}

// Historial del chat. Vive aparte del estado global: solo lo usa esa pantalla.
export async function leerMensajes(userId, cuantos = 30) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('mensajes')
      .select('id, rol, texto')
      .eq('user_id', userId)
      .order('creado_en', { ascending: false })
      .limit(cuantos);
    if (error) return null;
    return (data ?? []).reverse();
  } catch {
    return null;
  }
}

export async function cargar() {
  const guardado = (await cargarEstado()) ?? {};

  if (!hayNube) return { ...guardado, userId: null, enNube: false };

  try {
    const sesion = await sesionAnonima();
    if (!sesion) return { ...guardado, userId: null, enNube: false };

    const userId = sesion.user.id;

    // Lo guardado en disco lleva el sello de su dueño. Si el que abre la app
    // es otro (alguien entró con su cuenta en un teléfono prestado), lo del
    // anterior no se usa. Antes esto se resolvía borrando el disco al entrar,
    // que dejaba a la persona sin nada si la nube no respondía.
    const local = guardado.duenoId && guardado.duenoId !== userId ? {} : guardado;

    const lectura = await leerNube(userId);

    // La consulta falló: se sigue con lo del disco. NO se asume que el
    // usuario no tiene perfil, porque eso lo mandaría a rehacer el onboarding.
    if (lectura.estado === 'fallo') return { ...local, userId, enNube: true };

    if (lectura.estado === 'sin-perfil') {
      return { ...local, userId, enNube: true };
    }

    return { ...fusionar(local, lectura.datos), userId, enNube: true };
  } catch {
    return { ...guardado, userId: null, enNube: false };
  }
}

// --- Escritura ------------------------------------------------------------
// Ninguna de estas funciones puede tumbar la pantalla: si la nube falla,
// el dato ya quedó en disco y se reintentará en el próximo cambio.

export const guardarLocal = guardarEstado;

export async function guardarPerfil(userId, perfil) {
  if (!supabase || !userId) return;

  const fila = aFila(perfil);

  try {
    const { error } = await supabase.from('profiles').upsert({ id: userId, ...fila });
    if (!error) return;

    // `zona_horaria` solo existe si se corrió migrations/002. Sin este
    // reintento, olvidar la migración haría perder el perfil entero en
    // silencio, que es mucho peor que quedarse sin recordatorios.
    const { zona_horaria, ...base } = fila;
    await supabase.from('profiles').upsert({ id: userId, ...base });
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

// Cerrar sesión vive en lib/auth.js: es asunto de la cuenta, no del
// repositorio de datos.
