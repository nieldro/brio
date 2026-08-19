// Las posturas de cada movimiento. Datos puros, sin React: así se pueden
// revisar con pruebas, que es lo que evita que una figura mal escrita se
// dibuje rota sin que nada falle.
//
// Las pinta components/FiguraEjercicio.js, un monigote de once trazos que va
// y viene entre dos posturas. No es un video: pesa cero, funciona sin señal y
// toma el color del tema. Para enseñar un recorrido alcanza.
//
// Cada postura son 22 números, siempre en el mismo orden:
//   cabeza, hombro, cadera, codoI, manoI, codoD, manoD, rodillaI, pieI, rodillaD, pieD
// La vista es de perfil mirando a la derecha, que es como mejor se entienden
// una sentadilla, una flexión y un puente.
const P = (...n) => n;

const DE_PIE = P(52, 18, 50, 32, 50, 62, 46, 46, 46, 60, 54, 46, 54, 60, 48, 86, 46, 110, 52, 86, 54, 110);

export const POSTURAS = {
  // De pie y bajando a la silla.
  sentadilla: [
    DE_PIE,
    P(48, 30, 46, 44, 40, 70, 52, 54, 66, 50, 56, 56, 70, 52, 56, 86, 46, 110, 60, 88, 54, 110),
  ],

  // Caminar: las piernas se cruzan y los brazos acompañan.
  caminata: [
    P(52, 18, 50, 32, 50, 62, 44, 46, 40, 58, 56, 46, 60, 58, 40, 84, 34, 106, 60, 84, 66, 108),
    P(52, 18, 50, 32, 50, 62, 56, 46, 60, 58, 44, 46, 40, 58, 60, 84, 66, 106, 40, 84, 34, 108),
  ],

  // Flexión en la pared: el cuerpo entero se acerca y se aleja.
  flexion: [
    P(58, 26, 54, 38, 44, 66, 66, 40, 78, 34, 66, 46, 78, 40, 42, 88, 36, 110, 46, 88, 40, 110),
    P(64, 30, 60, 42, 46, 66, 66, 54, 78, 34, 66, 60, 78, 40, 43, 88, 36, 110, 47, 88, 40, 110),
  ],

  // Puente de glúteos: boca arriba, la cadera sube.
  puente: [
    P(22, 84, 34, 88, 58, 92, 38, 98, 48, 102, 38, 80, 48, 76, 74, 86, 84, 102, 74, 96, 84, 104),
    P(22, 84, 34, 88, 58, 70, 38, 98, 48, 102, 38, 80, 48, 76, 74, 78, 84, 102, 74, 88, 84, 104),
  ],

  // Plancha: la línea se sostiene, solo respira.
  plancha: [
    P(24, 60, 34, 64, 62, 74, 32, 78, 30, 92, 32, 70, 30, 92, 76, 82, 88, 94, 76, 86, 88, 96),
    P(24, 58, 34, 62, 62, 71, 32, 78, 30, 92, 32, 70, 30, 92, 76, 80, 88, 94, 76, 84, 88, 96),
  ],

  // Estiramiento: bajar hacia los pies y volver.
  estiramiento: [
    P(52, 18, 50, 32, 50, 62, 46, 46, 46, 60, 54, 46, 54, 60, 48, 86, 46, 110, 52, 86, 54, 110),
    P(56, 44, 54, 54, 50, 66, 60, 66, 64, 84, 62, 68, 66, 86, 50, 88, 46, 110, 54, 88, 54, 110),
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
    P(30, 30, 34, 42, 34, 70, 48, 48, 64, 46, 48, 52, 64, 50, 56, 74, 74, 88, 56, 78, 74, 92),
    P(30, 30, 34, 42, 34, 70, 30, 50, 22, 46, 30, 54, 22, 50, 56, 74, 74, 88, 56, 78, 74, 92),
  ],

  // Sentado empujando: prensa, press, bicicleta.
  empuje: [
    P(30, 30, 34, 42, 34, 70, 46, 50, 60, 48, 46, 54, 60, 52, 52, 78, 44, 96, 52, 82, 44, 100),
    P(30, 30, 34, 42, 34, 70, 46, 50, 60, 48, 46, 54, 60, 52, 66, 72, 84, 86, 66, 76, 84, 90),
  ],

  // Sentado, respirando: el pecho sube y baja.
  respiracion: [
    P(40, 30, 42, 44, 42, 72, 34, 56, 30, 70, 50, 56, 54, 70, 58, 78, 76, 90, 58, 82, 76, 94),
    P(40, 26, 42, 40, 42, 72, 32, 52, 26, 68, 52, 52, 58, 68, 58, 78, 76, 90, 58, 82, 76, 94),
  ],
};

// El movimiento que no está en la lista se muestra de pie, respirando. Nunca
// se inventa una técnica dibujada: un recorrido mal enseñado lesiona igual
// que uno mal escrito.
export const POSTURA_POR_DEFECTO = 'respiracion';
