// Reglas de racha. Funciones puras: no tocan pantalla ni base de datos.
// En la fase 4 este mismo archivo alimenta a Supabase sin cambiar su firma.
//
// El estado guarda la FECHA del último día marcado, no un booleano. Así la
// racha sigue siendo correcta cuando el usuario cierra la app y vuelve mañana.

import { claveDia, claveAyer } from './fecha';

// ¿Ya marcó hoy?
export function estaCompletado(estado, hoy = new Date()) {
  return estado.ultimoDiaCompletado === claveDia(hoy);
}

// Racha que se puede mostrar. Si pasó más de un día sin marcar, está en cero.
// Se informa, nunca se castiga: el número baja, el tono no.
export function rachaVigente(estado, hoy = new Date()) {
  const ultimo = estado.ultimoDiaCompletado;
  if (!ultimo) return 0;
  if (ultimo === claveDia(hoy) || ultimo === claveAyer(hoy)) return estado.rachaActual;
  return 0;
}

// ¿Venía de una racha y se cortó? Dispara la frase de "ayer no se pudo".
export function rachaRota(estado, hoy = new Date()) {
  return estado.rachaActual > 0 && rachaVigente(estado, hoy) === 0;
}

// Marca el día y devuelve el nuevo estado.
// Idempotente: marcar dos veces el mismo día no infla la racha.
export function completarDia(estado, hoy = new Date()) {
  const clave = claveDia(hoy);
  if (estado.ultimoDiaCompletado === clave) return estado;

  const encadena = estado.ultimoDiaCompletado === claveAyer(hoy);
  const racha = encadena ? estado.rachaActual + 1 : 1;

  return {
    ...estado,
    ultimoDiaCompletado: clave,
    rachaActual: racha,
    mejorRacha: Math.max(racha, estado.mejorRacha),
  };
}

// Texto del botón una vez hecho. La racha se nombra siempre en positivo.
export function textoHecho(racha) {
  if (racha <= 1) return 'Hecho. Arrancaste.';
  return `Hecho. ${racha} días seguidos`;
}

// Frase de la pantalla de celebración. Celebra lo pequeño, de inmediato.
export function subCelebracion(racha) {
  if (racha <= 1) return 'Arrancaste. Eso ya es algo.';
  if (racha < 7) return `${racha} días seguidos. Así se construye.`;
  return `${racha} días seguidos. Esto ya es tuyo.`;
}

// Frase corta de Brío bajo el saludo. Máximo 2 frases, cero culpa.
export function fraseDelDia({ completadoHoy, racha, rota }) {
  if (completadoHoy) {
    return racha <= 1
      ? 'Ya diste el primer paso. Con eso basta.'
      : 'Otro día sumado. Así se construye.';
  }
  if (rota) return 'Ayer no se pudo. Normal. Hoy arrancamos suave.';
  if (racha === 0) return 'Hoy arrancamos suave. Sin prisa.';
  return 'Tu reto de hoy es corto. Vamos por él.';
}
