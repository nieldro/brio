// El porqué de la persona, devuelto en sus propias palabras.
//
// EL HUECO QUE LLENA
// El paso 4 del onboarding pregunta "¿y para qué lo quieres de verdad?" y
// promete "esto queda entre tú y yo". La respuesta se guardaba, se le mandaba
// a la IA y la persona no la volvía a ver nunca. Todo el producto se apoya en
// conectar con el porqué, y el porqué estaba enterrado en la base de datos.
//
// CÓMO SE DICE, QUE ES LO DIFÍCIL
// Recordarle a alguien su motivo en un mal momento es la línea exacta entre
// acompañar y echar en cara. "Dijiste que querías esto por tu familia" es un
// reproche con otra ropa. Por eso:
//   - Se dice en pasado y sin pedir nada: es un dato, no una palanca.
//   - Nunca lleva "pero", "recuerda que" ni "no olvides".
//   - Cuando la persona lo escribió a mano, se cita tal cual. Sus palabras
//     pesan más que cualquiera que le pongamos nosotros.

// Las opciones fijas del paso 4 vienen en primera persona ("Mi salud") y hay
// que voltearlas para hablarle a ella. Sin esto salía "esto era por mi salud",
// que suena a que el motivo es de Brío.
const CONOCIDOS = {
  'mi salud': 'tu salud',
  'mi familia': 'tu familia',
  'volver a gustarme': 'volver a gustarte',
  'tener energía': 'tener energía',
  'tener energia': 'tener energía',
};

const limpio = (texto) => String(texto ?? '').trim();

const sinTildes = (texto) =>
  limpio(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// La forma para hablarle de tú, o null si lo escribió con sus palabras.
export function enSegundaPersona(porque) {
  return CONOCIDOS[sinTildes(porque)] ?? null;
}

export function hayPorque(porque) {
  return limpio(porque).length > 0;
}

// La frase que se muestra. null cuando no hay porqué: es mejor no decir nada
// que inventarle un motivo a alguien.
export function recordatorioDePorque(porque) {
  const texto = limpio(porque);
  if (!texto) return null;

  const conocido = enSegundaPersona(texto);
  if (conocido) return `Cuando empezamos, esto era por ${conocido}. Sigue ahí.`;

  // Escrito a mano: se cita, no se parafrasea.
  return `Cuando empezamos escribiste esto: «${texto}». Sigue ahí.`;
}

// La versión corta, para donde no cabe una frase entera.
export function porqueCorto(porque) {
  const texto = limpio(porque);
  if (!texto) return null;

  return enSegundaPersona(texto) ?? texto;
}

// Cuándo sacarlo en la pantalla de Hoy.
//
// Solo en el regreso: cuando alguien vuelve después de romper la racha. Es el
// momento en que la app se juega que se quede o se vaya otra vez, y es el
// único en que su motivo aporta algo. Sacarlo todos los días lo gasta hasta
// volverlo decoración, y sacarlo cuando va bien es dar un empujón a quien ya
// va caminando.
export function toca(porque, { rota = false, completadoHoy = false } = {}) {
  if (!hayPorque(porque)) return false;
  if (completadoHoy) return false;

  return rota === true;
}
