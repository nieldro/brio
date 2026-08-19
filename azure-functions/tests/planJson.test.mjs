import test from 'node:test';
import assert from 'node:assert/strict';

import { extraerJson, validarPlan } from '../src/lib/planJson.js';

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// Una rutina de verdad, con sus tres bloques. Este ejemplo tenía UN ejercicio
// por día y por eso las pruebas dejaban pasar planes de una sola línea, que
// era justo el problema real que se veía en la app.
const RUTINA = [
  { bloque: 'calentamiento', nombre: 'Movilidad articular', detalle: '2 minutos' },
  { bloque: 'principal', nombre: 'Caminata', detalle: '6 minutos a paso cómodo' },
  { bloque: 'principal', nombre: 'Sentadilla a la silla', detalle: '2 series de 8' },
  { bloque: 'cierre', nombre: 'Estiramiento', detalle: '2 minutos' },
];

// Plan mínimo válido: 5 de entrenamiento y 2 de descanso.
function planBueno(cambios = {}) {
  return {
    semana: 1,
    nivel: 'inicio',
    mensaje_semana: 'Esta semana solo construimos el arranque.',
    dias: DIAS.map((dia, i) => ({
      dia,
      tipo: i >= 5 ? 'descanso' : 'entrenamiento',
      reto: `Reto de ${dia}`,
      duracion_min: i >= 5 ? 0 : 10,
      ejercicios: i >= 5 ? [] : RUTINA.map((e) => ({ ...e })),
      comida_tip: 'Agrega un vaso de agua al despertar',
      mensaje: 'Hoy solo arrancamos. Con eso basta.',
    })),
    ...cambios,
  };
}

// --- extraerJson ----------------------------------------------------------

test('extraerJson lee JSON limpio', () => {
  assert.deepEqual(extraerJson('{"a":1}'), { a: 1 });
});

test('extraerJson quita las comillas de markdown que el modelo suele meter', () => {
  assert.deepEqual(extraerJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extraerJson('```\n{"a":1}\n```'), { a: 1 });
});

test('extraerJson ignora el texto que sobra alrededor', () => {
  assert.deepEqual(extraerJson('Claro, aquí tienes:\n{"a":1}\nEspero te sirva.'), { a: 1 });
});

test('extraerJson devuelve null cuando no hay JSON', () => {
  assert.equal(extraerJson('lo siento, no puedo'), null);
  assert.equal(extraerJson('{roto'), null);
  assert.equal(extraerJson(null), null);
});

// --- validarPlan ----------------------------------------------------------

test('un plan correcto pasa', () => {
  const r = validarPlan(planBueno(), { tiempoMax: 20 });
  assert.equal(r.ok, true, r.errores.join('; '));
  assert.equal(r.plan.dias.length, 7);
});

test('rechaza un plan que no tenga siete días', () => {
  const corto = planBueno();
  corto.dias = corto.dias.slice(0, 5);
  const r = validarPlan(corto, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.match(r.errores[0], /7 días/);
});

test('rechaza menos de dos días de descanso o suaves', () => {
  const duro = planBueno();
  duro.dias.forEach((d) => {
    d.tipo = 'entrenamiento';
    d.duracion_min = 10;
    d.ejercicios = RUTINA.map((e) => ({ ...e }));
  });
  const r = validarPlan(duro, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /mínimo 2 días/.test(e)));
});

test('rechaza un día más largo que el tiempo del usuario', () => {
  const largo = planBueno();
  largo.dias[0].duracion_min = 45;
  const r = validarPlan(largo, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /45 min supera/.test(e)));
});

test('rechaza un día que desperdicia el tiempo que la persona apartó', () => {
  // Quien aparta una hora y recibe doce minutos siente que la app no lo tomó
  // en serio. El techo ya estaba; faltaba el piso.
  const corto = planBueno();
  corto.dias[0].duracion_min = 12;

  const r = validarPlan(corto, { tiempoMax: 60 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /se queda corto/.test(e)), r.errores.join('; '));
});

test('el día de descanso puede durar cero aunque haya dos horas apartadas', () => {
  const conDescanso = planBueno();
  const r = validarPlan(conDescanso, { tiempoMax: 120 });

  assert.ok(
    !r.errores.some((e) => /sábado|domingo/.test(e) && /se queda corto/.test(e)),
    r.errores.join('; '),
  );
});

// Un plan pensado para alguien que apartó una hora: los cinco días de
// entrenamiento la aprovechan.
const planDeUnaHora = () => {
  const p = planBueno();
  p.dias.forEach((d) => {
    if (d.tipo === 'entrenamiento') d.duracion_min = 55;
  });
  return p;
};

test('el día suave tiene un piso más bajo que el de entrenamiento', () => {
  const suave = planDeUnaHora();
  suave.dias[0].tipo = 'suave';
  suave.dias[0].duracion_min = 20; // 33% de 60: pasa el piso suave (18)
  suave.dias[0].ejercicios = suave.dias[0].ejercicios.slice(0, 2);
  assert.equal(validarPlan(suave, { tiempoMax: 60 }).ok, true, 'el suave de 20 debería pasar');

  const entrena = planDeUnaHora();
  entrena.dias[0].duracion_min = 20; // 33% de 60: NO pasa el piso de entrenamiento (30)
  assert.equal(validarPlan(entrena, { tiempoMax: 60 }).ok, false);
});

test('rechaza tips con calorías, cantidades o ayuno', () => {
  for (const tip of [
    'Cuenta las calorías del almuerzo',
    'Come 200 gramos de pollo',
    'Prueba el ayuno de 16 horas',
    'Controla tus macros del día',
  ]) {
    const malo = planBueno();
    malo.dias[0].comida_tip = tip;
    const r = validarPlan(malo, { tiempoMax: 20 });
    assert.equal(r.ok, false, `debió rechazar: ${tip}`);
  }
});

test('rechaza textos con palabras prohibidas', () => {
  const culposo = planBueno();
  culposo.dias[2].mensaje = 'Sin dolor no hay resultado, no pongas excusas.';
  const r = validarPlan(culposo, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /excusas|sin dolor/i.test(e)));
});

test('rechaza tipos y días inválidos o repetidos', () => {
  const raro = planBueno();
  raro.dias[0].tipo = 'cardio_extremo';
  raro.dias[1].dia = 'lunes';
  const r = validarPlan(raro, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /tipo inválido/.test(e)));
  assert.ok(r.errores.some((e) => /repetido/.test(e)));
});

// --- La rutina no es un ejercicio suelto ----------------------------------

test('exige ejercicios en los días que no son descanso', () => {
  const vacio = planBueno();
  vacio.dias[0].ejercicios = [];
  const r = validarPlan(vacio, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /al menos 3 ejercicios/.test(e)), r.errores.join('; '));
});

test('un día de entrenamiento con un solo ejercicio no es una rutina', () => {
  // Este es el fallo que se veía en la app: el ejemplo del prompt traía un
  // ejercicio, el modelo copiaba el ejemplo, y "tu rutina de hoy" era una línea.
  const flaco = planBueno();
  flaco.dias[0].ejercicios = [{ nombre: 'Caminata', detalle: '10 minutos' }];
  const r = validarPlan(flaco, { tiempoMax: 20 });

  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /necesita al menos 3 ejercicios y trae 1/.test(e)));
});

test('un día suave se conforma con dos, pero no con uno', () => {
  const uno = planBueno();
  uno.dias[0].tipo = 'suave';
  uno.dias[0].ejercicios = [{ nombre: 'Estiramiento', detalle: '5 minutos' }];
  assert.equal(validarPlan(uno, { tiempoMax: 20 }).ok, false);

  const dos = planBueno();
  dos.dias[0].tipo = 'suave';
  dos.dias[0].ejercicios = [
    { nombre: 'Respiración', detalle: '3 minutos' },
    { nombre: 'Estiramiento', detalle: '5 minutos' },
  ];
  assert.equal(validarPlan(dos, { tiempoMax: 20 }).ok, true);
});

test('rechaza un día con más ejercicios de los que caben', () => {
  const lleno = planBueno();
  lleno.dias[0].ejercicios = Array.from({ length: 9 }, (_, i) => ({
    nombre: `Ejercicio ${i}`,
    detalle: '1 minuto',
  }));
  const r = validarPlan(lleno, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /no caben en un día/.test(e)));
});

test('cada ejercicio necesita nombre y detalle', () => {
  const sinDetalle = planBueno();
  sinDetalle.dias[0].ejercicios[1] = { nombre: 'Caminata' };
  assert.equal(validarPlan(sinDetalle, { tiempoMax: 20 }).ok, false);

  const sinNombre = planBueno();
  sinNombre.dias[0].ejercicios[1] = { detalle: '6 minutos' };
  assert.equal(validarPlan(sinNombre, { tiempoMax: 20 }).ok, false);
});

test('rechaza un bloque inventado', () => {
  const raro = planBueno();
  raro.dias[0].ejercicios[0].bloque = 'explosivo';
  const r = validarPlan(raro, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /bloque inválido/.test(e)));
});

// --- Impacto bajo: es seguridad, no preferencia ---------------------------

test('con impacto bajo no pasa ningún salto ni carrera', () => {
  for (const nombre of [
    'Saltos de tijera',
    'Burpees',
    'Correr en el sitio',
    'Trote suave',
    'Sprints cortos',
    'Salto a la cuerda',
  ]) {
    const malo = planBueno();
    malo.dias[0].ejercicios[1] = { bloque: 'principal', nombre, detalle: '3 series de 10' };
    const r = validarPlan(malo, { tiempoMax: 20, impacto: 'bajo' });

    assert.equal(r.ok, false, `debió rechazar: ${nombre}`);
    assert.ok(r.errores.some((e) => /sin impacto/.test(e)), r.errores.join('; '));
  }
});

test('el impacto también se busca en el detalle y en el reto', () => {
  const enDetalle = planBueno();
  enDetalle.dias[0].ejercicios[1].detalle = 'Camina y cada minuto haz 10 saltos';
  assert.equal(validarPlan(enDetalle, { tiempoMax: 20, impacto: 'bajo' }).ok, false);

  const enReto = planBueno();
  enReto.dias[0].reto = 'Día de saltos';
  assert.equal(validarPlan(enReto, { tiempoMax: 20, impacto: 'bajo' }).ok, false);
});

test('sin restricción de impacto, saltar está permitido', () => {
  const conSaltos = planBueno();
  conSaltos.dias[0].ejercicios[1] = {
    bloque: 'principal',
    nombre: 'Saltos de tijera',
    detalle: '2 series de 15',
  };
  assert.equal(validarPlan(conSaltos, { tiempoMax: 20 }).ok, true);
});

test('una palabra que solo se parece a un salto no se confunde', () => {
  // "resalta" y "sobresalto" llevan las mismas letras; el límite de palabra
  // es lo que evita rechazar un plan bueno por parecido.
  const bueno = planBueno();
  bueno.dias[0].ejercicios[1].detalle = 'Camina donde resalta el desnivel';
  assert.equal(validarPlan(bueno, { tiempoMax: 20, impacto: 'bajo' }).ok, true);
});

test('normaliza el color del semáforo que el formato no incluye', () => {
  const r = validarPlan(planBueno(), { tiempoMax: 20 });
  assert.equal(r.plan.dias[0].comida_color, 'verde');

  const conColor = planBueno();
  conColor.dias[0].comida_color = 'ambar';
  conColor.dias[1].comida_color = 'fucsia';
  const r2 = validarPlan(conColor, { tiempoMax: 20 });
  assert.equal(r2.plan.dias[0].comida_color, 'ambar');
  assert.equal(r2.plan.dias[1].comida_color, 'verde', 'un color inventado cae a verde');
});

test('deduce el bloque cuando el modelo no lo manda', () => {
  // Un plan guardado antes de que existieran los bloques se tiene que seguir
  // viendo bien. Rechazarlo costaría un reintento entero por nada.
  const sinBloques = planBueno();
  sinBloques.dias[0].ejercicios = [
    { nombre: 'Movilidad', detalle: '2 minutos' },
    { nombre: 'Caminata', detalle: '6 minutos' },
    { nombre: 'Estiramiento', detalle: '2 minutos' },
  ];

  const r = validarPlan(sinBloques, { tiempoMax: 20 });
  assert.equal(r.ok, true, r.errores.join('; '));
  assert.deepEqual(
    r.plan.dias[0].ejercicios.map((e) => e.bloque),
    ['calentamiento', 'principal', 'cierre'],
  );
});

test('un día de descanso sale sin ejercicios aunque el modelo le ponga', () => {
  const contradictorio = planBueno();
  contradictorio.dias[5].ejercicios = [{ nombre: 'Caminata', detalle: '10 minutos' }];

  const r = validarPlan(contradictorio, { tiempoMax: 20 });
  assert.equal(r.ok, true, r.errores.join('; '));
  assert.deepEqual(r.plan.dias[5].ejercicios, []);
});

// --- Ortografía del modelo ------------------------------------------------

test('acepta los días sin tilde y los devuelve con tilde', () => {
  // Los modelos escriben "miercoles" y "sabado" la mitad de las veces. El plan
  // entero se estaba rechazando por dos acentos, y ese plan era bueno.
  const sinTildes = planBueno();
  sinTildes.dias[2].dia = 'miercoles';
  sinTildes.dias[5].dia = 'sabado';

  const r = validarPlan(sinTildes, { tiempoMax: 20 });
  assert.equal(r.ok, true, r.errores.join('; '));

  // Y salen con tilde: la app busca "miércoles" para saber qué toca hoy.
  assert.equal(r.plan.dias[2].dia, 'miércoles');
  assert.equal(r.plan.dias[5].dia, 'sábado');
});

test('acepta mayúsculas en día, tipo y bloque', () => {
  const gritado = planBueno();
  gritado.dias[0].dia = 'Lunes';
  gritado.dias[0].tipo = 'Entrenamiento';
  gritado.dias[0].ejercicios[0].bloque = 'Calentamiento';

  const r = validarPlan(gritado, { tiempoMax: 20 });
  assert.equal(r.ok, true, r.errores.join('; '));
  assert.equal(r.plan.dias[0].dia, 'lunes');
  assert.equal(r.plan.dias[0].tipo, 'entrenamiento');
  assert.equal(r.plan.dias[0].ejercicios[0].bloque, 'calentamiento');
});

test('el día repetido se detecta aunque venga escrito distinto', () => {
  // "sabado" y "sábado" son el mismo día: si se cuelan los dos, falta uno.
  const repetido = planBueno();
  repetido.dias[5].dia = 'sabado';
  repetido.dias[6].dia = 'sábado';

  const r = validarPlan(repetido, { tiempoMax: 20 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /repetido/.test(e)), r.errores.join('; '));
});

test('un nombre que no es un día sigue siendo inválido', () => {
  const raro = planBueno();
  raro.dias[0].dia = 'lunesito';
  assert.equal(validarPlan(raro, { tiempoMax: 20 }).ok, false);
});

test('no revienta con basura', () => {
  assert.equal(validarPlan(null, { tiempoMax: 20 }).ok, false);
  assert.equal(validarPlan('hola', { tiempoMax: 20 }).ok, false);
  assert.equal(validarPlan({}, { tiempoMax: 20 }).ok, false);
});
