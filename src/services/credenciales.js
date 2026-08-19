// Validación de correo y clave. Pura, sin red: se prueba sola.
//
// La voz de Brío también manda aquí. Un formulario que regaña es lo primero
// que hace sentir tonto a alguien que ya se critica duro. Los mensajes dicen
// qué falta, nunca qué hizo mal.

export const LARGO_MINIMO_CLAVE = 8;

// No se valida el correo con una expresión perfecta a propósito: rechazar un
// correo válido y raro es peor que dejar pasar uno inválido, que el servidor
// va a rechazar de todos modos.
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function correoValido(texto) {
  return CORREO.test((texto ?? '').trim());
}

export function normalizarCorreo(texto) {
  return (texto ?? '').trim().toLowerCase();
}

// Devuelve null si está bien, o el texto que se le muestra al usuario.
export function revisarCorreo(texto) {
  const limpio = (texto ?? '').trim();
  if (!limpio) return 'Escribe tu correo para seguir.';
  if (!correoValido(limpio)) return 'Ese correo no se ve completo. Revísalo y seguimos.';
  return null;
}

export function revisarClave(clave) {
  const valor = clave ?? '';
  if (!valor) return 'Escribe una clave para seguir.';
  if (valor.length < LARGO_MINIMO_CLAVE) {
    return `Con ${LARGO_MINIMO_CLAVE} caracteres o más queda segura.`;
  }
  return null;
}

// Solo al crear cuenta: confirmar evita quedar fuera por un dedazo.
export function revisarConfirmacion(clave, confirmacion) {
  if (!confirmacion) return 'Repite la clave para confirmar.';
  if (clave !== confirmacion) return 'Las dos claves no son iguales todavía.';
  return null;
}

export function listoParaEntrar({ correo, clave }) {
  return !revisarCorreo(correo) && !revisarClave(clave);
}

export function listoParaCrear({ correo, clave, confirmacion }) {
  return (
    !revisarCorreo(correo) &&
    !revisarClave(clave) &&
    !revisarConfirmacion(clave, confirmacion)
  );
}

// --- Traducción de los errores de Supabase --------------------------------
//
// Vienen en inglés y secos ("Invalid login credentials"). Aquí se convierten
// en algo que un humano puede leer sin sentirse acusado.

const TRADUCCIONES = [
  {
    busca: /invalid login credentials|invalid credentials/i,
    dice: 'Ese correo y esa clave no coinciden. Revisa y probamos otra vez.',
  },
  {
    busca: /user already registered|already been registered|email address is already/i,
    dice: 'Ese correo ya tiene cuenta. Entra con tu clave o recupérala.',
  },
  {
    busca: /email not confirmed/i,
    dice: 'Falta confirmar tu correo. Busca el mensaje que te enviamos.',
  },
  {
    busca: /password should be at least|weak password/i,
    dice: `Con ${LARGO_MINIMO_CLAVE} caracteres o más queda segura.`,
  },
  {
    busca: /rate limit|too many requests|over_email_send_rate_limit/i,
    dice: 'Se enviaron muchos correos seguidos. Espera unos minutos y te mando otro.',
  },
  {
    busca: /token has expired|otp_expired|expired/i,
    dice: 'Ese código ya venció. Pide uno nuevo y seguimos.',
  },
  {
    busca: /invalid token|token not found|otp_disabled/i,
    dice: 'Ese código no es. Revisa el correo y escríbelo otra vez.',
  },
  {
    busca: /network|fetch failed|timeout|failed to fetch/i,
    dice: 'No pude conectarme. Revisa tu internet y lo intentamos de nuevo.',
  },
  {
    busca: /unable to validate email|invalid email/i,
    dice: 'Ese correo no se ve completo. Revísalo y seguimos.',
  },
];

export function mensajeDeError(error) {
  const texto = typeof error === 'string' ? error : (error?.message ?? '');
  const encontrada = TRADUCCIONES.find((t) => t.busca.test(texto));
  if (encontrada) return encontrada.dice;
  // Nunca se muestra el error crudo: no ayuda y asusta.
  return 'Algo no salió. Probemos de nuevo en un momento.';
}
