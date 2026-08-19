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

export const LARGO_CODIGO = 6;

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

const GOOGLE_APAGADO = 'Entrar con Google todavía no está disponible.';

const NO_SE_PUEDE_ENLAZAR =
  'Con Google empezarías de cero y perderías tu racha. Guarda tu cuenta con correo y clave, que sí se queda con todo lo que llevas.';

// La URL de vuelta cambia según dónde corra la app, y las dos tienen que
// estar en la lista de Supabase:
//   Expo Go          exp://127.0.0.1:8081/--/auth
//   build propio     brio://auth
const uriDeVuelta = () => crearUri({ scheme: 'brio', path: 'auth' });

const proveedorApagado = (e) => /provider is not enabled|unsupported provider/i.test(e?.message ?? '');

// `linkIdentity` a veces devuelve el error y a veces lo lanza, según por dónde
// falle dentro de la librería. Las dos formas significan lo mismo aquí, así
// que se igualan: un throw suelto dejaba el botón sin respuesta.
async function enlazarConGoogle(opciones) {
  try {
    return await supabase.auth.linkIdentity({ provider: 'google', options: opciones });
  } catch (e) {
    return { data: null, error: e };
  }
}

// Entrar con Google.
//
// Abre el navegador del sistema, no una vista dentro de la app: así el usuario
// ve la barra de direcciones de Google y puede comprobar que le está dando la
// clave a Google y no a nosotros. Es la forma correcta y la que exigen las
// tiendas.
//
// `hayDatosQuePerder` lo manda la pantalla. Cambia una decisión de verdad:
// quien lleva dos semanas de racha en una sesión anónima NO puede entrar con
// Google a secas, porque eso crea un usuario nuevo y deja lo suyo huérfano.
// Ahí se ENLAZA la cuenta de Google a la sesión que ya existe, igual que hace
// crearCuenta con el correo. Si Supabase no permite enlazar, se dice y se
// ofrece el camino que sí conserva los datos, en vez de borrarlos en silencio.
export async function entrarConGoogle({ hayDatosQuePerder = false } = {}) {
  if (!supabase) return { ok: false, error: SIN_NUBE };

  try {
    const redirectTo = uriDeVuelta();
    const opciones = { redirectTo, skipBrowserRedirect: true };

    const { data: sesion } = await supabase.auth.getSession();
    const esAnonimo = !!sesion?.session?.user?.is_anonymous;

    let data = null;
    let error = null;

    // Enlazar solo tiene sentido cuando hay algo que perder. Quien acaba de
    // abrir la app no ha construido nada: pedirle a Supabase que enlace ahí
    // solo añade una llamada que puede fallar por un ajuste del panel.
    if (esAnonimo && hayDatosQuePerder) {
      ({ data, error } = await enlazarConGoogle(opciones));

      // El orden importa: "Google apagado" también contiene "not enabled", y
      // mirarlo después haría que un proveedor apagado se anunciara como un
      // problema de enlace. Primero lo específico.
      if (proveedorApagado(error)) return { ok: false, error: GOOGLE_APAGADO };

      // Sin enlace manual, entrar con Google crearía un usuario nuevo y esta
      // persona perdería su racha. Se dice y se ofrece el camino que sí la
      // conserva, en vez de borrársela en silencio.
      if (error) return { ok: false, error: NO_SE_PUEDE_ENLAZAR };
    } else {
      ({ data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: opciones }));
    }

    if (error) {
      if (proveedorApagado(error)) return { ok: false, error: GOOGLE_APAGADO };
      return { ok: false, error: mensajeDeError(error) };
    }
    if (!data?.url) return { ok: false, error: mensajeDeError('') };

    const resultado = await abrirSesionAuth(data.url, redirectTo);

    // El usuario cerró el navegador sin terminar. No es un error: no se le
    // muestra nada, simplemente sigue donde estaba.
    if (resultado.type !== 'success') return { ok: false, cancelado: true };

    return await sesionDesdeLaVuelta(resultado.url);
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) };
  }
}

// Saca la sesión de la URL con la que Google devolvió al usuario.
//
// Se aceptan las dos formas porque Supabase usa una u otra según cómo esté
// configurado el cliente, y fallar por eso daba un "algo salió mal" sin pista:
//   #access_token=...  flujo implícito, los tokens vienen en el fragmento
//   ?code=...          flujo PKCE, hay que canjear el código
async function sesionDesdeLaVuelta(url) {
  const [base, fragmento = ''] = String(url).split('#');
  const consulta = base.includes('?') ? base.slice(base.indexOf('?') + 1) : '';

  const enFragmento = new URLSearchParams(fragmento);
  const enConsulta = new URLSearchParams(consulta);

  // Google o Supabase dijeron que no. El motivo sirve más que un genérico.
  const descripcion =
    enFragmento.get('error_description') ?? enConsulta.get('error_description');
  if (descripcion) return { ok: false, error: mensajeDeError({ message: descripcion }) };

  const access_token = enFragmento.get('access_token');
  const refresh_token = enFragmento.get('refresh_token');

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    return error ? { ok: false, error: mensajeDeError(error) } : { ok: true };
  }

  const codigo = enConsulta.get('code') ?? enFragmento.get('code');
  if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    return error ? { ok: false, error: mensajeDeError(error) } : { ok: true };
  }

  return { ok: false, error: mensajeDeError('') };
}

// Confirmar el correo con el código de seis dígitos que llegó al buzón.
//
// Solo hace falta si en Supabase está encendido "Confirm email". Con esa
// opción apagada, crearCuenta ya devuelve la sesión y esto no se usa: la
// pantalla lo sabe por `faltaConfirmar`.
//
// El código y el enlace del correo son el MISMO token, así que funciona
// aunque la persona prefiera tocar el enlace.
export async function confirmarCorreo(correoCrudo, codigo) {
  if (!supabase) return { ok: false, error: SIN_NUBE };

  const limpio = String(codigo ?? '').replace(/\D/g, '');
  if (limpio.length !== LARGO_CODIGO) {
    return { ok: false, error: `El código tiene ${LARGO_CODIGO} números. Revísalo y seguimos.` };
  }

  try {
    const { error } = await supabase.auth.verifyOtp({
      email: normalizarCorreo(correoCrudo),
      token: limpio,
      type: 'email',
    });
    if (error) return { ok: false, error: mensajeDeError(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) };
  }
}

// Volver a mandar el código. Supabase limita cuántos correos salen por hora,
// así que el error de tope se traduce y no se esconde.
export async function reenviarCodigo(correoCrudo) {
  if (!supabase) return { ok: false, error: SIN_NUBE };

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizarCorreo(correoCrudo),
    });
    if (error) return { ok: false, error: mensajeDeError(error) };
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
