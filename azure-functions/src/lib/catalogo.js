// Los ejercicios que Brío sabe enseñar.
//
// Esto es lo que hace que la app enseñe de verdad. Cada nombre de esta lista
// tiene en la app una guía escrita a mano y una figura animada. Si el modelo
// inventa "burpee modificado con giro", la persona abre la guía y recibe el
// consejo genérico con un monigote que no es el suyo.
//
// La lista va DENTRO del prompt y el modelo tiene prohibido salirse de ella.
// Una prueba de la app comprueba que cada nombre de aquí encuentra su guía:
// si alguien agrega uno sin guía, salta antes de llegar al teléfono.
//
// Ninguno lleva salto ni carrera, así que el catálogo entero sirve también
// para quien entrena sin impacto.

export const CATALOGO = {
  casa: {
    calentamiento: ['Movilidad articular', 'Marcha en el sitio', 'Pasos laterales'],
    // Sube el pulso sin ahogar. El grueso para quien quiere perder peso.
    cardio: ['Caminata', 'Subir escaleras', 'Bailar', 'Marcha en el sitio'],
    // Empuje, tirón, pierna y centro: con esto se arma cualquier día de fuerza.
    fuerza: [
      'Sentadilla a la silla',
      'Zancada',
      'Sentadilla búlgara',
      'Puente de glúteos',
      'Elevación de talones',
      'Peso muerto',
      'Flexiones en la pared',
      'Flexiones en el suelo',
      'Fondo de tríceps',
      'Curl de bíceps',
      'Elevaciones laterales',
      'Plancha apoyada',
      'Abdominal corto',
      'Superman',
    ],
    cierre: ['Estiramiento', 'Respiración'],
  },

  gym: {
    calentamiento: ['Movilidad articular', 'Máquina de cardio'],
    cardio: ['Máquina de cardio', 'Caminata'],
    fuerza: [
      'Prensa de piernas',
      'Extensión de piernas',
      'Curl femoral',
      'Press de pecho',
      'Press de hombro',
      'Remo en máquina',
      'Jalón al pecho',
      'Polea de tríceps',
      'Curl de bíceps',
      'Trabajo con mancuernas',
      'Plancha apoyada',
      'Abdominal corto',
    ],
    cierre: ['Estiramiento', 'Respiración'],
  },
};

// Quien entrena "Mezclado" tiene las dos puertas abiertas.
function unir(...listas) {
  return [...new Set(listas.flat())];
}

export function ejerciciosDe(lugar) {
  const donde = String(lugar ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  if (donde.includes('gym') || donde.includes('gimnasio')) return CATALOGO.gym;
  if (donde.includes('mezcl')) {
    return {
      calentamiento: unir(CATALOGO.casa.calentamiento, CATALOGO.gym.calentamiento),
      cardio: unir(CATALOGO.casa.cardio, CATALOGO.gym.cardio),
      fuerza: unir(CATALOGO.casa.fuerza, CATALOGO.gym.fuerza),
      cierre: unir(CATALOGO.casa.cierre, CATALOGO.gym.cierre),
    };
  }
  return CATALOGO.casa;
}

// Todos los nombres, sin repetir. Lo usa la prueba que comprueba que cada uno
// tiene guía en la app.
export function todosLosNombres() {
  return unir(
    ...Object.values(CATALOGO).flatMap((lugar) => Object.values(lugar)),
  ).sort();
}

// El bloque que se le pega al prompt.
export function listaParaElPrompt(lugar) {
  const e = ejerciciosDe(lugar);
  const linea = (titulo, lista) => `- ${titulo}: ${lista.join(', ')}`;

  return `
## Ejercicios que puedes usar (lista cerrada)
Usa SOLO estos nombres, escritos exactamente así. Cada uno tiene en la app su
guía y su animación; cualquier otro nombre deja a la persona sin las dos.

${linea('para calentar', e.calentamiento)}
${linea('para subir el pulso', e.cardio)}
${linea('para fuerza', e.fuerza)}
${linea('para cerrar', e.cierre)}

Puedes repetir un ejercicio en días distintos y cambiarle las series, las
repeticiones o los minutos en el "detalle". Lo que no puedes es inventar un
nombre que no esté aquí.`;
}
