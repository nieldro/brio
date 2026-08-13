// Reglas de racha. Funciones puras: no tocan pantalla ni base de datos.
// En la fase 4 este mismo archivo alimenta a Supabase sin cambiar su firma.

// Marca el día como completado y devuelve el nuevo estado.
// Idempotente: marcar dos veces el mismo día no infla la racha.
export function completarDia(estado) {
  if (estado.completadoHoy) return estado;

  const racha = estado.rachaActual + 1;
  return {
    ...estado,
    completadoHoy: true,
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
export function fraseDelDia({ completadoHoy, rachaActual }) {
  if (completadoHoy) {
    return rachaActual <= 1
      ? 'Ya diste el primer paso. Con eso basta.'
      : 'Otro día sumado. Así se construye.';
  }
  if (rachaActual === 0) return 'Hoy arrancamos suave. Sin prisa.';
  return 'Tu reto de hoy es corto. Vamos por él.';
}
