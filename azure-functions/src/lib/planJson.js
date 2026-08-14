// Extracción y validación del JSON del plan. Funciones puras: se prueban solas.
//
// El modelo a veces envuelve el JSON en ```json ... ``` aunque se le pida que no.
// Y a veces rompe una regla del producto. Aquí se atrapan las dos cosas antes
// de que un plan malo llegue al usuario.

export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const TIPOS = ['entrenamiento', 'descanso', 'suave'];

const PROHIBIDAS = [
  'fracaso',
  'excusas',
  'deberías',
  'quemar grasa',
  'cuerpo ideal',
  'sin dolor no hay resultado',
];

// Reglas duras de alimentación: nunca calorías, macros ni cantidades exactas.
const MEDIDAS = /calor[íi]as?|macros?|\bkcal\b|\bgramos?\b|\bml\b|ayuno/i;

export function extraerJson(texto) {
  if (typeof texto !== 'string') return null;

  // Quita las comillas de markdown si el modelo las puso.
  let limpio = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

  // Se queda con el primer objeto completo, por si sobró texto alrededor.
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio === -1 || fin === -1 || fin <= inicio) return null;
  limpio = limpio.slice(inicio, fin + 1);

  try {
    return JSON.parse(limpio);
  } catch {
    return null;
  }
}

export function validarPlan(plan, { tiempoMax }) {
  const errores = [];

  if (!plan || typeof plan !== 'object') {
    return { ok: false, errores: ['el plan no es un objeto'], plan: null };
  }

  if (typeof plan.mensaje_semana !== 'string' || !plan.mensaje_semana.trim()) {
    errores.push('falta mensaje_semana');
  }

  if (!Array.isArray(plan.dias) || plan.dias.length !== 7) {
    errores.push(`se esperaban 7 días y llegaron ${plan?.dias?.length ?? 0}`);
    return { ok: false, errores, plan: null };
  }

  const vistos = new Set();
  let suaves = 0;

  plan.dias.forEach((dia, i) => {
    const donde = dia?.dia ?? `día ${i + 1}`;

    if (!DIAS.includes(dia?.dia)) errores.push(`${donde}: nombre de día inválido`);
    if (vistos.has(dia?.dia)) errores.push(`${donde}: día repetido`);
    vistos.add(dia?.dia);

    if (!TIPOS.includes(dia?.tipo)) errores.push(`${donde}: tipo inválido`);
    if (dia?.tipo === 'descanso' || dia?.tipo === 'suave') suaves += 1;

    if (!dia?.reto?.trim?.()) errores.push(`${donde}: falta reto`);
    if (!dia?.mensaje?.trim?.()) errores.push(`${donde}: falta mensaje`);
    if (!dia?.comida_tip?.trim?.()) errores.push(`${donde}: falta comida_tip`);

    const duracion = dia?.duracion_min;
    if (!Number.isFinite(duracion) || duracion < 0) {
      errores.push(`${donde}: duracion_min inválida`);
    } else if (duracion > tiempoMax) {
      errores.push(`${donde}: ${duracion} min supera los ${tiempoMax} min del usuario`);
    }

    if (!Array.isArray(dia?.ejercicios)) {
      errores.push(`${donde}: ejercicios debe ser una lista`);
    } else if (dia.tipo !== 'descanso' && dia.ejercicios.length === 0) {
      errores.push(`${donde}: un día que no es descanso necesita ejercicios`);
    }

    if (typeof dia?.comida_tip === 'string' && MEDIDAS.test(dia.comida_tip)) {
      errores.push(`${donde}: el tip habla de calorías, cantidades o ayuno`);
    }

    // La voz de Brío también se valida, no solo la estructura.
    const textos = [dia?.reto, dia?.mensaje, dia?.comida_tip].filter(
      (t) => typeof t === 'string',
    );
    for (const t of textos) {
      for (const mala of PROHIBIDAS) {
        if (t.toLowerCase().includes(mala)) errores.push(`${donde}: usa "${mala}"`);
      }
    }
  });

  if (suaves < 2) errores.push('se necesitan mínimo 2 días de descanso o suaves');

  if (errores.length) return { ok: false, errores, plan: null };

  return { ok: true, errores: [], plan: normalizar(plan) };
}

// El formato de salida del documento no incluye el color del semáforo,
// pero la pantalla Hoy lo pinta. Se asume verde salvo que el modelo lo mande.
function normalizar(plan) {
  return {
    ...plan,
    dias: plan.dias.map((d) => ({
      ...d,
      ejercicios: d.ejercicios ?? [],
      comida_color: ['verde', 'ambar', 'rojo'].includes(d.comida_color) ? d.comida_color : 'verde',
    })),
  };
}
