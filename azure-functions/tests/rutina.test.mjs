import test from 'node:test';
import assert from 'node:assert/strict';

import {
  imc,
  nivelDeImpacto,
  enfoqueDe,
  instruccionesDeRutina,
  duracionMinima,
  MINIMO_EJERCICIOS,
  IMPACTO,
} from '../src/lib/rutina.js';

// --- IMC: se calcula, se usa y no sale de aquí ----------------------------

test('calcula el índice con centímetros o con metros', () => {
  assert.equal(Math.round(imc({ peso: 70, estatura: 170 })), 24);
  assert.equal(Math.round(imc({ peso: 70, estatura: 1.7 })), 24);
});

test('sin datos no hay índice, y no revienta', () => {
  assert.equal(imc({ peso: 70 }), null);
  assert.equal(imc({ estatura: 170 }), null);
  assert.equal(imc({ peso: 0, estatura: 170 }), null);
  assert.equal(imc({}), null);
  assert.equal(imc({ peso: 'setenta', estatura: 'alto' }), null);
});

// --- Nivel de impacto -----------------------------------------------------

test('quien pasa de 55 entrena sin impacto', () => {
  // Regla del documento, palabra por palabra.
  assert.equal(nivelDeImpacto({ edad: 56, peso: 65, estatura: 170 }), 'bajo');
  assert.equal(nivelDeImpacto({ edad: 55, peso: 65, estatura: 170 }), 'bajo');
  assert.equal(nivelDeImpacto({ edad: 54, peso: 65, estatura: 170 }), 'normal');
});

test('un índice alto también baja el impacto', () => {
  // No es un juicio sobre nadie: es que saltar con mucho peso encima de las
  // rodillas es una lesión esperando, y el documento ya lo pedía.
  assert.equal(nivelDeImpacto({ edad: 30, peso: 95, estatura: 170 }), 'bajo');
  assert.equal(nivelDeImpacto({ edad: 30, peso: 70, estatura: 170 }), 'normal');
});

test('sin estatura, el peso solo alcanza para avisar', () => {
  assert.equal(nivelDeImpacto({ edad: 30, peso: 110 }), 'bajo');
  assert.equal(nivelDeImpacto({ edad: 30, peso: 70 }), 'normal');
});

test('ante la duda, siempre bajo', () => {
  // Equivocarse hacia lo suave cuesta una semana aburrida. Equivocarse hacia
  // lo fuerte cuesta una lesión. La duda se resuelve siempre para el mismo lado.
  assert.equal(nivelDeImpacto({}), 'bajo');
  assert.equal(nivelDeImpacto(), 'bajo');
  assert.equal(nivelDeImpacto({ estatura: 170 }), 'bajo');
});

// --- Enfoque según lo que la persona quiere -------------------------------

test('cada objetivo del onboarding tiene su enfoque, y son distintos', () => {
  const perder = enfoqueDe('Perder peso');
  const musculo = enfoqueDe('Ganar músculo');
  const mejor = enfoqueDe('Sentirme mejor');
  const habito = enfoqueDe('Crear el hábito');

  assert.equal(new Set([perder, musculo, mejor, habito]).size, 4);
  assert.match(perder, /constancia|continuo/i);
  assert.match(musculo, /fuerza/i);
});

test('el objetivo se reconoce sin tildes y en cualquier caja', () => {
  assert.equal(enfoqueDe('ganar musculo'), enfoqueDe('Ganar músculo'));
  assert.equal(enfoqueDe('PERDER PESO'), enfoqueDe('Perder peso'));
});

test('un objetivo raro cae en el más suave en vez de dejar al modelo suelto', () => {
  assert.equal(enfoqueDe('volverme atleta olímpico'), enfoqueDe('Crear el hábito'));
  assert.equal(enfoqueDe(undefined), enfoqueDe('Crear el hábito'));
});

// --- El bloque que se le pega al prompt -----------------------------------

test('las instrucciones piden tres bloques y varios ejercicios', () => {
  const t = instruccionesDeRutina({ objetivo: 'Perder peso', tiempo: 20, impacto: 'normal' });

  assert.match(t, /calentamiento/);
  assert.match(t, /principal/);
  assert.match(t, /cierre/);
  assert.match(t, /NO es un solo ejercicio/i);
  assert.match(t, /20 minutos/);
});

test('con impacto bajo, la prohibición va explícita', () => {
  const t = instruccionesDeRutina({ objetivo: 'Perder peso', tiempo: 20, impacto: 'bajo' });

  assert.match(t, /PROHIBIDO/);
  assert.match(t, /salto/i);
  // Y no se le explica a la persona por qué: hablar de su peso rompe la regla 1.
  assert.match(t, /No menciones el peso/i);
});

test('con impacto normal no se habla de impacto', () => {
  const t = instruccionesDeRutina({ objetivo: 'Ganar músculo', tiempo: 30, impacto: 'normal' });
  assert.ok(!/PROHIBIDO/.test(t));
});

test('las instrucciones nunca sueltan el índice ni el peso a la salida', () => {
  // El número que decide el impacto no puede llegar al prompt: de ahí sale al
  // texto que lee la persona, y eso es exactamente la regla 1.
  for (const impacto of ['bajo', 'normal']) {
    const t = instruccionesDeRutina({ objetivo: 'Perder peso', tiempo: 20, impacto });
    assert.ok(!/imc|índice de masa|indice de masa/i.test(t), t);
  }
});

// --- El tiempo es un compromiso -------------------------------------------

test('un día de entrenamiento usa al menos la mitad del tiempo apartado', () => {
  // Devolver 12 minutos a quien apartó una hora se siente como que la app no
  // lo tomó en serio, y es lo que estaba pasando.
  assert.equal(duracionMinima(60, 'entrenamiento'), 30);
  assert.equal(duracionMinima(120, 'entrenamiento'), 60);
  assert.equal(duracionMinima(20, 'entrenamiento'), 10);
});

test('el día suave pide menos, pero pide', () => {
  assert.equal(duracionMinima(60, 'suave'), 18);
  assert.equal(duracionMinima(120, 'suave'), 36);
});

test('el descanso no tiene piso: descansar es parte del plan', () => {
  assert.equal(duracionMinima(120, 'descanso'), 0);
});

test('sin tiempo declarado no se inventa un piso', () => {
  assert.equal(duracionMinima(undefined, 'entrenamiento'), 0);
  assert.equal(duracionMinima(0, 'entrenamiento'), 0);
  assert.equal(duracionMinima('mucho', 'entrenamiento'), 0);
});

test('las instrucciones le dicen al modelo el rango, no solo el techo', () => {
  const t = instruccionesDeRutina({ objetivo: 'Ganar músculo', tiempo: 60, impacto: 'normal' });

  assert.match(t, /60 minutos/);
  assert.match(t, /entre 30 y 60/);
  assert.match(t, /NO recortando la duracion/i);
});

// --- Mínimos --------------------------------------------------------------

test('el descanso no lleva ejercicios y el entrenamiento lleva tres', () => {
  assert.equal(MINIMO_EJERCICIOS.descanso, 0);
  assert.equal(MINIMO_EJERCICIOS.suave, 2);
  assert.equal(MINIMO_EJERCICIOS.entrenamiento, 3);
});

test('el detector de impacto atrapa las conjugaciones, no solo el infinitivo', () => {
  for (const t of ['saltos', 'saltando', 'burpees', 'corriendo', 'trotar', 'sprints']) {
    assert.ok(IMPACTO.test(t), `debería atrapar "${t}"`);
  }
});

test('el detector no confunde palabras que solo se parecen', () => {
  for (const t of ['resalta el desnivel', 'sobresale', 'recorrido corto', 'carrete']) {
    assert.ok(!IMPACTO.test(t), `no debería atrapar "${t}"`);
  }
});
