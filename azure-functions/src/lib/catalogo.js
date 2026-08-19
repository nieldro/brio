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
// Cada ejercicio dice tres cosas:
//   lugar   dónde se puede hacer: 'casa', 'gym' o 'ambos'
//   papel   para qué sirve en el día: calentamiento, cardio, fuerza, cierre
//   zonas   qué parte del cuerpo trabaja, para poder personalizar
//   suelo   si hay que bajar y subir del piso

export const ZONAS = ['piernas', 'gluteos', 'pecho', 'espalda', 'brazos', 'hombros', 'centro'];

const E = (nombre, lugar, papel, zonas = [], suelo = false, impacto = false) => ({
  nombre,
  lugar,
  papel,
  zonas,
  suelo,
  impacto,
});

export const EJERCICIOS = [
  // --- Calentamiento y cierre ---------------------------------------------
  E('Movilidad articular', 'ambos', 'calentamiento'),
  E('Marcha en el sitio', 'casa', 'calentamiento', ['piernas']),
  E('Pasos laterales', 'casa', 'calentamiento', ['piernas', 'gluteos']),
  E('Círculos de brazos', 'ambos', 'calentamiento', ['hombros']),
  E('Gato y vaca', 'casa', 'calentamiento', ['espalda'], true),
  E('Estiramiento', 'ambos', 'cierre'),
  E('Respiración', 'ambos', 'cierre'),

  // --- Cardio --------------------------------------------------------------
  E('Caminata', 'ambos', 'cardio', ['piernas']),
  E('Subir escaleras', 'casa', 'cardio', ['piernas', 'gluteos']),
  E('Bailar', 'casa', 'cardio', ['piernas']),
  E('Máquina de cardio', 'gym', 'cardio', ['piernas']),
  E('Rodillas al pecho', 'casa', 'cardio', ['piernas', 'centro']),

  // --- Fuerza en casa ------------------------------------------------------
  E('Sentadilla a la silla', 'casa', 'fuerza', ['piernas', 'gluteos']),
  E('Zancada', 'casa', 'fuerza', ['piernas', 'gluteos']),
  E('Sentadilla búlgara', 'casa', 'fuerza', ['piernas', 'gluteos']),
  E('Elevación de talones', 'casa', 'fuerza', ['piernas']),
  E('Peso muerto', 'ambos', 'fuerza', ['piernas', 'gluteos', 'espalda']),
  E('Puente de glúteos', 'casa', 'fuerza', ['gluteos', 'centro'], true),
  E('Flexiones en la pared', 'casa', 'fuerza', ['pecho', 'brazos', 'hombros']),
  E('Flexiones en el suelo', 'casa', 'fuerza', ['pecho', 'brazos', 'hombros'], true),
  E('Fondo de tríceps', 'ambos', 'fuerza', ['brazos', 'pecho']),
  E('Curl de bíceps', 'ambos', 'fuerza', ['brazos']),
  E('Elevaciones laterales', 'ambos', 'fuerza', ['hombros']),
  E('Trabajo con mancuernas', 'ambos', 'fuerza', ['brazos', 'hombros']),
  E('Plancha apoyada', 'ambos', 'fuerza', ['centro'], true),
  E('Abdominal corto', 'ambos', 'fuerza', ['centro'], true),
  E('Superman', 'casa', 'fuerza', ['espalda', 'gluteos'], true),
  E('Silla contra la pared', 'casa', 'fuerza', ['piernas', 'gluteos']),
  E('Sentadilla sumo', 'casa', 'fuerza', ['piernas', 'gluteos']),
  E('Plancha lateral', 'casa', 'fuerza', ['centro'], true),
  E('Patada de glúteo', 'casa', 'fuerza', ['gluteos'], true),
  E('Remo con banda', 'casa', 'fuerza', ['espalda', 'brazos']),

  // --- Fuerza en gimnasio --------------------------------------------------
  E('Prensa de piernas', 'gym', 'fuerza', ['piernas', 'gluteos']),
  E('Extensión de piernas', 'gym', 'fuerza', ['piernas']),
  E('Curl femoral', 'gym', 'fuerza', ['piernas']),
  E('Press de pecho', 'gym', 'fuerza', ['pecho', 'brazos', 'hombros']),
  E('Press de hombro', 'gym', 'fuerza', ['hombros', 'brazos']),
  E('Remo en máquina', 'gym', 'fuerza', ['espalda', 'brazos']),
  E('Jalón al pecho', 'gym', 'fuerza', ['espalda', 'brazos']),
  E('Polea de tríceps', 'gym', 'fuerza', ['brazos']),
  E('Sentadilla en máquina', 'gym', 'fuerza', ['piernas', 'gluteos']),
  E('Máquina de abductores', 'gym', 'fuerza', ['gluteos', 'piernas']),
  E('Elevación de talones en máquina', 'gym', 'fuerza', ['piernas']),
  E('Remo en polea baja', 'gym', 'fuerza', ['espalda', 'brazos']),
];

const sinTildes = (t) =>
  String(t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// --- A quién le sirve cada cosa -------------------------------------------

export function lugarDe(lugar) {
  const donde = sinTildes(lugar);
  if (donde.includes('gym') || donde.includes('gimnasio')) return 'gym';
  if (donde.includes('mezcl')) return 'mezclado';
  return 'casa';
}

// Bajarse y subirse del piso no es gratis para todo el mundo.
//
// Con mucho peso encima o pasados los sesenta, ese solo gesto se vuelve la
// parte difícil del ejercicio, y la persona abandona por algo que no era el
// ejercicio. Se sustituye por versiones de pie o en silla, que trabajan lo
// mismo. Es adaptación, no rebaja.
export function evitaElSuelo({ edad, imc } = {}) {
  const años = Number(edad);
  if (Number.isFinite(años) && años >= 60) return true;
  if (Number.isFinite(imc) && imc >= 35) return true;
  return false;
}

// Devuelve los ejercicios que le sirven a esta persona.
export function ejerciciosPara({ lugar, impacto = 'normal', sinSuelo = false, zonas = [] } = {}) {
  const donde = lugarDe(lugar);
  const enfoque = (zonas ?? []).map(sinTildes).filter(Boolean);

  return EJERCICIOS.filter((e) => {
    if (donde !== 'mezclado' && e.lugar !== 'ambos' && e.lugar !== donde) return false;
    if (impacto === 'bajo' && e.impacto) return false;
    if (sinSuelo && e.suelo) return false;

    // Las zonas solo filtran la fuerza. Nadie quiere un calentamiento
    // "de bíceps", y quitar el cierre dejaría el día sin estiramiento.
    if (enfoque.length && e.papel === 'fuerza') {
      return e.zonas.some((z) => enfoque.includes(sinTildes(z)));
    }
    return true;
  });
}

const porPapel = (lista, papel) => lista.filter((e) => e.papel === papel).map((e) => e.nombre);

// Todos los nombres, sin repetir. Lo usa la prueba que comprueba que cada uno
// tiene guía en la app.
export function todosLosNombres() {
  return [...new Set(EJERCICIOS.map((e) => e.nombre))].sort();
}

// El bloque que se le pega al prompt.
export function listaParaElPrompt(opciones = {}) {
  const utiles = ejerciciosPara(opciones);

  // Si el enfoque dejó la fuerza en nada (alguien que pidió solo "pecho" y
  // entrena en casa), se abre la mano antes que devolver un día vacío.
  const conFuerza = porPapel(utiles, 'fuerza').length >= 3
    ? utiles
    : ejerciciosPara({ ...opciones, zonas: [] });

  const linea = (titulo, papel) => `- ${titulo}: ${porPapel(conFuerza, papel).join(', ')}`;

  const nota = opciones.zonas?.length
    ? `\nEsta persona quiere trabajar sobre todo: ${opciones.zonas.join(', ')}. La lista de
fuerza ya viene filtrada para eso. Aun así, cada semana mete al menos un día
que mueva el cuerpo entero: entrenar una sola zona desequilibra.`
    : '';

  const suelo = opciones.sinSuelo
    ? `\nNADA en el piso. Ni planchas, ni abdominales boca arriba, ni puentes.
Todo de pie, en silla o contra la pared. No expliques por qué.`
    : '';

  return `
## Ejercicios que puedes usar (lista cerrada)
Usa SOLO estos nombres, escritos exactamente así. Cada uno tiene en la app su
guía y su animación; cualquier otro nombre deja a la persona sin las dos.

${linea('para calentar', 'calentamiento')}
${linea('para subir el pulso', 'cardio')}
${linea('para fuerza', 'fuerza')}
${linea('para cerrar', 'cierre')}
${nota}${suelo}

Puedes repetir un ejercicio en días distintos y cambiarle las series, las
repeticiones o los minutos en el "detalle". Lo que no puedes es inventar un
nombre que no esté aquí.`;
}
