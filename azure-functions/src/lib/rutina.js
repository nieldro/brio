// Cómo se arma la rutina de un día. Reglas puras: se prueban sin red.
//
// Antes esto no existía y se notaba. El ejemplo del prompt traía UN ejercicio,
// así que el modelo devolvía un ejercicio por día, y "tu rutina de hoy" era
// una línea. Una rutina de verdad tiene calentamiento, trabajo y cierre.
//
// Aquí se decide qué exige cada día y qué se le puede pedir a esta persona en
// concreto. El validador lo comprueba después: el prompt pide, esto obliga.

import { listaParaElPrompt } from './catalogo.js';

export const BLOQUES = ['calentamiento', 'principal', 'cierre'];

// El tiempo que la persona dijo tener es un compromiso, no un techo lejano.
//
// Sin este piso el modelo devolvía días de 12 minutos a quien había apartado
// una hora, y eso se siente como que la app no lo tomó en serio. Un día de
// entrenamiento usa al menos la mitad de lo apartado; uno suave, un tercio.
export const PISO_POR_TIPO = { entrenamiento: 0.5, suave: 0.3, descanso: 0 };

export function duracionMinima(tiempo, tipo) {
  const disponible = Number(tiempo);
  if (!Number.isFinite(disponible) || disponible <= 0) return 0;
  return Math.round(disponible * (PISO_POR_TIPO[tipo] ?? 0));
}

// Cuántos ejercicios lleva cada tipo de día, como mínimo.
// El descanso lleva cero a propósito: descansar es parte del plan.
export const MINIMO_EJERCICIOS = { entrenamiento: 3, suave: 2, descanso: 0 };
export const MAXIMO_EJERCICIOS = 6;

// Movimientos que golpean articulaciones. La lista se usa para prohibirlos
// cuando el impacto tiene que ser bajo.
export const IMPACTO =
  /\b(salt\w*|brinc\w*|burpee\w*|correr|corriendo|carrera|trote|trotar|trotando|sprint\w*|pliom\w*|jumping|zancada\w*\s+din\w*)\b/i;

// --- Qué puede hacer esta persona -----------------------------------------

// El IMC se calcula AQUÍ y no sale nunca de aquí.
//
// La regla 1 del producto prohíbe usar el peso como métrica: no se le muestra
// a nadie, no se guarda, no entra en ningún mensaje. Se usa para una sola
// cosa, que es de seguridad y no de juicio: decidir si el plan puede llevar
// saltos. Mandar a saltar a alguien con mucho peso sobre las rodillas es una
// lesión esperando, y el documento ya lo dice: "peso muy alto, solo bajo
// impacto". Esto solo pone el número donde antes el modelo adivinaba.
export function imc({ peso, estatura }) {
  const kg = Number(peso);
  const cm = Number(estatura);
  if (!Number.isFinite(kg) || !Number.isFinite(cm) || kg <= 0 || cm <= 0) return null;

  const m = cm > 3 ? cm / 100 : cm; // por si llega en metros
  return kg / (m * m);
}

// 'bajo' | 'normal'. Ante la duda, siempre 'bajo': equivocarse hacia lo suave
// cuesta una semana aburrida; equivocarse hacia lo fuerte cuesta una lesión.
export function nivelDeImpacto({ edad, peso, estatura } = {}) {
  const años = Number(edad);
  if (Number.isFinite(años) && años >= 55) return 'bajo';

  const indice = imc({ peso, estatura });
  if (indice != null) return indice >= 30 ? 'bajo' : 'normal';

  // Sin estatura no hay índice, pero el peso solo ya avisa.
  const kg = Number(peso);
  if (Number.isFinite(kg) && kg >= 100) return 'bajo';

  // Sin datos suficientes no se asume que puede saltar.
  if (!Number.isFinite(años) && !Number.isFinite(kg)) return 'bajo';

  return 'normal';
}

// --- Qué busca esta persona -----------------------------------------------

const ENFOQUES = {
  'perder peso':
    'Prioriza movimiento continuo y constancia. El bloque principal lleva ejercicios que suban el pulso sin ahogar, y siempre uno de fuerza para cuidar el músculo.',
  'ganar músculo':
    'Prioriza fuerza. El bloque principal lleva dos o tres ejercicios de fuerza con series y repeticiones, y nunca dos días seguidos del mismo grupo muscular.',
  'sentirme mejor':
    'Prioriza movimiento variado y agradable. Mezcla algo de fuerza suave, algo de movilidad y algo que se disfrute.',
  'crear el hábito':
    'Prioriza que sea fácil de cumplir. Pocos ejercicios, muy claros, y que el día se pueda terminar aunque haya sido un mal día.',
};

// Las opciones del onboarding son cuatro y son estas. Si llega otra cosa,
// se cae en la más suave en vez de dejar al modelo sin instrucción.
export function enfoqueDe(objetivo) {
  const clave = String(objetivo ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  if (clave.includes('perder') || clave.includes('bajar')) return ENFOQUES['perder peso'];
  if (clave.includes('musculo') || clave.includes('ganar')) return ENFOQUES['ganar músculo'];
  if (clave.includes('mejor')) return ENFOQUES['sentirme mejor'];
  return ENFOQUES['crear el hábito'];
}

// --- El bloque que se le pega al prompt -----------------------------------

export function instruccionesDeRutina({ objetivo, tiempo, impacto, lugar }) {
  const sinImpacto =
    impacto === 'bajo'
      ? `
## Nivel de impacto: BAJO (obligatorio)
Esta persona entrena sin impacto. Está PROHIBIDO cualquier ejercicio con
salto, brinco, burpee, carrera, trote o sprint, en cualquier día y en
cualquier variante. Usa caminata, escaleras, pasos laterales, sentadilla a
la silla, bicicleta o máquina de cardio.
No expliques por qué. No menciones el peso, la edad ni el cuerpo.`
      : '';

  return `
## Cómo se arma cada día
Un día de entrenamiento NO es un solo ejercicio. Lleva de 3 a 5, repartidos
en bloques y en este orden:
- calentamiento: 1 ejercicio para entrar en calor.
- principal: 2 o 3 ejercicios, el trabajo del día.
- cierre: 1 ejercicio para bajar el ritmo o estirar.

Un día suave lleva 2 o 3 ejercicios, de bloque principal o cierre.
Un día de descanso lleva la lista de ejercicios vacía.

Cada ejercicio lleva su "detalle" con series y repeticiones o con minutos,
en palabras simples.

## El tiempo es un compromiso, no un techo
Esta persona apartó ${tiempo} minutos al día. Úsalos.
- Un día de entrenamiento dura entre ${duracionMinima(tiempo, 'entrenamiento')} y ${tiempo} minutos.
- Un día suave dura entre ${duracionMinima(tiempo, 'suave')} y ${tiempo} minutos.
- Con ${tiempo} minutos disponibles, un día de 10 minutos es una falta de respeto
  a quien aparto ese rato. Si el dia debe ser facil, hazlo con movimientos
  suaves y mas descanso entre series, NO recortando la duracion.
- La suma de lo que pidas en los ejercicios tiene que dar la duracion del dia.

## Enfoque de esta persona
${enfoqueDe(objetivo)}${sinImpacto}
${listaParaElPrompt(lugar)}`;
}
