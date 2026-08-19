// Validación de lo que el modelo dice sobre una foto de comida.
// Funciones puras: se prueban solas, sin red y sin Azure.
//
// Esta es la pieza más delicada del producto entero. Un modelo de visión, si
// no se le pone freno, hace justo lo que la persona a la que le hablamos ya
// intentó y abandonó: calificar el plato de bueno o malo y mandar a quitar.
//
// El prompt lo pide. Esto lo COMPRUEBA. No es lo mismo: un prompt es una
// petición y un validador es una garantía.
//
// QUÉ CAMBIÓ AL ENTRAR LA INFORMACIÓN NUTRICIONAL
// La estimación va en su propio campo, con rangos y con niveles, nunca en el
// texto. Así las dos cosas conviven sin contaminarse:
//   - Los TEXTOS siguen sin poder llevar cifras. Si el mensaje dijera "650
//     calorías", esa cifra se leería como un dato exacto, y de una foto no
//     sale ningún dato exacto.
//   - La ESTIMACIÓN puede llevar números, pero solo como rango, y la pantalla
//     la muestra marcada como aproximada y apagada por defecto.

export const COLORES = ['verde', 'ambar', 'rojo'];
export const NIVELES = ['poca', 'media', 'alta'];

const LARGO = { plato: 80, suma: 120, equilibrio: 140, mensaje: 160 };

// Cualquier cifra sobre comida está fuera DE LOS TEXTOS.
const MEDIDAS =
  /calor[íi]as?|macros?|\bkcal\b|gramos?|\bgr\b|\bml\b|mililitros?|prote[íi]nas?|carbohidratos?|ayuno/i;

// Y cualquier dígito, venga con la palabra que venga.
//
// MEDIDAS es una lista de PALABRAS, y durante un tiempo fue la única defensa.
// Bastaba con que el modelo escribiera la cantidad sin nombrar la unidad para
// que pasara entera: "Súmale 2 cucharadas de aguacate" o, con la estimación
// encendida, "Ronda entre 450 y 700, y algo fresco lo redondea". Ninguna de
// las dos lleva una palabra de MEDIDAS, y las dos le enseñan a la persona una
// cifra exacta dentro de una frase, que es justo lo que la regla prohíbe.
//
// El campo `nutricion` no pasa por aquí: esa estimación tiene su propio
// camino, con rango ancho y niveles, y sigue intacta.
const CIFRA = /\d/;

// Juicio sobre la comida o sobre el cuerpo, y órdenes de quitar.
//
// Decir con qué está cargado un plato y qué le falta SÍ se puede: eso es
// información sobre el plato. Lo que no se puede es calificarlo ("malo",
// "chatarra") ni mandar a restar ("evita", "quítale"). El documento pide tips
// de suma, y a alguien que ya abandonó una dieta la orden de quitar es
// justo lo que lo hace cerrar la app.
const JUICIO =
  /\b(engorda\w*|chatarra|basura|pecado|culpa\w*|evit\w*|quit[aáe]\w*|elimin\w*|prohibid\w*|malo|mala|dieta\w*|deber[íi]as|debes|gordo|flaco|obes\w*|sobrepeso|adelgaz\w*|bajar de peso|subir de peso|tu cuerpo|tu peso)\b/i;

const VOZ = ['fracaso', 'excusas', 'quemar grasa', 'cuerpo ideal', 'sin dolor no hay resultado'];

// El documento pide máximo 2 frases y cero signos de admiración.
const frases = (texto) => texto.split(/[.?…]+/).map((f) => f.trim()).filter(Boolean).length;

function revisarTexto(campo, valor, maximo, errores) {
  if (typeof valor !== 'string' || !valor.trim()) {
    errores.push(`falta ${campo}`);
    return;
  }
  if (valor.length > maximo) errores.push(`${campo} pasa de ${maximo} caracteres`);
  if (MEDIDAS.test(valor)) errores.push(`${campo} habla de cantidades o calorías`);
  if (CIFRA.test(valor)) errores.push(`${campo} lleva una cifra`);
  if (JUICIO.test(valor)) errores.push(`${campo} juzga la comida o el cuerpo`);
  if (valor.includes('!') || valor.includes('¡')) errores.push(`${campo} lleva signos de admiración`);

  for (const mala of VOZ) {
    if (valor.toLowerCase().includes(mala)) errores.push(`${campo} usa "${mala}"`);
  }
}

// La estimación. Se acepta solo si viene como RANGO y con niveles.
//
// Un número solo ("640 calorías") se lee como una medición. Un rango ancho
// dice la verdad: de una foto no se sabe el aceite, ni el tamaño real, ni si
// el arroz lleva mantequilla. Por eso se exige que el rango sea ancho de
// verdad, y un modelo que devuelva 640 a 650 se rechaza.
const ANCHO_MINIMO = 0.2;

function revisarNutricion(crudo, errores) {
  if (crudo == null) return null;

  if (typeof crudo !== 'object' || Array.isArray(crudo)) {
    errores.push('la estimación no es un objeto');
    return null;
  }

  const min = Number(crudo.energia_min);
  const max = Number(crudo.energia_max);

  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
    errores.push('la estimación no trae un rango de energía');
    return null;
  }
  if (max <= min) {
    errores.push('el rango de energía está al revés o es un punto');
    return null;
  }
  if ((max - min) / max < ANCHO_MINIMO) {
    errores.push('el rango de energía finge una precisión que una foto no da');
    return null;
  }

  const niveles = {};
  for (const clave of ['proteina', 'carbohidratos', 'grasas', 'fibra']) {
    const valor = String(crudo[clave] ?? '').toLowerCase();
    if (!NIVELES.includes(valor)) {
      errores.push(`el nivel de ${clave} debe ser poca, media o alta`);
      return null;
    }
    niveles[clave] = valor;
  }

  return { energiaMin: Math.round(min), energiaMax: Math.round(max), ...niveles };
}

export function validarPlato(crudo, { conNutricion = false } = {}) {
  const errores = [];

  // Un `null` aquí NO es lo mismo que `{ plato: null }`. El primero es que el
  // modelo no devolvió JSON legible y hay que reintentar; el segundo es que
  // miró la foto y no vio comida, que es una respuesta buena.
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) {
    return { ok: false, errores: ['la respuesta no es un objeto'], resultado: null };
  }

  if (crudo.plato === null || crudo.plato === undefined || crudo.plato === '') {
    return { ok: true, errores: [], resultado: { hayPlato: false } };
  }

  revisarTexto('plato', crudo.plato, LARGO.plato, errores);
  revisarTexto('suma', crudo.suma, LARGO.suma, errores);
  revisarTexto('mensaje', crudo.mensaje, LARGO.mensaje, errores);

  // El equilibrio es opcional: si el plato ya está completo, no hay nada que
  // equilibrar y forzar una frase saldría en una recomendación inventada.
  if (crudo.equilibrio != null && crudo.equilibrio !== '') {
    revisarTexto('equilibrio', crudo.equilibrio, LARGO.equilibrio, errores);
  }

  if (typeof crudo.mensaje === 'string' && frases(crudo.mensaje) > 2) {
    errores.push('mensaje pasa de 2 frases');
  }

  if (!COLORES.includes(crudo.color)) {
    errores.push(`color inválido: ${JSON.stringify(crudo.color)}`);
  }

  const nutricion = conNutricion ? revisarNutricion(crudo.nutricion, errores) : null;
  if (conNutricion && !nutricion) errores.push('se pidió la estimación y no llegó');

  if (errores.length) return { ok: false, errores, resultado: null };

  return {
    ok: true,
    errores: [],
    resultado: {
      hayPlato: true,
      plato: crudo.plato.trim(),
      color: crudo.color,
      suma: crudo.suma.trim(),
      equilibrio: crudo.equilibrio?.trim() || null,
      mensaje: crudo.mensaje.trim(),
      nutricion,
    },
  };
}
