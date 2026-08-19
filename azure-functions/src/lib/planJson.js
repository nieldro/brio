// Extracción y validación del JSON del plan. Funciones puras: se prueban solas.
//
// El modelo a veces envuelve el JSON en ```json ... ``` aunque se le pida que no.
// Y a veces rompe una regla del producto. Aquí se atrapan las dos cosas antes
// de que un plan malo llegue al usuario.

import {
  MINIMO_EJERCICIOS,
  MAXIMO_EJERCICIOS,
  BLOQUES,
  IMPACTO,
  duracionMinima,
} from './rutina.js';

export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const TIPOS = ['entrenamiento', 'descanso', 'suave'];

// Los modelos escriben "miercoles" y "sabado" sin tilde la mitad de las veces,
// y el plan entero se rechazaba por eso. Era un plan perfecto muriendo por dos
// acentos: se comparan sin tildes y se devuelve la forma buena.
//
// Exigirle ortografía a un modelo es pelear una batalla que no hace falta.
const sinTildes = (t) =>
  String(t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

const CANONICO = new Map(DIAS.map((d) => [sinTildes(d), d]));

export const diaCanonico = (valor) => CANONICO.get(sinTildes(valor)) ?? null;

// Lo mismo con el resto de los valores cerrados: "Entrenamiento" y
// "entrenamiento" son el mismo día, y rechazar por una mayúscula cuesta un
// reintento entero de treinta segundos.
const enLista = (lista, valor) => {
  const limpio = sinTildes(valor);
  return lista.find((v) => sinTildes(v) === limpio) ?? null;
};

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

export function validarPlan(plan, { tiempoMax, impacto = 'normal' }) {
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

    const nombre = diaCanonico(dia?.dia);
    if (!nombre) errores.push(`${donde}: nombre de día inválido`);
    if (nombre && vistos.has(nombre)) errores.push(`${donde}: día repetido`);
    if (nombre) vistos.add(nombre);

    const tipo = enLista(TIPOS, dia?.tipo);
    if (!tipo) errores.push(`${donde}: tipo inválido`);
    if (tipo === 'descanso' || tipo === 'suave') suaves += 1;

    if (!dia?.reto?.trim?.()) errores.push(`${donde}: falta reto`);
    if (!dia?.mensaje?.trim?.()) errores.push(`${donde}: falta mensaje`);
    if (!dia?.comida_tip?.trim?.()) errores.push(`${donde}: falta comida_tip`);

    const duracion = dia?.duracion_min;
    const piso = duracionMinima(tiempoMax, tipo);

    if (!Number.isFinite(duracion) || duracion < 0) {
      errores.push(`${donde}: duracion_min inválida`);
    } else if (duracion > tiempoMax) {
      errores.push(`${donde}: ${duracion} min supera los ${tiempoMax} min del usuario`);
    } else if (duracion < piso) {
      // El otro lado del mismo trato. Devolver 12 minutos a quien aparto una
      // hora se siente como que la app no lo tomo en serio.
      errores.push(
        `${donde}: ${duracion} min se queda corto, un día ${tipo} necesita al menos ${piso} de los ${tiempoMax} min que apartó`,
      );
    }

    // Una rutina no es un ejercicio suelto.
    //
    // Esta comprobación existe porque el ejemplo del prompt traía uno solo y
    // el modelo copiaba el ejemplo: "tu rutina de hoy" salía siendo una línea.
    // Pedirlo en el prompt no bastaba; aquí no pasa.
    if (!Array.isArray(dia?.ejercicios)) {
      errores.push(`${donde}: ejercicios debe ser una lista`);
    } else {
      const minimo = MINIMO_EJERCICIOS[tipo] ?? 0;

      if (dia.ejercicios.length < minimo) {
        errores.push(
          `${donde}: un día ${tipo} necesita al menos ${minimo} ejercicios y trae ${dia.ejercicios.length}`,
        );
      }
      if (dia.ejercicios.length > MAXIMO_EJERCICIOS) {
        errores.push(`${donde}: ${dia.ejercicios.length} ejercicios no caben en un día`);
      }

      dia.ejercicios.forEach((e, n) => {
        if (!e?.nombre?.trim?.()) errores.push(`${donde}: al ejercicio ${n + 1} le falta nombre`);
        if (!e?.detalle?.trim?.()) errores.push(`${donde}: a "${e?.nombre}" le falta el detalle`);
        if (e?.bloque != null && !enLista(BLOQUES, e.bloque)) {
          errores.push(`${donde}: bloque inválido en "${e?.nombre}"`);
        }
      });
    }

    // Impacto bajo es una regla de seguridad, no una preferencia: mandar a
    // saltar a quien no debe saltar es una lesión, y el modelo se olvida.
    if (impacto === 'bajo') {
      const textos = [
        dia?.reto,
        ...(Array.isArray(dia?.ejercicios) ? dia.ejercicios : []).flatMap((e) => [
          e?.nombre,
          e?.detalle,
        ]),
      ].filter((t) => typeof t === 'string');

      for (const t of textos) {
        if (IMPACTO.test(t)) {
          errores.push(`${donde}: "${t}" tiene impacto y esta persona entrena sin impacto`);
        }
      }
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
//
// El bloque tampoco es obligatorio: si el modelo no lo manda se deduce del
// orden, en vez de rechazar un plan que por lo demás está bien. Rechazar sale
// caro (un reintento entero) y aquí no hay nada que adivinar mal.
function normalizar(plan) {
  return {
    ...plan,
    dias: plan.dias.map((d) => {
      const tipo = enLista(TIPOS, d.tipo);
      return {
        ...d,
        // El día sale SIEMPRE con su tilde, venga como venga: la app busca
        // "miércoles" para saber qué toca hoy, y "miercoles" no es lo mismo.
        dia: diaCanonico(d.dia) ?? d.dia,
        tipo,
        // Un día de descanso con ejercicios se contradice con lo que dice la
        // pantalla. Se le quitan en vez de tumbar el plan por eso.
        ejercicios: tipo === 'descanso' ? [] : conBloques(d.ejercicios ?? []),
        comida_color: enLista(['verde', 'ambar', 'rojo'], d.comida_color) ?? 'verde',
      };
    }),
  };
}

function conBloques(ejercicios) {
  return ejercicios.map((e, i) => ({
    ...e,
    bloque: enLista(BLOQUES, e?.bloque) ?? deducirBloque(i, ejercicios.length),
  }));
}

const deducirBloque = (i, total) => {
  if (total < 3) return 'principal';
  if (i === 0) return 'calentamiento';
  if (i === total - 1) return 'cierre';
  return 'principal';
};
