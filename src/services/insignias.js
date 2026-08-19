// Las insignias de Brío.
//
// DE DÓNDE SALE LA IDEA
// Headspace celebra hitos además de constancia, y eso sostiene a la gente
// cuando la racha diaria se rompe: aunque falles esta semana, lo que ya
// construiste sigue ahí. Duolingo hace lo mismo con logros.
//
// QUÉ SE COPIÓ Y QUÉ NO
// Se copió la colección de cosas conseguidas. NO se copió el ranking, la
// liga ni la comparación con otros: a alguien que ya abandonó cinco apps,
// verse último en una tabla lo saca para siempre. Aquí solo te comparas con
// lo que tú hiciste.
//
// LA REGLA
// Una insignia se gana con TRABAJO comprobable, nunca con haber abierto la
// app ni con pagar. Y una vez ganada no se pierde: eso es lo que la separa de
// una racha. Si se pudiera perder, sería un castigo esperando.

export const INSIGNIAS = [
  // --- Empezar --------------------------------------------------------
  {
    clave: 'primer-dia',
    grupo: 'empezar',
    titulo: 'El primero',
    texto: 'Marcaste tu primer día. Ya no eres de los que solo lo piensan.',
    meta: 1,
    de: (d) => d.dias,
  },
  {
    clave: 'primera-rutina',
    grupo: 'empezar',
    titulo: 'Rutina completa',
    texto: 'Terminaste una rutina entera, ejercicio por ejercicio.',
    meta: 1,
    de: (d) => d.rutinas,
  },
  {
    clave: 'primera-linea',
    grupo: 'empezar',
    titulo: 'Escrito queda',
    texto: 'Escribiste tu primer logro en el diario.',
    meta: 1,
    de: (d) => d.lineas,
  },

  // --- Trabajo ---------------------------------------------------------
  {
    clave: 'dias-7',
    grupo: 'trabajo',
    titulo: 'Siete días',
    texto: 'Una semana entera de días marcados, seguidos o no.',
    meta: 7,
    de: (d) => d.dias,
  },
  {
    clave: 'dias-30',
    grupo: 'trabajo',
    titulo: 'Treinta días',
    texto: 'Esto ya no es un intento. Es algo que haces.',
    meta: 30,
    de: (d) => d.dias,
  },
  {
    clave: 'dias-100',
    grupo: 'trabajo',
    titulo: 'Cien días',
    texto: 'Muy poca gente llega aquí. Tú sí.',
    meta: 100,
    de: (d) => d.dias,
  },
  {
    clave: 'rutinas-10',
    grupo: 'trabajo',
    titulo: 'Diez rutinas enteras',
    texto: 'No las dejaste a medias. Diez veces.',
    meta: 10,
    de: (d) => d.rutinas,
  },
  {
    clave: 'habitos-30',
    grupo: 'trabajo',
    titulo: 'Treinta hábitos',
    texto: 'Treinta veces hiciste algo pequeño que nadie te iba a revisar.',
    meta: 30,
    de: (d) => d.habitos,
  },

  // --- Disciplina ------------------------------------------------------
  {
    clave: 'semana-entera',
    grupo: 'disciplina',
    titulo: 'Semana completa',
    texto: 'Siete de siete en una misma semana.',
    meta: 1,
    de: (d) => d.semanasEnteras,
  },
  {
    clave: 'semanas-4',
    grupo: 'disciplina',
    titulo: 'Un mes presente',
    texto: 'Cuatro semanas distintas con movimiento. La permanencia es lo difícil.',
    meta: 4,
    de: (d) => d.semanas,
  },
  {
    clave: 'semanas-12',
    grupo: 'disciplina',
    titulo: 'Tres meses',
    texto: 'Doce semanas apareciendo. Eso ya es carácter.',
    meta: 12,
    de: (d) => d.semanas,
  },
  {
    clave: 'racha-14',
    grupo: 'disciplina',
    titulo: 'Catorce seguidos',
    texto: 'Dos semanas sin saltarte un día.',
    meta: 14,
    de: (d) => d.mejorRacha,
  },

  // --- Volver ----------------------------------------------------------
  // El grupo que ninguna otra app tiene, y el que más importa aquí.
  {
    clave: 'volver-1',
    grupo: 'volver',
    titulo: 'Volviste',
    texto: 'Paraste y volviste. Eso es más difícil que no parar nunca.',
    meta: 1,
    de: (d) => d.regresos,
  },
  {
    clave: 'volver-5',
    grupo: 'volver',
    titulo: 'Cinco regresos',
    texto: 'Cinco veces pudiste quedarte fuera y no lo hiciste.',
    meta: 5,
    de: (d) => d.regresos,
  },
  {
    clave: 'volver-lejos',
    grupo: 'volver',
    titulo: 'De muy lejos',
    texto: 'Volviste después de más de dos semanas parado. Eso casi nadie lo hace.',
    meta: 1,
    de: (d) => d.regresosLargos,
  },
];

export const GRUPOS = [
  { clave: 'empezar', titulo: 'Empezar' },
  { clave: 'trabajo', titulo: 'Trabajo' },
  { clave: 'disciplina', titulo: 'Disciplina' },
  { clave: 'volver', titulo: 'Volver' },
];

// El estado de cada insignia: ganada o en camino, con su avance.
//
// El avance se muestra SIEMPRE, también en las que faltan. Ver "18 de 30" es
// distinto de ver un candado: el candado dice "no puedes", el avance dice
// "vas por aquí".
export function estadoDeInsignias(datos = {}) {
  const d = {
    dias: 0,
    semanas: 0,
    semanasEnteras: 0,
    rutinas: 0,
    habitos: 0,
    lineas: 0,
    regresos: 0,
    regresosLargos: 0,
    mejorRacha: 0,
    ...datos,
  };

  return INSIGNIAS.map((i) => {
    const valor = i.de(d) ?? 0;
    return {
      ...i,
      valor,
      ganada: valor >= i.meta,
      fraccion: Math.min(1, i.meta > 0 ? valor / i.meta : 0),
    };
  });
}

export function porGrupo(datos = {}) {
  const todas = estadoDeInsignias(datos);
  return GRUPOS.map((g) => ({
    ...g,
    insignias: todas.filter((i) => i.grupo === g.clave),
  })).filter((g) => g.insignias.length > 0);
}

export const cuantasGanadas = (datos = {}) =>
  estadoDeInsignias(datos).filter((i) => i.ganada).length;

// La última que se ganó, para poder celebrarla en el momento.
export function reciénGanadas(antes = {}, ahora = {}) {
  const previas = new Set(
    estadoDeInsignias(antes)
      .filter((i) => i.ganada)
      .map((i) => i.clave),
  );

  return estadoDeInsignias(ahora).filter((i) => i.ganada && !previas.has(i.clave));
}

export function textoDelResumen(ganadas, total) {
  if (ganadas === 0) return 'Aquí se va a ir llenando con lo que hagas.';
  if (ganadas === total) return 'Las tienes todas. No queda nada por demostrar.';
  return `${ganadas} de ${total}. Cada una es trabajo que ya hiciste.`;
}
