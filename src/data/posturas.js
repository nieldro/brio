// Las posturas de cada movimiento. Datos puros, sin React: así se pueden
// revisar con pruebas, que es lo que evita que una figura mal escrita se
// dibuje rota sin que nada falle.
//
// Las pinta components/FiguraEjercicio.js, un monigote de once trazos que va
// y viene entre dos posturas. No es un video: pesa cero, funciona sin señal y
// toma el color del tema. Para enseñar un recorrido alcanza.
//
// Un movimiento puede llevar DOS posturas o TRES. Con dos, la figura va de un
// extremo al otro en línea recta y se ve como un ascensor. Con una postura
// intermedia el recorrido se curva: en la sentadilla la rodilla se adelanta
// antes de que la cadera baje, que es como se hace de verdad. Los que llevan
// tres son los que sin ella no se entendían.
//
// Cada postura son 22 números, siempre en el mismo orden:
//   cabeza, hombro, cadera, codoI, manoI, codoD, manoD, rodillaI, pieI, rodillaD, pieD
// La vista es de perfil mirando a la derecha, que es como mejor se entienden
// una sentadilla, una flexión y un puente.
const P = (...n) => n;

const DE_PIE = P(52, 18, 50, 32, 50, 62, 46, 46, 46, 60, 54, 46, 54, 60, 48, 86, 46, 110, 52, 86, 54, 110);

export const POSTURAS = {
  // De pie y bajando a la silla: la cadera va hacia atrás, las rodillas hacia
  // adelante y los brazos se estiran al frente para no perder el equilibrio.
  sentadilla: [
    DE_PIE,
    // A media bajada la rodilla ya se adelantó y la cadera apenas empieza a
    // irse atrás. Sin este paso, el monigote bajaba recto como un ascensor.
    P(53, 29, 49, 42, 45, 70, 52, 52, 64, 48, 54, 56, 66, 52, 53, 85, 51, 110, 57, 86, 57, 110),
    P(54, 40, 48, 52, 40, 78, 58, 58, 72, 54, 60, 62, 74, 58, 56, 84, 52, 110, 60, 86, 58, 110),
  ],

  // Caminar: las piernas se cruzan y los brazos acompañan.
  caminata: [
    P(52, 18, 50, 32, 50, 62, 44, 46, 40, 58, 56, 46, 60, 58, 40, 84, 34, 106, 60, 84, 66, 108),
    // Las piernas se cruzan a la mitad del paso. Sin esta postura, una pierna
    // desaparecía por delante y aparecía por detrás sin pasar por el medio.
    P(52, 17, 50, 31, 50, 61, 50, 46, 50, 58, 50, 46, 50, 58, 50, 84, 50, 108, 50, 84, 50, 108),
    P(52, 18, 50, 32, 50, 62, 56, 46, 60, 58, 44, 46, 40, 58, 60, 84, 66, 106, 40, 84, 34, 108),
  ],

  // Flexión en la pared: el cuerpo entero se acerca y se aleja.
  flexion: [
    P(60, 22, 56, 38, 40, 70, 70, 44, 86, 46, 70, 48, 86, 50, 34, 90, 28, 112, 38, 92, 32, 112),
    P(64, 26, 60, 41, 42, 71, 71, 51, 86, 46, 71, 55, 86, 50, 35, 90, 28, 112, 39, 92, 32, 112),
    P(68, 30, 64, 44, 44, 72, 72, 58, 86, 46, 72, 62, 86, 50, 36, 90, 28, 112, 40, 92, 32, 112),
  ],

  // Puente de glúteos: boca arriba, la cadera sube.
  puente: [
    P(20, 92, 32, 92, 58, 92, 40, 100, 50, 102, 40, 84, 50, 86, 74, 74, 80, 104, 78, 76, 84, 104),
    P(20, 92, 32, 90, 58, 72, 40, 100, 50, 102, 40, 84, 50, 86, 76, 68, 80, 104, 80, 70, 84, 104),
  ],

  // Plancha: la línea se sostiene, solo respira.
  plancha: [
    P(22, 64, 34, 70, 64, 82, 34, 88, 48, 92, 34, 86, 48, 90, 82, 90, 96, 98, 84, 88, 96, 96),
    P(22, 60, 34, 66, 64, 78, 34, 88, 48, 92, 34, 86, 48, 90, 82, 88, 96, 98, 84, 86, 96, 96),
  ],

  // Estiramiento: bajar hacia los pies y volver.
  estiramiento: [
    P(52, 18, 50, 32, 50, 62, 46, 46, 46, 60, 54, 46, 54, 60, 48, 86, 46, 110, 52, 86, 54, 110),
    P(56, 34, 53, 44, 50, 64, 54, 58, 58, 72, 60, 60, 64, 74, 49, 87, 46, 110, 53, 87, 54, 110),
    // Hasta abajo de verdad. Antes se quedaba a medio doblar y no se veía si
    // estaba estirando o mirando el suelo.
    P(60, 60, 56, 66, 50, 68, 64, 80, 66, 98, 66, 82, 68, 100, 50, 88, 46, 110, 54, 88, 54, 110),
  ],

  // Elevación de talones: todo el cuerpo sube unos centímetros.
  talones: [
    DE_PIE,
    P(52, 12, 50, 26, 50, 56, 46, 40, 46, 54, 54, 40, 54, 54, 48, 82, 46, 106, 52, 82, 54, 106),
  ],

  // Subir un escalón.
  escalera: [
    P(52, 18, 50, 32, 50, 62, 44, 46, 40, 58, 56, 46, 60, 58, 44, 86, 42, 110, 56, 86, 58, 110),
    P(56, 10, 54, 24, 54, 54, 48, 38, 44, 50, 60, 38, 64, 50, 66, 70, 72, 92, 52, 80, 50, 104),
  ],

  // Pasos laterales, de frente: el peso va de un lado al otro.
  lateral: [
    P(50, 18, 50, 32, 50, 62, 38, 44, 30, 54, 62, 44, 70, 54, 42, 86, 36, 110, 58, 86, 64, 110),
    P(56, 18, 56, 32, 56, 62, 44, 44, 36, 54, 68, 44, 76, 54, 48, 86, 42, 110, 66, 86, 76, 110),
  ],

  // Brazos arriba y abajo: sirve para movilidad y para bailar.
  brazos: [
    P(50, 18, 50, 32, 50, 62, 38, 44, 32, 56, 62, 44, 68, 56, 44, 86, 42, 110, 56, 86, 58, 110),
    P(50, 18, 50, 32, 50, 62, 36, 26, 32, 12, 64, 26, 68, 12, 44, 86, 42, 110, 56, 86, 58, 110),
  ],

  // Sentado tirando hacia atrás: remo, jalón, mancuernas.
  remo: [
    P(42, 34, 42, 48, 44, 78, 58, 54, 74, 52, 58, 58, 74, 56, 72, 78, 78, 106, 76, 80, 82, 108),
    P(42, 34, 42, 48, 44, 78, 32, 54, 24, 50, 32, 58, 24, 54, 72, 78, 78, 106, 76, 80, 82, 108),
  ],

  // Sentado empujando: prensa, press, bicicleta.
  empuje: [
    P(34, 34, 34, 48, 36, 78, 46, 58, 58, 56, 46, 62, 58, 60, 62, 80, 66, 106, 66, 82, 70, 108),
    P(34, 34, 34, 48, 36, 78, 46, 58, 58, 56, 46, 62, 58, 60, 68, 78, 80, 98, 72, 80, 83, 101),
    P(34, 34, 34, 48, 36, 78, 46, 58, 58, 56, 46, 62, 58, 60, 74, 76, 94, 90, 78, 78, 96, 94),
  ],

  // Zancada: una pierna adelante, la otra atrás, y la cadera baja.
  zancada: [
    P(52, 18, 50, 32, 50, 62, 46, 46, 46, 60, 54, 46, 54, 60, 48, 86, 46, 110, 52, 86, 54, 110),
    // El paso se da ANTES de bajar. Sin esto la pierna aparecía ya estirada
    // atrás, como si la persona se hubiera teletransportado.
    P(51, 20, 49, 34, 48, 64, 44, 48, 43, 62, 53, 48, 55, 62, 58, 84, 62, 110, 42, 88, 36, 110),
    P(50, 26, 48, 40, 46, 70, 42, 54, 40, 68, 54, 54, 56, 68, 68, 84, 74, 110, 34, 92, 26, 108),
  ],

  // Flexión en el suelo: el cuerpo baja recto, apoyado en las manos.
  flexionSuelo: [
    P(20, 56, 32, 62, 62, 74, 34, 74, 34, 92, 34, 72, 34, 92, 78, 84, 94, 94, 80, 82, 94, 92),
    P(20, 70, 32, 74, 62, 82, 34, 82, 34, 92, 34, 80, 34, 92, 78, 88, 94, 94, 80, 86, 94, 92),
  ],

  // Abdominal corto: boca arriba, los hombros despegan del piso.
  abdominal: [
    P(20, 84, 32, 88, 58, 92, 34, 76, 26, 68, 34, 98, 26, 104, 74, 74, 82, 102, 78, 78, 86, 102),
    P(30, 70, 38, 78, 58, 92, 40, 64, 32, 58, 40, 86, 32, 92, 74, 74, 82, 102, 78, 78, 86, 102),
  ],

  // Superman: boca abajo, brazos y piernas se levantan a la vez.
  superman: [
    P(18, 84, 30, 86, 62, 90, 26, 92, 14, 94, 26, 80, 14, 78, 76, 90, 92, 92, 76, 86, 92, 88),
    P(16, 72, 30, 80, 62, 90, 24, 78, 10, 70, 24, 66, 10, 60, 76, 82, 92, 74, 76, 78, 92, 70),
  ],

  // Plancha lateral: apoyado en un antebrazo, la cadera sube.
  planchaLateral: [
    P(22, 74, 34, 78, 64, 92, 34, 92, 46, 96, 34, 90, 46, 94, 78, 96, 94, 100, 80, 94, 94, 98),
    P(22, 62, 34, 68, 64, 80, 34, 92, 46, 96, 34, 90, 46, 94, 78, 86, 94, 96, 80, 84, 94, 94),
  ],

  // Silla contra la pared: se baja y se sostiene, sin moverse.
  sillaPared: [
    P(76, 26, 74, 40, 72, 68, 68, 52, 66, 66, 80, 52, 82, 66, 48, 70, 46, 110, 52, 72, 54, 110),
    P(78, 40, 76, 54, 74, 78, 70, 66, 68, 80, 82, 66, 84, 80, 46, 80, 44, 110, 50, 82, 52, 110),
  ],

  // A cuatro apoyos: la espalda se redondea y se hunde.
  cuadrupedia: [
    P(24, 58, 36, 62, 68, 66, 36, 78, 34, 94, 36, 76, 34, 94, 70, 80, 74, 96, 72, 78, 76, 94),
    P(26, 68, 36, 54, 68, 72, 36, 76, 34, 94, 36, 74, 34, 94, 70, 84, 74, 96, 72, 82, 76, 94),
  ],

  // A cuatro apoyos, una pierna que empuja hacia atrás y arriba.
  patada: [
    P(24, 58, 36, 62, 68, 66, 36, 78, 34, 94, 36, 76, 34, 94, 70, 80, 74, 96, 72, 78, 76, 94),
    P(24, 58, 36, 62, 68, 66, 36, 78, 34, 94, 36, 76, 34, 94, 84, 58, 96, 44, 72, 78, 76, 94),
  ],

  // De pie tirando hacia atrás: remo con banda o con polea baja.
  remoDePie: [
    P(52, 18, 50, 32, 50, 62, 60, 44, 74, 42, 60, 48, 74, 46, 48, 86, 46, 110, 52, 86, 54, 110),
    P(52, 18, 50, 32, 50, 62, 40, 44, 30, 40, 40, 48, 30, 44, 48, 86, 46, 110, 52, 86, 54, 110),
  ],

  // De pie, la rodilla sube al pecho.
  rodillas: [
    P(52, 18, 50, 32, 50, 62, 44, 46, 40, 58, 56, 46, 60, 58, 48, 86, 46, 110, 52, 86, 54, 110),
    P(52, 18, 50, 32, 50, 62, 56, 48, 64, 60, 42, 46, 36, 56, 66, 62, 62, 84, 52, 86, 54, 110),
  ],

  // Sentado, respirando: el pecho sube y baja.
  respiracion: [
    P(42, 38, 42, 52, 44, 78, 36, 64, 40, 76, 50, 64, 54, 76, 72, 78, 78, 106, 76, 80, 82, 108),
    P(42, 32, 42, 46, 44, 78, 32, 60, 38, 74, 54, 60, 58, 74, 72, 78, 78, 106, 76, 80, 82, 108),
  ],
};

// El movimiento que no está en la lista se muestra de pie, respirando. Nunca
// se inventa una técnica dibujada: un recorrido mal enseñado lesiona igual
// que uno mal escrito.
export const POSTURA_POR_DEFECTO = 'respiracion';
