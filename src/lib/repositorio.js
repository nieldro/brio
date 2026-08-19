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
    zonas: perfil.zonas?.length ? perfil.zonas : [],
    habitos: perfil.habitos?.length ? perfil.habitos : [],
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
    zonas: fila.zonas ?? [],
    habitos: fila.habitos ?? [],
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

// La nube tiene un límite de paciencia. Sin esto, una red que acepta la
// conexión y luego no responde (pasa con VPN y con wifi de portería) deja la
// promesa colgada y la app entera esperando: nunca falla, nunca termina.
const LIMITE_NUBE = 6000;

const conLimite = (promesa, ms = LIMITE_NUBE) =>
  Promise.race([
    promesa,
    new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('la nube tardó')), ms)),
  ]);

export async function cargar() {
  const guardado = (await cargarEstado()) ?? {};

  if (!hayNube) return { ...guardado, userId: null, enNube: false };

  try {
    const sesion = await conLimite(sesionAnonima());
    if (!sesion) return { ...guardado, userId: null, enNube: false };

    const userId = sesion.user.id;

    // Lo guardado en disco lleva el sello de su dueño. Si el que abre la app
    // es otro (alguien entró con su cuenta en un teléfono prestado), lo del
    // anterior no se usa. Antes esto se resolvía borrando el disco al entrar,
    // que dejaba a la persona sin nada si la nube no respondía.
    const local = guardado.duenoId && guardado.duenoId !== userId ? {} : guardado;

    // Si esta se pasa de tiempo, el catch devuelve lo del disco con la
    // sesión ya resuelta. Se pierde la lectura de la nube, no la sesión.
    const lectura = await conLimite(leerNube(userId)).catch(() => ({ estado: 'fallo' }));

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

// Las tres funciones de escritura devuelven true SOLO si el servidor
// confirmó. La cola de sincronización usa ese valor para decidir si saca la
// operación o la reintenta: un `undefined` optimista perdería datos.
export async function guardarPerfil(userId, perfil) {
  if (!supabase || !userId) return false;

  const fila = aFila(perfil);

  try {
    const { error } = await supabase.from('profiles').upsert({ id: userId, ...fila });
    if (!error) return true;

    // `zona_horaria` y `zonas` solo existen si se corrieron migrations/002 y
    // 003. Sin este reintento, olvidar una migración haría perder el perfil
    // entero en silencio, que es mucho peor que quedarse sin recordatorios o
    // sin poder elegir qué parte del cuerpo trabajar.
    const { zona_horaria, zonas, habitos, ...base } = fila;
    const segundo = await supabase.from('profiles').upsert({ id: userId, ...base });
    return !segundo.error;
  } catch {
    return false;
  }
}

export async function marcarRegistro(userId, { fecha, reto, rachaActual, mejorRacha }) {
  if (!supabase || !userId) return false;
  try {
    const registro = await supabase
      .from('registros')
      .upsert({ user_id: userId, fecha, completado: true, reto }, { onConflict: 'user_id,fecha' });

    if (registro.error) return false;

    // La racha del perfil es un derivado: si falla, el registro ya quedó y
    // se recalcula al leer. No se reintenta todo por esto.
    if (rachaActual != null) {
      await supabase
        .from('profiles')
        .update({ racha_actual: rachaActual, mejor_racha: mejorRacha })
        .eq('id', userId);
    }

    return true;
  } catch {
    return false;
  }
}

export async function guardarLogro(userId, { fecha, texto }) {
  if (!supabase || !userId) return false;
  try {
    // `diario` no tiene único por (user_id, fecha): se reemplaza la línea del día.
    const borrado = await supabase.from('diario').delete().eq('user_id', userId).eq('fecha', fecha);
    if (borrado.error) return false;

    if (!texto) return true;

    const insertado = await supabase.from('diario').insert({ user_id: userId, fecha, texto });
    return !insertado.error;
  } catch {
    return false;
  }
}

// Un hábito marcado o desmarcado. La fila existe o no existe: no hay estado
// intermedio, así que desmarcar es borrar.
export async function guardarHabito(userId, { habito, fecha, hecho }) {
  if (!supabase || !userId) return false;
  try {
    if (!hecho) {
      const { error } = await supabase
        .from('habitos_hechos')
        .delete()
        .eq('user_id', userId)
        .eq('habito', habito)
        .eq('fecha', fecha);
      return !error;
    }

    const { error } = await supabase
      .from('habitos_hechos')
      .upsert({ user_id: userId, habito, fecha }, { onConflict: 'user_id,habito,fecha' });
    return !error;
  } catch {
    return false;
  }
}

// Cerrar sesión vive en lib/auth.js: es asunto de la cuenta, no del
// repositorio de datos.
