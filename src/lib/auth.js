import { supabase, hayNube, sesionAnonima } from './supabase';
import { borrarEstado } from './almacenamiento';
import { normalizarCorreo, mensajeDeError } from '../services/credenciales';

// Todo lo que tiene que ver con la cuenta del usuario.
//
// Regla de producto: se entra SIN cuenta. La cuenta es opcional y sirve para
// no perder la racha al cambiar de teléfono. Nunca es un muro antes de empezar.
//
// Todas las funciones devuelven { ok, error } y jamás lanzan: quedarse fuera
// de la cuenta no puede tumbar la app.

const SIN_NUBE = 'La cuenta necesita conexión configurada. Por ahora sigues en este teléfono.';

export function hayCuentas() {
  return hayNube;
}

// ¿Qué es este usuario ahora mismo?
//   'invitado'  sin sesión
//   'anonimo'   sesión anónima: sus datos viven, pero no los puede recuperar
//   'concuenta' sesión con correo
export async function estadoDeSesion() {
  if (!supabase) return { tipo: 'invitado', correo: null };
  try {
    const { data } = await supabase.auth.getSession();
    const usuario = data?.session?.user;
    if (!usuario) return { tipo: 'invitado', correo: null };
    if (usuario.is_anonymous) return { tipo: 'anonimo', correo: null };
    return { tipo: 'concuenta', correo: usuario.email ?? null };
  } catch {
    return { tipo: 'invitado', correo: null };
  }
}

// Crear cuenta.
//
// Si ya hay sesión anónima, se le AGREGA correo y clave al mismo usuario:
// conserva el id, y con él la racha, el plan y el diario. Esa es la diferencia
// entre "crea una cuenta nueva" y "guarda lo que ya construiste".
export async function crearCuenta(correoCrudo, clave) {
  if (!supabase) return { ok: false, error: SIN_NUBE };

  const correo = normalizarCorreo(correoCrudo);

  try {
    const sesion = await sesionAnonima();
    const esAnonimo = sesion?.user?.is_anonymous;

    if (esAnonimo) {
      const { data, error } = await supabase.auth.updateUser({ email: correo, password: clave });
      if (error) return { ok: false, error: mensajeDeError(error) };

      // Con confirmación de correo activada, el correo no queda aplicado hasta
      // que el usuario abra el enlace. Hay que decirlo, no dejarlo en silencio.
      const confirmado = data?.user?.email === correo && !!data?.user?.email_confirmed_at;
      return {
        ok: true,
        conservoDatos: true,
        faltaConfirmar: !confirmado,
        correo,
      };
    }

    const { data, error } = await supabase.auth.signUp({ email: correo, password: clave });
    if (error) return { ok: false, error: mensajeDeError(error) };

    return {
      ok: true,
      conservoDatos: false,
      faltaConfirmar: !data?.session,
      correo,
    };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) };
  }
}

// Entrar con una cuenta que ya existe.
//
// Ojo: quien entra puede venir de una sesión anónima con datos de OTRA persona
// en este teléfono. El disco local se borra ANTES de traer los de la cuenta,
// para que no se mezclen. Quien llama debe volver a hidratar después.
export async function entrar(correoCrudo, clave) {
  if (!supabase) return { ok: false, error: SIN_NUBE };

  const correo = normalizarCorreo(correoCrudo);

  try {
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
    if (error) return { ok: false, error: mensajeDeError(error) };

    await borrarEstado();
    return { ok: true, correo };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) };
  }
}

// Cerrar sesión. Los datos NO se pierden: quedan en la nube atados a la cuenta
// y vuelven al entrar. Lo que se borra es la copia de este teléfono.
export async function salir() {
  try {
    await supabase?.auth.signOut();
  } catch {}
  await borrarEstado();
  return { ok: true };
}

// Recuperar la clave. Supabase manda un correo con un enlace.
export async function recuperarClave(correoCrudo) {
  if (!supabase) return { ok: false, error: SIN_NUBE };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizarCorreo(correoCrudo));
    if (error) return { ok: false, error: mensajeDeError(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) };
  }
}
