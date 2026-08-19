import test from 'node:test';
import assert from 'node:assert/strict';

import {
  diaDelPlan,
  resumenReto,
  esDescanso,
  porBloques,
  asomoDeEjercicios,
  versionMinima,
  avanceDeRutina,
  claveEjercicio,
} from '../src/services/plan.js';
import { interpolar } from '../src/services/texto.js';
import { guiaDe } from '../src/services/guias.js';
import { planDemo } from '../src/data/planDemo.js';

test('el plan demo cumple las reglas duras del producto', () => {
  assert.equal(planDemo.dias.length, 7, 'siete días');

  const suaves = planDemo.dias.filter((d) => d.tipo === 'descanso' || d.tipo === 'suave');
  assert.ok(suaves.length >= 2, 'mínimo dos días de descanso o suaves');

  for (const dia of planDemo.dias) {
    assert.ok(['entrenamiento', 'descanso', 'suave'].includes(dia.tipo));
    assert.ok(dia.comida_tip.length > 0, `${dia.dia} necesita tip de comida`);
    assert.ok(dia.mensaje.length > 0, `${dia.dia} necesita mensaje`);
    // Nunca calorías, macros ni cantidades exactas.
    assert.ok(
      !/calor[íi]a|macro|gramos|\bkcal\b/i.test(dia.comida_tip),
      `el tip de ${dia.dia} no puede hablar de calorías ni cantidades`,
    );
  }
});

test('diaDelPlan devuelve el día que corresponde a la fecha', () => {
  const jueves = new Date(2026, 7, 13);
  assert.equal(diaDelPlan(planDemo, jueves).dia, 'jueves');
});

test('diaDelPlan nunca deja la pantalla vacía', () => {
  assert.equal(diaDelPlan(null), null);
  assert.equal(diaDelPlan({ dias: [] }), null);

  // Plan incompleto: cae al primer día antes que devolver nada.
  const cojo = { dias: [{ dia: 'lunes', reto: 'x' }] };
  assert.equal(diaDelPlan(cojo, new Date(2026, 7, 13)).dia, 'lunes');
});

test('resumenReto omite la duración en días de descanso', () => {
  const descanso = planDemo.dias.find((d) => d.tipo === 'descanso');
  assert.equal(esDescanso(descanso), true);
  assert.equal(resumenReto(descanso, 'En casa'), 'En casa');
});

test('resumenReto junta duración y lugar', () => {
  const lunes = planDemo.dias[0];
  assert.equal(resumenReto(lunes, 'En casa'), `${lunes.duracion_min} min  ·  En casa`);
});

// --- Una rutina no es un ejercicio suelto ---------------------------------

test('el plan de arranque trae rutinas de verdad, no una línea por día', () => {
  // El plan demo es lo que la persona ve antes de que responda la IA y cuando
  // la IA falla. Si aquí hay un ejercicio por día, la app se siente vacía por
  // más bien que funcione el resto.
  const minimo = { entrenamiento: 3, suave: 2, descanso: 0 };

  for (const dia of planDemo.dias) {
    const cuantos = dia.ejercicios.length;
    assert.ok(
      cuantos >= minimo[dia.tipo],
      `${dia.dia} (${dia.tipo}) trae ${cuantos} y necesita ${minimo[dia.tipo]}`,
    );
    assert.ok(cuantos <= 6, `${dia.dia} trae demasiados`);
  }
});

test('cada ejercicio del plan de arranque tiene guía escrita a mano', () => {
  // Si alguien agrega un ejercicio sin guía, la persona abre "cómo se hace" y
  // recibe el consejo genérico. Esto lo avisa antes de que llegue al teléfono.
  for (const dia of planDemo.dias) {
    for (const e of dia.ejercicios) {
      assert.equal(guiaDe(e).esGenerica, false, `"${e.nombre}" (${dia.dia}) no tiene guía propia`);
    }
  }
});

test('el plan de arranque es sin impacto: no sabemos nada de quien lo recibe', () => {
  const impacto = /\b(salt\w*|brinc\w*|burpee\w*|correr|corriendo|carrera|trote|trotar|sprint\w*)\b/i;

  for (const dia of planDemo.dias) {
    for (const e of dia.ejercicios) {
      assert.ok(!impacto.test(`${e.nombre} ${e.detalle}`), `${e.nombre} tiene impacto`);
    }
  }
});

test('todo ejercicio del plan de arranque dice en qué bloque va', () => {
  for (const dia of planDemo.dias) {
    for (const e of dia.ejercicios) {
      assert.ok(
        ['calentamiento', 'principal', 'cierre'].includes(e.bloque),
        `${e.nombre} de ${dia.dia} tiene bloque "${e.bloque}"`,
      );
    }
  }
});

// --- Agrupar por bloques --------------------------------------------------

test('porBloques respeta el orden de la rutina', () => {
  const lunes = planDemo.dias[0];
  const bloques = porBloques(lunes);

  assert.deepEqual(
    bloques.map((b) => b.clave),
    ['calentamiento', 'principal', 'cierre'],
  );
  assert.ok(bloques.every((b) => b.titulo.length > 0));
});

test('el número que se ve es el de la rutina completa, no el del bloque', () => {
  // Quien va en el tercer ejercicio quiere ver un 3, no un 1 porque cambió
  // de bloque a la mitad.
  const numeros = porBloques(planDemo.dias[0]).flatMap((b) => b.ejercicios.map((e) => e.n));
  assert.deepEqual(numeros, [1, 2, 3, 4]);
});

test('un bloque vacío no se muestra', () => {
  const soloPrincipal = { ejercicios: [{ nombre: 'x', detalle: 'y', bloque: 'principal' }] };
  assert.deepEqual(
    porBloques(soloPrincipal).map((b) => b.clave),
    ['principal'],
  );
});

test('un plan viejo sin bloques se sigue viendo', () => {
  // Los planes guardados antes de que existieran los bloques no pueden
  // desaparecer de la pantalla.
  const viejo = { ejercicios: [{ nombre: 'Caminata', detalle: '10 minutos' }] };
  const bloques = porBloques(viejo);

  assert.equal(bloques.length, 1);
  assert.equal(bloques[0].clave, 'principal');
  assert.equal(bloques[0].ejercicios[0].n, 1);
});

test('porBloques no revienta sin día ni sin ejercicios', () => {
  assert.deepEqual(porBloques(undefined), []);
  assert.deepEqual(porBloques({}), []);
  assert.deepEqual(porBloques({ ejercicios: [] }), []);
});

// --- Lo que cabe en Hoy ---------------------------------------------------

test('Hoy muestra tres y manda el resto a la rutina', () => {
  const miercoles = planDemo.dias[2];
  const asomo = asomoDeEjercicios(miercoles);

  assert.equal(asomo.visibles.length, 3);
  assert.equal(asomo.restantes, miercoles.ejercicios.length - 3);
});

test('con tres o menos no sobra ninguno', () => {
  const martes = planDemo.dias[1];
  assert.equal(asomoDeEjercicios(martes).restantes, 0);
  assert.deepEqual(asomoDeEjercicios({ ejercicios: [] }), { visibles: [], restantes: 0 });
  assert.deepEqual(asomoDeEjercicios(undefined), { visibles: [], restantes: 0 });
});

// --- La rutina como lista para tachar ------------------------------------

const marcar = (dia, ...indices) =>
  Object.fromEntries(indices.map((i) => [claveEjercicio(dia, dia.ejercicios[i], i), true]));

test('cuenta cuántos ejercicios van tachados', () => {
  const dia = planDemo.dias[2]; // cinco ejercicios
  assert.deepEqual(avanceDeRutina(dia, {}), {
    hechos: 0,
    total: 5,
    fraccion: 0,
    completa: false,
  });

  const dos = avanceDeRutina(dia, marcar(dia, 0, 2));
  assert.equal(dos.hechos, 2);
  assert.equal(dos.completa, false);

  const todos = avanceDeRutina(dia, marcar(dia, 0, 1, 2, 3, 4));
  assert.equal(todos.completa, true);
  assert.equal(todos.fraccion, 1);
});

test('la clave lleva el nombre, no solo la posición', () => {
  // Si el plan cambia y los ejercicios se corren de sitio, lo tachado no se
  // puede pasar al ejercicio equivocado.
  const dia = planDemo.dias[0];
  const clave = claveEjercicio(dia, dia.ejercicios[1], 1);

  assert.ok(clave.includes(dia.ejercicios[1].nombre));
  assert.notEqual(clave, claveEjercicio(dia, dia.ejercicios[2], 2));
});

test('un día de descanso no tiene nada que tachar', () => {
  const descanso = planDemo.dias.find((d) => d.tipo === 'descanso');
  assert.deepEqual(avanceDeRutina(descanso, {}), {
    hechos: 0,
    total: 0,
    fraccion: 0,
    completa: false,
  });
  assert.equal(avanceDeRutina(undefined, {}).total, 0);
});

test('lo tachado no decide si el día cuenta', () => {
  // Regla del producto: el día se marca con su botón. Si tachar ejercicios
  // decidiera si el día vale, dejar uno a medias se volvería una falta.
  const dia = planDemo.dias[0];
  const aMedias = avanceDeRutina(dia, marcar(dia, 0));

  assert.equal(aMedias.completa, false);
  assert.ok(aMedias.hechos > 0, 'y aun así se reconoce lo que sí hizo');
});

test('la versión mínima se queda con el primero, que es el más suave', () => {
  // "Hoy no puedo" tiene que dejar algo que se pueda hacer en dos minutos.
  // El primero es el calentamiento, que es exactamente eso.
  const minima = versionMinima(planDemo.dias[2]);

  assert.equal(minima.ejercicios.length, 1);
  assert.equal(minima.ejercicios[0].bloque, 'calentamiento');
  assert.equal(minima.duracion_min, 2);
});

test('interpolar rellena el nombre y no deja marcadores sueltos', () => {
  assert.equal(interpolar('{nombre}, ¿qué buscas?', { nombre: 'Ana' }), 'Ana, ¿qué buscas?');
  assert.equal(interpolar('{nombre}, hola', {}), ', hola', 'sin dato, no imprime la llave');
  assert.equal(interpolar(undefined, {}), undefined);
});
