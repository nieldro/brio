import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectarRiesgo,
  respuestaDeRiesgo,
  notaDeRiesgo,
  LINEAS,
  NIVELES_QUE_CORTAN,
} from '../src/lib/riesgo.js';

// La pieza más delicada del producto. Estas pruebas valen tanto por lo que
// detectan como por lo que NO detectan: un falso positivo que le suelta una
// línea de crisis a alguien que solo tenía pereza rompe la confianza, y quien
// cierra la app no vuelve el día que sí lo necesite.

const nivelDe = (texto) => detectarRiesgo(texto).nivel;

// --- ideación -------------------------------------------------------------

test('reconoce las ideas de no querer seguir', () => {
  const dichos = [
    'ya no quiero vivir',
    'no quiero seguir',
    'quiero desaparecer',
    'a veces pienso en quitarme la vida',
    'me quiero morir',
    'estoy pensando en matarme',
    'todos estarían mejor sin mí',
    'no le veo sentido a la vida',
    'para qué sigo aquí',
    'quiero acabar con todo',
    'ganas de no despertar',
    'la vida no vale la pena',
  ];

  for (const dicho of dichos) {
    assert.equal(nivelDe(dicho), 'ideacion', `no vio la señal en: "${dicho}"`);
  }
});

test('reconoce la ideación dicha de lado', () => {
  // Casi nadie lo escribe de frente. Sale en tercera persona, en condicional
  // o como un deseo, y sigue siendo exactamente la misma señal.
  const dichos = [
    'a veces pienso que sería mejor no despertar',
    'ojalá no despertara mañana',
    'todo estaría mejor si yo no estuviera',
    'estoy cansado de vivir',
    'no le encuentro sentido a la vida',
  ];

  for (const dicho of dichos) {
    assert.equal(nivelDe(dicho), 'ideacion', `no vio la señal en: "${dicho}"`);
  }
});

test('la ideación llega escrita sin tildes y en mayúsculas', () => {
  // Quien escribe a las tres de la mañana no pone tildes.
  assert.equal(nivelDe('YA NO QUIERO SEGUIR'), 'ideacion');
  assert.equal(nivelDe('quiero quitarme la vida'), 'ideacion');
  assert.equal(nivelDe('no le veo sentido a la vida'), 'ideacion');
});

test('la ideación corta la llamada a la IA', () => {
  assert.equal(detectarRiesgo('me quiero morir').corta, true);
});

// --- autolesión -----------------------------------------------------------

test('reconoce la autolesión', () => {
  const dichos = [
    'a veces me hago daño',
    'tengo ganas de cortarme',
    'me quiero hacer daño',
    'me corté a propósito anoche',
    'pienso en golpearme cuando me equivoco',
  ];

  for (const dicho of dichos) {
    assert.equal(nivelDe(dicho), 'autolesion', `no vio la señal en: "${dicho}"`);
  }
});

test('una lesión del entrenamiento no es autolesión', () => {
  // "Me hice daño en la rodilla" es una lesión, y confundirla con autolesión
  // sería contestarle a alguien con una línea de crisis por una rodilla.
  assert.notEqual(nivelDe('me hice daño en la rodilla haciendo sentadillas'), 'autolesion');
  assert.notEqual(nivelDe('me hice daño entrenando ayer'), 'autolesion');
});

test('cortarse el pelo o con un cuchillo no es autolesión', () => {
  assert.equal(nivelDe('hoy me corté el pelo y me siento distinto'), null);
  assert.equal(nivelDe('me corté con un cuchillo picando cebolla'), null);
});

// --- trastorno alimentario ------------------------------------------------

test('reconoce las señales de trastorno alimentario', () => {
  const dichos = [
    'después de comer me hago vomitar',
    'estoy tomando laxantes para no subir',
    'voy a dejar de comer',
    'llevo tres días sin comer',
    'no merezco comer hoy',
    'me da asco comer',
    'cada vez que como termino vomitando',
    'hago ayuno de dos días como castigo',
    'me castigo sin comer cuando fallo',
    'tuve un atracón y me odio',
    'no he comido nada desde el lunes',
  ];

  for (const dicho of dichos) {
    assert.equal(nivelDe(dicho), 'alimentario', `no vio la señal en: "${dicho}"`);
  }
});

test('lo alimentario tampoco llega a la IA', () => {
  assert.equal(detectarRiesgo('llevo tres días sin comer').corta, true);
});

test('querer comer menos harina no es un trastorno', () => {
  // Alguien diciendo lo que quiere cambiar de su comida no necesita que lo
  // deriven a un profesional. Eso lo contesta el coach.
  assert.equal(nivelDe('quiero dejar de comer tanta harina'), null);
  assert.equal(nivelDe('voy a dejar de comer dulces entre semana'), null);
  assert.equal(nivelDe('quiero dejar de comer tan tarde en la noche'), null);
  assert.equal(nivelDe('hago ayuno intermitente y me va bien'), null);
});

// --- dolor y lesión -------------------------------------------------------

test('reconoce el dolor agudo y la lesión', () => {
  const dichos = [
    'me duele mucho la rodilla',
    'sentí un dolor fuerte en la espalda',
    'se me dobló el tobillo',
    'no puedo apoyar el pie',
    'escuché un tronido en el hombro',
    'creo que me lesioné',
    'me duele el pecho desde ayer',
    'tengo una punzada en la cadera',
  ];

  for (const dicho of dichos) {
    assert.equal(nivelDe(dicho), 'dolor', `no vio la señal en: "${dicho}"`);
  }
});

test('las agujetas normales no son una lesión', () => {
  // Al día siguiente de entrenar duele, y eso es lo esperado. Mandar a un
  // profesional por eso enseñaría que moverse es peligroso.
  assert.equal(nivelDe('me duelen las piernas del entrenamiento de ayer'), null);
  assert.equal(nivelDe('quedé adolorido pero contento'), null);
});

// --- desánimo -------------------------------------------------------------

test('reconoce el desánimo y NO lo corta', () => {
  const dichos = [
    'me siento bajo',
    'estoy muy triste hoy',
    'no tengo ganas de nada',
    'todo me da igual',
    'no puedo más',
    'me odio',
    'siento que no sirvo para nada',
    'no quiero seguir así',
  ];

  for (const dicho of dichos) {
    const r = detectarRiesgo(dicho);
    assert.equal(r.nivel, 'desanimo', `no vio el desánimo en: "${dicho}"`);
    assert.equal(r.corta, false, `"${dicho}" no debería cortar la IA`);
  }
});

test('el desánimo sí pasa a la IA, con una nota', () => {
  const nota = notaDeRiesgo('desanimo');
  assert.match(nota, /valida primero/i);
  assert.match(nota, /no le pidas nada/i);
  assert.match(nota, /no le propongas rutina/i);
  assert.equal(notaDeRiesgo(null), '');
  assert.equal(notaDeRiesgo('dolor'), '');
});

// --- falsos positivos, que hacen tanto daño como los negativos ------------

test('las frases hechas con morir y matar no son señales', () => {
  const normales = [
    'me estoy muriendo de hambre',
    'me muero de sueño, ¿entrenamos mañana?',
    'me mata la pereza',
    'esa rutina me mató',
    'quedé muerto de cansancio',
    'me muero de la risa con tus mensajes',
    'estoy que me muero del frío',
    'esa clase estuvo de muerte',
    'no puedo más de la risa con eso',
    'me maté estudiando anoche',
    'este calor me está matando',
  ];

  for (const frase of normales) {
    assert.equal(nivelDe(frase), null, `"${frase}" es español normal, no una señal`);
  }
});

test('hablar del plan no es hablar de la vida', () => {
  // Esta prueba pasaba por construcción y no protegía nada. Usaba las cuatro
  // frases cuyos verbos ya estaban en la lista de exclusión del patrón, y
  // encima con `notEqual('ideacion')`, que habría tolerado que cayeran en
  // 'dolor' o en 'alimentario', que también cortan la conversación.
  //
  // Ahora usa verbos que NADIE previó, que es justo donde fallaba, y exige
  // null: cualquier nivel que corte es un fallo, porque a esta persona hay
  // que dejarla hablar con el coach.
  const normales = [
    'no quiero seguir con esta rutina',
    'no quiero seguir entrenando en la noche',
    '¿para qué sigo con el gym si no veo nada?',
    'ya no quiero seguir haciendo lo mismo',
    // Los que la lista cerrada dejaba pasar:
    'no quiero seguir hablando de eso',
    'no quiero seguir pagando el gym',
    'no quiero seguir posponiendo el entrenamiento',
    'no quiero seguir dependiendo de nadie',
    'no quiero seguir madrugando tanto',
    '¿para qué seguir así si no veo nada?',
  ];

  for (const frase of normales) {
    assert.equal(nivelDe(frase), null, `"${frase}" habla del plan, no de la vida`);
  }
});

test('la forma proclítica de matar también cuenta', () => {
  // Era el agujero más grave del detector: solo existía "matarme", así que
  // "me voy a matar" —que es como se dice hablando— devolvía null. Y el
  // borrado de modismos se llevaba "me mato" por delante antes de buscar
  // nada, así que esa forma era literalmente indetectable.
  const dichos = [
    'me voy a matar',
    'creo que me voy a matar',
    'me mato hoy',
    'me quiero matar',
    'voy a matarme',
    'ya no quiero estar en este mundo',
    'quiero irme de este mundo',
    'no le veo salida',
  ];

  for (const dicho of dichos) {
    assert.equal(nivelDe(dicho), 'ideacion', `no vio la señal en: "${dicho}"`);
  }
});

test('los modismos de matar siguen sin disparar nada', () => {
  // El arreglo de arriba no puede haberse comido las frases hechas: el
  // modismo siempre trae su sujeto, delante o detrás, y eso es lo que lo
  // separa de una intención.
  const normales = [
    'me mata la pereza',
    'esa rutina me mató',
    'este calor me está matando',
    'me maté estudiando anoche',
    'me mato trabajando toda la semana',
    'la subida de escaleras me mata',
  ];

  for (const frase of normales) {
    assert.equal(nivelDe(frase), null, `"${frase}" es español normal`);
  }
});

test('un logro con la comida no se confunde con una señal', () => {
  // Este era el peor de los falsos positivos: quien escribía "no he comido
  // nada frito esta semana" —literalmente un avance— recibía "lo que me
  // cuentas sobre la comida no lo puedo acompañar, busca a un profesional".
  const normales = [
    'no he comido nada frito esta semana',
    'no he comido nada de dulce hoy',
    'no he comido nada raro',
    'voy a dejar de comer tanta harina',
    'quiero dejar de comer de noche',
    'llevo dos días sin comer bien por el trabajo',
    'dejé de comer paquetes y me siento mejor',
  ];

  for (const frase of normales) {
    assert.equal(nivelDe(frase), null, `"${frase}" es un avance, no una alarma`);
  }
});

test('nombrar la palabra lesión no deja a nadie sin coach', () => {
  // "Lesión" a secas cortaba la conversación en cualquier tiempo verbal, así
  // que preguntar cómo evitar una devolvía un texto enlatado que no
  // respondía la pregunta.
  const normales = [
    '¿cómo evito una lesión en la rodilla?',
    'tuve una lesión hace dos años',
    'esa lesión ya sanó',
    'me lesioné el año pasado, ¿puedo entrenar igual?',
    'mi mamá tuvo una lesión y quiero ayudarla',
  ];

  for (const frase of normales) {
    assert.equal(nivelDe(frase), null, `"${frase}" no es una lesión de ahora`);
  }
});

test('se me fue el día no es una torcedura', () => {
  // "Se me fue" estaba en la lista de dolor, y es de lo más común en un chat
  // de hábitos. Toda esa gente recibía "hoy paramos, que lo mire un
  // profesional" y su mensaje ni llegaba al coach.
  const normales = [
    'se me fue el día y no entrené',
    'se me fue la hora',
    'se me fue la motivación esta semana',
    'se me fue el bus y llegué tarde',
  ];

  for (const frase of normales) {
    assert.equal(nivelDe(frase), null, `"${frase}" no habla del cuerpo`);
  }

  // Pero una torcedura de verdad sí.
  assert.equal(nivelDe('se me dobló el tobillo bajando'), 'dolor');
  assert.equal(nivelDe('se me zafó el hombro'), 'dolor');
});

test('un dolor que no es del entrenamiento no corta la conversación', () => {
  assert.equal(nivelDe('me duele mucho la cabeza hoy'), null);
  assert.equal(nivelDe('me duele mucho el orgullo'), null);

  // El del cuerpo entrenando sí.
  assert.equal(nivelDe('me duele mucho la rodilla desde ayer'), 'dolor');
  assert.equal(nivelDe('me duele el pecho'), 'dolor');
});

test('vomitar lo que como sí se ve', () => {
  // La rama que lo cubría era inalcanzable por un error de regex: "com"
  // seguido de vocal nunca produce un límite de palabra. Es una señal de
  // manual que el detector no veía.
  assert.equal(nivelDe('vomito lo que como'), 'alimentario');
});

test('un mensaje cualquiera no dispara nada', () => {
  // Un día normal de conversación con Brío, de punta a punta. Si algo de esto
  // levanta una alarma, la app se vuelve incómoda de usar y la persona deja
  // de escribir justo antes del día en que sí habría que leerla.
  const normales = [
    'hola, ¿cómo va todo?',
    'ya hice el reto de hoy',
    '¿me cambias el ejercicio de mañana?',
    'ayer no pude, hoy sí',
    'gracias, me sirvió mucho',
    'me da pereza levantarme temprano',
    'quiero bajar de peso pero sin sufrir',
    'ayer comí mucho en el almuerzo familiar',
    'no desayuné hoy porque salí corriendo',
    'no como carne, ¿el plan sirve igual?',
    'me pesé y no bajé nada',
    'llevo dos semanas sin entrenar',
    'perdí la racha y me dio rabia',
    'no puedo con las flexiones todavía',
    'esa sentadilla está durísima',
    'me corté la barba y me veo raro',
    'tengo hambre a toda hora',
    'me salté el almuerzo por una reunión',
    '',
    '   ',
  ];

  for (const frase of normales) {
    assert.equal(nivelDe(frase), null, `"${frase}" no debería disparar nada`);
  }
});

test('no revienta con lo que no es texto', () => {
  assert.deepEqual(detectarRiesgo(null), { nivel: null, corta: false });
  assert.deepEqual(detectarRiesgo(undefined), { nivel: null, corta: false });
  assert.deepEqual(detectarRiesgo(42), { nivel: null, corta: false });
});

// --- prioridad ------------------------------------------------------------

test('lo más grave manda', () => {
  // Quien escribe que no quiere seguir y que le duele la rodilla no necesita
  // que le hablen de la rodilla.
  assert.equal(nivelDe('me duele mucho la rodilla y ya no quiero vivir'), 'ideacion');
  assert.equal(nivelDe('estoy muy triste y llevo tres días sin comer'), 'alimentario');
  assert.equal(nivelDe('me siento vacío y me quiero hacer daño'), 'autolesion');
});

// --- las respuestas escritas a mano ---------------------------------------

const PROHIBIDAS = [
  'fracaso',
  'excusas',
  'deberías',
  'quemar grasa',
  'cuerpo ideal',
  'sin dolor no hay resultado',
];

// "listo" y "lista" suponen el género de quien lee.
const GENERO = /\blist[oa]\b|\bcansad[oa]\b|\bseguro?\b|\bbienvenid[oa]\b/i;

function revisarVoz(texto, etiqueta) {
  assert.ok(texto && texto.length > 60, `${etiqueta}: la respuesta viene vacía o coja`);
  assert.ok(!/[!¡]/.test(texto), `${etiqueta}: grita`);
  assert.ok(!GENERO.test(texto), `${etiqueta}: supone el género`);

  const bajo = texto.toLowerCase();
  for (const mala of PROHIBIDAS) {
    assert.ok(!bajo.includes(mala), `${etiqueta}: usa "${mala}"`);
  }
  // Tutea: nada de "usted".
  assert.ok(!/\busted\b/i.test(texto), `${etiqueta}: trata de usted`);
}

test('la respuesta de crisis da las líneas reales y no promete que resuelven', () => {
  for (const nivel of ['ideacion', 'autolesion']) {
    const texto = respuestaDeRiesgo(nivel, 'Daniel');
    revisarVoz(texto, nivel);

    assert.match(texto, /^Daniel,/);
    assert.ok(texto.includes(LINEAS.bogota), `${nivel}: falta la línea de Bogotá`);
    assert.ok(texto.includes(LINEAS.nacional), `${nivel}: falta la línea nacional`);
    assert.match(texto, /opción 4/, `${nivel}: falta la opción de la línea nacional`);
    assert.match(texto, /confianza/, `${nivel}: no dice que hablarlo con alguien sirve`);
    assert.match(texto, /no te prometo/i, `${nivel}: promete que la llamada lo arregla`);
  }
});

test('la respuesta de crisis no propone ejercicio ni diagnostica', () => {
  const texto = respuestaDeRiesgo('ideacion', 'Daniel');

  const PROPONE = /\brutina\b|\breto\b|\bejercicios?\b|entren|camina|\bminutos\b|movimiento/i;
  assert.ok(!PROPONE.test(texto), 'está proponiendo movimiento a alguien en crisis');

  const DIAGNOSTICA = /depresi|trastorno|enfermedad|diagn[óo]stic|s[íi]ndrome|tienes un/i;
  assert.ok(!DIAGNOSTICA.test(texto), 'está diagnosticando');
});

test('la derivación por comida no opina del cuerpo ni de la comida', () => {
  const texto = respuestaDeRiesgo('alimentario', 'Daniel');
  revisarVoz(texto, 'alimentario');

  assert.match(texto, /profesional de la salud/, 'no deriva a nadie');
  assert.ok(texto.includes(LINEAS.nacional), 'no dice a dónde llamar');

  const OPINA = /calor[íi]as|kilos|gordo|flaco|adelgaz|dieta|engorda|est[áa] mal/i;
  assert.ok(!OPINA.test(texto), 'opina sobre la comida o el cuerpo');

  const PROPONE = /\brutina\b|\breto\b|\bminutos\b|\bejercicios?\b/i;
  assert.ok(!PROPONE.test(texto), 'propone entrenar a quien habló de comida');
});

test('la respuesta al dolor manda parar y no propone rutina hoy', () => {
  const texto = respuestaDeRiesgo('dolor', 'Daniel');
  revisarVoz(texto, 'dolor');

  assert.match(texto, /hoy paramos/i, 'no manda parar');
  assert.match(texto, /profesional de la salud/, 'no deriva a nadie');

  // Con límites de palabra: "retomamos" lleva "reto" dentro y no propone nada.
  const PROPONE = /\brutina\b|\breto\b|\bminutos\b|\bejercicios?\b|\bseries\b|\brepeticiones\b/i;
  assert.ok(!PROPONE.test(texto), 'propone rutina el día de la lesión');

  const DIAGNOSTICA = /esguince|desgarro|tendinitis|tienes un/i;
  assert.ok(!DIAGNOSTICA.test(texto), 'está diagnosticando');
});

test('sin nombre la frase sigue bien escrita', () => {
  for (const nivel of NIVELES_QUE_CORTAN) {
    const texto = respuestaDeRiesgo(nivel, null);
    revisarVoz(texto, nivel);
    assert.ok(!texto.startsWith(','), `${nivel}: empieza con una coma suelta`);
    assert.match(texto, /^[A-ZÁÉÍÓÚ]/, `${nivel}: no arranca con mayúscula`);
  }
});

test('el desánimo no tiene respuesta enlatada', () => {
  // Quien vino a hablar con alguien no puede recibir una plantilla.
  assert.equal(respuestaDeRiesgo('desanimo', 'Daniel'), null);
  assert.equal(respuestaDeRiesgo(null, 'Daniel'), null);
});

test('todo nivel que corta tiene texto propio', () => {
  // Un nivel en la lista sin respuesta escrita dejaría a alguien mirando el
  // mensaje de "no pude conectarme" en el peor momento.
  for (const nivel of NIVELES_QUE_CORTAN) {
    assert.ok(respuestaDeRiesgo(nivel, 'Daniel'), `${nivel} corta la IA y no tiene texto`);
  }
});
