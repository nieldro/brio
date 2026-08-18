import { makeRedirectUri } from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';

import { supabase, hayNube, sesionAnonima } from './supabase';
import { borrarEstado } from './almacenamiento';
import { normalizarCorreo, mensajeDeError } from '../services/credenciales';

const crearUri = makeRedirectUri;
const abrirSesionAuth = openAuthSessionAsync;

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
// NO se borra el disco aquí. Quien entra puede venir de una sesión anónima con
// datos de otra persona en este teléfono, pero eso se resuelve con el sello de
// dueño: lo guardado lleva el `duenoId`, y al cargar se descarta si no
// coincide con la sesión. Borrar por adelantado dejaba a la persona sin nada
// si la nube no respondía después.
export async function entrar(correoCrudo, clave) {
  if (!supabase) return { ok: false, error: SIN_NUBE };

  const correo = normalizarCorreo(correoCrudo);

  try {
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
    if (error) return { ok: false, error: mensajeDeError(error) };
    return { ok: true, correo };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) };
  }
}

// Cerrar sesión. Los datos NO se pierden: quedan en la nube atados a la cuenta
// y vuelven al entrar. Lo que se borra es la copia de este teléfono.
export async function salir() {
  try {
    // Soltar el push token ANTES de salir. Sin esto, el Timer Trigger seguía
    // mandando los recordatorios del usuario anterior a este teléfono, con su
    // nombre dentro: "Daniel, hoy toca caminar" en el celular de otra persona.
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    if (userId) {
      await supabase.from('profiles').update({ push_token: null }).eq('id', userId);
    }
  } catch {}

  try {
    await supabase?.auth.signOut();
  } catch {}

  await borrarEstado();
  return { ok: true };
}

// Entrar con Google.
//
// Abre el navegador del sistema, no una vista dentro de la app: así el usuario
// ve la barra de direcciones de Google y puede comprobar que le está dando la
// clave a Google y no a nosotros. Es la forma correcta y la que exigen las
// tiendas.
//
// Requiere que Google esté habilitado en Supabase (Authentication > Providers).
// Si no lo está, se dice claro en vez de dejar una pantalla en blanco.
export async function entrarConGoogle() {
  if (!supabase) return { ok: false, error: SIN_NUBE };

  try {
    const redirectTo = crearUri({ scheme: 'brio', path: 'auth' });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error) {
      if (/provider is not enabled|unsupported provider/i.test(error.message ?? '')) {
        return { ok: false, error: 'Entrar con Google todavía no está disponible.' };
      }
      return { ok: false, error: mensajeDeError(error) };
    }
    if (!data?.url) return { ok: false, error: mensajeDeError('') };

    const resultado = await abrirSesionAuth(data.url, redirectTo);

    // El usuario cerró el navegador sin terminar. No es un error: no se le
    // muestra nada, simplemente sigue donde estaba.
    if (resultado.type !== 'success') return { ok: false, cancelado: true };

    // Supabase devuelve los tokens en el fragmento de la URL (#access_token=...)
    const fragmento = resultado.url.split('#')[1] ?? '';
    const params = new URLSearchParams(fragmento);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (!access_token || !refresh_token) return { ok: false, error: mensajeDeError('') };

    const { error: errorSesion } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (errorSesion) return { ok: false, error: mensajeDeError(errorSesion) };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) };
  }
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
