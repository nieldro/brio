// Cómo se juntan los datos del teléfono con los de la nube. Puro y probado.
//
// La regla que manda: NUNCA perder algo que el usuario escribió.
//
// Antes se hacía `{ ...local, ...nube }`, y eso borraba en silencio:
// una lectura de la nube con racha 0 y diario vacío pisaba lo que la persona
// había marcado sin señal, y el efecto de guardado lo volvía permanente.
// Para alguien que lleva 12 días de racha, ver un 0 es motivo de abandonar.

// La fecha mayor entre dos claves 'YYYY-MM-DD'. Ordenan bien como texto.
function masReciente(a, b) {
  if (!a) return b ?? null;
  if (!b) return a;
  return a > b ? a : b;
}

export function fusionarDiario(local = {}, nube = {}) {
  const salida = { ...local };

  for (const [fecha, texto] of Object.entries(nube)) {
    // Una entrada vacía en la nube no borra una escrita en el teléfono.
    if (texto?.trim()) salida[fecha] = texto;
    else if (!salida[fecha]) salida[fecha] = texto;
  }

  return salida;
}

export function fusionarDias(local = [], nube = []) {
  return [...new Set([...nube, ...local])].sort().reverse();
}

// Los hábitos elegidos. Se juntan sin repetir y se respeta el tope de tres.
//
// El orden pone primero lo del teléfono porque es lo último que la persona
// tocó: si eligió uno nuevo sin señal y la nube todavía trae los viejos, el
// suyo no se cae por el tope.
export function fusionarHabitos(local = [], nube = [], tope = 3) {
  return [...new Set([...(local ?? []), ...(nube ?? [])])].slice(0, tope);
}

// Los días de cada hábito. Unión por hábito, igual que los días marcados.
//
// Sin esto, `{ ...local, ...nube }` borraba de un plumazo lo marcado sin
// señal: la nube trae la lista completa de un hábito y reemplaza la del
// teléfono, incluidos los días que todavía no habían subido.
export function fusionarHabitosHechos(local = {}, nube = {}) {
  const salida = {};

  for (const clave of new Set([...Object.keys(local ?? {}), ...Object.keys(nube ?? {})])) {
    salida[clave] = [...new Set([...(nube?.[clave] ?? []), ...(local?.[clave] ?? [])])]
      .sort()
      .reverse();
  }

  return salida;
}

// Junta el estado guardado en disco con el que vino de la nube.
// `nube` puede ser null: significa que no había nada que traer.
export function fusionar(local = {}, nube = null) {
  if (!nube) return { ...local };

  const dias = fusionarDias(local.diasCompletados, nube.diasCompletados);

  return {
    ...local,
    ...nube,

    // El perfil de la nube manda, pero sin borrar lo que solo vive en el
    // teléfono (el permiso de notificaciones no tiene columna todavía).
    perfil: { ...(local.perfil ?? {}), ...(nube.perfil ?? {}) },

    // Si la nube aún no tiene plan, se conserva el del disco.
    plan: nube.plan ?? local.plan ?? null,

    // La racha nunca baja por una lectura: se queda la mayor de las dos.
    rachaActual: Math.max(local.rachaActual ?? 0, nube.rachaActual ?? 0),
    mejorRacha: Math.max(local.mejorRacha ?? 0, nube.mejorRacha ?? 0),
    ultimoDiaCompletado: masReciente(local.ultimoDiaCompletado, nube.ultimoDiaCompletado),

    diasCompletados: dias,
    diario: fusionarDiario(local.diario, nube.diario),

    habitos: fusionarHabitos(local.habitos, nube.habitos),
    habitosHechos: fusionarHabitosHechos(local.habitosHechos, nube.habitosHechos),
  };
}
