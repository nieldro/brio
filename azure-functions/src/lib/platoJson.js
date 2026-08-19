// Validación de lo que el modelo dice sobre una foto de comida.
// Funciones puras: se prueban solas, sin red y sin Azure.
//
// Esta es la pieza más delicada del producto entero. Un modelo de visión,
// si no se le pone freno, hace justo lo que la regla 1 prohíbe: estimar
// calorías, repartir macros y calificar el plato de bueno o malo. Y la
// persona a la que le hablamos ya intentó eso y lo dejó.
//
// El prompt lo pide. Esto lo COMPRUEBA. No es lo mismo: un prompt es una
// petición y un validador es una garantía. Si el modelo se sale, la respuesta
// se rechaza y no llega a la pantalla, aunque suene bien escrita.

export const COLORES = ['verde', 'ambar', 'rojo'];

const LARGO = { plato: 80, suma: 120, mensaje: 160 };

// Cualquier cifra sobre comida está fuera. Incluye "proteínas" y
// "carbohidratos" a propósito: nombrarlos ya invita a contarlos.
const MEDIDAS =
  /calor[íi]as?|macros?|\bkcal\b|gramos?|\bgr\b|\bml\b|mililitros?|prote[íi]nas?|carbohidratos?|ayuno/i;

// Juicio sobre la comida o sobre el cuerpo. Las dos cosas están prohibidas.
// Van con \w* porque el modelo conjuga: "evita", "evitar" y "evitando" son
// la misma orden, y la primera versión de esto solo atrapaba la primera.
const JUICIO =
  /\b(engorda\w*|chatarra|basura|pecado|culpa\w*|evit\w*|prohibid\w*|malo|mala|dieta\w*|deber[íi]as|debes|gordo|flaco|obes\w*|sobrepeso|adelgaz\w*|bajar de peso|subir de peso|tu cuerpo|tu peso)\b/i;

const VOZ = [
  'fracaso',
  'excusas',
  'quemar grasa',
  'cuerpo ideal',
  'sin dolor no hay resultado',
];

// El documento pide máximo 2 frases y cero signos de admiración.
const frases = (texto) => texto.split(/[.?…]+/).map((f) => f.trim()).filter(Boolean).length;

function revisarTexto(campo, valor, maximo, errores) {
  if (typeof valor !== 'string' || !valor.trim()) {
    errores.push(`falta ${campo}`);
    return;
  }
  if (valor.length > maximo) errores.push(`${campo} pasa de ${maximo} caracteres`);
  if (MEDIDAS.test(valor)) errores.push(`${campo} habla de cantidades o calorías`);
  if (JUICIO.test(valor)) errores.push(`${campo} juzga la comida o el cuerpo`);
  if (valor.includes('!') || valor.includes('¡')) errores.push(`${campo} lleva signos de admiración`);

  for (const mala of VOZ) {
    if (valor.toLowerCase().includes(mala)) errores.push(`${campo} usa "${mala}"`);
  }
}

export function validarPlato(crudo) {
  const errores = [];

  // Un `null` aquí NO es lo mismo que `{ plato: null }`. El primero es que el
  // modelo no devolvió JSON legible y hay que reintentar; el segundo es que
  // miró la foto y no vio comida, que es una respuesta buena.
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) {
    return { ok: false, errores: ['la respuesta no es un objeto'], resultado: null };
  }

  // El modelo puede decir con todas sus letras que en la foto no hay comida.
  // Es una respuesta válida, no un fallo: la pantalla lo trata con cariño.
  if (crudo.plato === null || crudo.plato === undefined || crudo.plato === '') {
    return { ok: true, errores: [], resultado: { hayPlato: false } };
  }

  revisarTexto('plato', crudo.plato, LARGO.plato, errores);
  revisarTexto('suma', crudo.suma, LARGO.suma, errores);
  revisarTexto('mensaje', crudo.mensaje, LARGO.mensaje, errores);

  if (typeof crudo.mensaje === 'string' && frases(crudo.mensaje) > 2) {
    errores.push('mensaje pasa de 2 frases');
  }

  if (!COLORES.includes(crudo.color)) {
    errores.push(`color inválido: ${JSON.stringify(crudo.color)}`);
  }

  if (errores.length) return { ok: false, errores, resultado: null };

  return {
    ok: true,
    errores: [],
    resultado: {
      hayPlato: true,
      plato: crudo.plato.trim(),
      color: crudo.color,
      suma: crudo.suma.trim(),
      mensaje: crudo.mensaje.trim(),
    },
  };
}
