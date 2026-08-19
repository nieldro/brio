import test from 'node:test';
import assert from 'node:assert/strict';

import { validarPlato, COLORES } from '../src/lib/platoJson.js';
import { extraerJson } from '../src/lib/planJson.js';

const BUENO = {
  plato: 'Arroz con pollo y ensalada',
  color: 'verde',
  equilibrio: 'Lleva bastante arroz y poca verdura',
  suma: 'Acompáñalo con algo fresco de color',
  mensaje: 'Se ve completo. Así vas bien.',
};

const NUTRICION = {
  energia_min: 450,
  energia_max: 700,
  proteina: 'media',
  carbohidratos: 'alta',
  grasas: 'media',
  fibra: 'poca',
};

const con = (cambios) => validarPlato({ ...BUENO, ...cambios });
const conNutri = (cambios) =>
  validarPlato({ ...BUENO, nutricion: { ...NUTRICION, ...cambios } }, { conNutricion: true });

// --- Lo que sí pasa -------------------------------------------------------

test('una respuesta limpia pasa y llega normalizada', () => {
  const r = validarPlato({ ...BUENO, plato: '  Arroz con pollo  ' });

  assert.equal(r.ok, true);
  assert.deepEqual(r.errores, []);
  assert.equal(r.resultado.hayPlato, true);
  assert.equal(r.resultado.plato, 'Arroz con pollo');
  assert.equal(r.resultado.color, 'verde');
});

test('los tres colores del semáforo son válidos', () => {
  for (const color of COLORES) {
    assert.equal(con({ color }).ok, true, color);
  }
});

test('sirve con el JSON envuelto en comillas de markdown', () => {
  const crudo = '```json\n' + JSON.stringify(BUENO) + '\n```';
  assert.equal(validarPlato(extraerJson(crudo)).ok, true);
});

test('"aquí no hay comida" es una respuesta válida, no un fallo', () => {
  const r = validarPlato({ plato: null });

  assert.equal(r.ok, true);
  assert.equal(r.resultado.hayPlato, false);
});

// --- La regla 1: nunca calorías -------------------------------------------
// Esta es la razón de existir del archivo. El prompt lo pide; esto lo obliga.

test('rechaza cualquier cifra de comida', () => {
  const salidas = [
    'Tiene unas 600 calorías',
    'Son 600 kcal aproximadamente',
    'Unos 40 gramos de proteína',
    'Calcula 250 ml de jugo',
    'Le faltan proteínas',
    'Muchos carbohidratos para la noche',
    'Prueba un ayuno de 16 horas',
  ];

  for (const mensaje of salidas) {
    const r = con({ mensaje });
    assert.equal(r.ok, false, `debería rechazar: ${mensaje}`);
    assert.ok(
      r.errores.some((e) => e.includes('cantidades')),
      `${mensaje} → ${r.errores.join('; ')}`,
    );
  }
});

test('las cifras tampoco pasan escondidas en la suma o en el nombre', () => {
  assert.equal(con({ suma: 'Súmale 200 gramos de verdura' }).ok, false);
  assert.equal(con({ plato: 'Pechuga de 150 gramos' }).ok, false);
});

// --- Nada de juicio -------------------------------------------------------

test('rechaza calificar la comida', () => {
  const salidas = [
    'Eso engorda mucho',
    'Es comida chatarra',
    'Evita el frito la próxima',
    'Deberías quitarle el arroz',
    'Ese plato está malo',
    'No entra en tu dieta',
  ];

  for (const mensaje of salidas) {
    assert.equal(con({ mensaje }).ok, false, `debería rechazar: ${mensaje}`);
  }
});

test('rechaza el verbo conjugado, no solo la forma de diccionario', () => {
  // La primera versión solo atrapaba "evita" y dejaba pasar "evitar" y
  // "evitando", que dicen exactamente lo mismo.
  for (const mensaje of ['Trata de evitar el pan', 'Vas evitando lo frito, bien']) {
    assert.equal(con({ mensaje }).ok, false, mensaje);
  }
});

test('rechaza hablar del cuerpo o del peso', () => {
  const salidas = [
    'Con esto no vas a bajar de peso',
    'Tu cuerpo necesita otra cosa',
    'Ideal para el sobrepeso',
  ];

  for (const mensaje of salidas) {
    assert.equal(con({ mensaje }).ok, false, `debería rechazar: ${mensaje}`);
  }
});

// --- Voz de Brío ----------------------------------------------------------

test('rechaza los signos de admiración', () => {
  assert.equal(con({ mensaje: 'Qué buen plato.' }).ok, true);
  assert.equal(con({ mensaje: 'Qué buen plato!' }).ok, false);
  assert.equal(con({ suma: '¡Súmale agua!' }).ok, false);
});

test('rechaza pasar de dos frases', () => {
  assert.equal(con({ mensaje: 'Se ve bien. Con eso vas.' }).ok, true);

  const r = con({ mensaje: 'Se ve bien. Con eso vas. Nos vemos mañana.' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => e.includes('2 frases')));
});

test('rechaza las palabras prohibidas del documento', () => {
  assert.equal(con({ mensaje: 'Eso es un fracaso.' }).ok, false);
  assert.equal(con({ suma: 'Súmale algo para quemar grasa' }).ok, false);
});

// --- La estimación: información sin fingir precisión ----------------------
//
// Es lo que se pidió: energía y niveles. Y las condiciones bajo las que se
// puede dar sin mentir.

test('una estimación bien formada pasa y llega normalizada', () => {
  const r = conNutri();

  assert.equal(r.ok, true, r.errores.join('; '));
  assert.equal(r.resultado.nutricion.energiaMin, 450);
  assert.equal(r.resultado.nutricion.energiaMax, 700);
  assert.equal(r.resultado.nutricion.proteina, 'media');
});

test('sin pedirla, la estimación no sale aunque el modelo la mande', () => {
  const r = validarPlato({ ...BUENO, nutricion: NUTRICION });
  assert.equal(r.ok, true);
  assert.equal(r.resultado.nutricion, null);
});

test('pedirla y que no llegue es un fallo, no un silencio', () => {
  const r = validarPlato(BUENO, { conNutricion: true });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /no llegó/.test(e)));
});

test('rechaza un rango estrecho: una foto no da esa precisión', () => {
  // 640 a 650 se lee como una medición, y de una foto no sale ninguna.
  const r = conNutri({ energia_min: 640, energia_max: 650 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /precisión/.test(e)), r.errores.join('; '));
});

test('rechaza un rango al revés o de un solo punto', () => {
  assert.equal(conNutri({ energia_min: 700, energia_max: 450 }).ok, false);
  assert.equal(conNutri({ energia_min: 500, energia_max: 500 }).ok, false);
});

test('los niveles son palabras, nunca gramos', () => {
  // Pedir "23 g de proteína" desde una foto es inventar. Poca, media o alta
  // es lo que de verdad se puede ver, y para quien busca músculo es más útil.
  assert.equal(conNutri({ proteina: '23 g' }).ok, false);
  assert.equal(conNutri({ proteina: 'muchísima' }).ok, false);
  for (const nivel of ['poca', 'media', 'alta']) {
    assert.equal(conNutri({ proteina: nivel }).ok, true, nivel);
  }
});

test('faltar un nivel invalida la estimación entera', () => {
  const sinFibra = { ...NUTRICION };
  delete sinFibra.fibra;
  const r = validarPlato({ ...BUENO, nutricion: sinFibra }, { conNutricion: true });
  assert.equal(r.ok, false);
});

test('los números siguen sin poder colarse en los textos', () => {
  // Esta es la linea que no se cruza: la estimación va en su campo, y el
  // mensaje que la persona lee sigue sin cifras.
  const r = validarPlato(
    { ...BUENO, mensaje: 'Tiene unas 600 calorías. Vas bien.', nutricion: NUTRICION },
    { conNutricion: true },
  );
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => e.includes('cantidades')));
});

// --- El equilibrio: información, no reproche ------------------------------

test('el equilibrio puede decir qué sobra y qué falta', () => {
  const r = con({ equilibrio: 'Casi todo es harina y no hay nada fresco' });
  assert.equal(r.ok, true, r.errores.join('; '));
  assert.equal(r.resultado.equilibrio, 'Casi todo es harina y no hay nada fresco');
});

test('el equilibrio sigue sin poder juzgar', () => {
  assert.equal(con({ equilibrio: 'Es comida chatarra' }).ok, false);
  assert.equal(con({ equilibrio: 'Eso engorda mucho' }).ok, false);
  assert.equal(con({ equilibrio: 'Tiene 300 gramos de arroz' }).ok, false);
});

test('un plato completo puede venir sin equilibrio', () => {
  // Forzar una pega cuando no la hay sale en una recomendación inventada.
  const r = validarPlato({ ...BUENO, equilibrio: '' });
  assert.equal(r.ok, true);
  assert.equal(r.resultado.equilibrio, null);
});

// --- Estructura -----------------------------------------------------------

test('rechaza un color que no es del semáforo', () => {
  const r = con({ color: 'azul' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => e.includes('color inválido')));
});

test('rechaza los campos que faltan', () => {
  assert.equal(validarPlato({ plato: 'Arroz', color: 'verde' }).ok, false);
  assert.equal(con({ suma: '   ' }).ok, false);
});

test('rechaza los textos larguísimos', () => {
  assert.equal(con({ mensaje: 'a'.repeat(300) }).ok, false);
});

test('no revienta con basura', () => {
  for (const basura of [null, undefined, 'texto suelto', 42, []]) {
    const r = validarPlato(basura);
    assert.equal(typeof r.ok, 'boolean');
    if (r.ok) assert.equal(r.resultado.hayPlato, false);
  }
});

test('"no hay comida" y "no entendí la respuesta" no son lo mismo', () => {
  // Confundirlos sería lo peor: un fallo del modelo se le mostraría a la
  // persona como "en tu foto no hay comida", y no se reintentaría.
  const sinComida = validarPlato({ plato: null });
  assert.equal(sinComida.ok, true);
  assert.equal(sinComida.resultado.hayPlato, false);

  const ilegible = validarPlato(extraerJson('lo siento, no puedo ayudarte con eso'));
  assert.equal(ilegible.ok, false);
  assert.equal(ilegible.resultado, null);
});
