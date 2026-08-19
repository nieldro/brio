// Lecturas sobre el plan semanal. Puras, sin estado.
// Aceptan el mismo jsonb que guardará `planes.plan` en Supabase.

import { nombreDia } from './fecha.js';

// Devuelve el día del plan que corresponde a la fecha dada.
// Si el plan viniera incompleto, cae al primer día antes que dejar la pantalla vacía.
export function diaDelPlan(plan, fecha = new Date()) {
  if (!plan?.dias?.length) return null;
  const hoy = nombreDia(fecha);
  return plan.dias.find((d) => d.dia === hoy) ?? plan.dias[0];
}

// Texto corto bajo el título del reto: "10 min · En casa".
export function resumenReto(dia, lugar) {
  const partes = [];
  if (dia?.duracion_min > 0) partes.push(`${dia.duracion_min} min`);
  if (lugar) partes.push(lugar);
  return partes.join('  ·  ');
}

export function esDescanso(dia) {
  return dia?.tipo === 'descanso';
}

// Los tres bloques de una rutina, con el nombre que ve el usuario.
// El orden de esta lista ES el orden en que se entrena.
export const BLOQUES = [
  { clave: 'calentamiento', titulo: 'para entrar en calor' },
  { clave: 'principal', titulo: 'el trabajo de hoy' },
  { clave: 'cierre', titulo: 'para cerrar' },
];

// Agrupa los ejercicios del día en bloques, conservando el número que le
// toca a cada uno en la rutina completa: quien va en el tercero quiere ver
// un 3, no un 1 porque cambió de bloque.
//
// Los planes viejos y cualquier ejercicio sin bloque caen en 'principal',
// así que un plan guardado antes de que existieran los bloques se sigue
// viendo bien en vez de desaparecer.
export function porBloques(dia) {
  const conNumero = (dia?.ejercicios ?? []).map((e, i) => ({ ...e, n: i + 1 }));

  return BLOQUES.map((b) => ({
    ...b,
    ejercicios: conNumero.filter((e) => (e.bloque ?? 'principal') === b.clave),
  })).filter((b) => b.ejercicios.length > 0);
}

// Lo que se muestra en Hoy. La tarjeta del reto no puede crecer sin límite:
// con cinco ejercicios dentro, el botón "Listo por hoy" queda fuera de la
// pantalla, y ese botón es lo único que la persona tiene que alcanzar.
export function asomoDeEjercicios(dia, cuantos = 3) {
  const todos = dia?.ejercicios ?? [];
  return { visibles: todos.slice(0, cuantos), restantes: Math.max(0, todos.length - cuantos) };
}

// La versión mínima del día, para el botón "hoy no puedo".
//
// Lo que hace abandonar a la gente no es la falta de ganas: es el todo o nada.
// Si no alcanzan los 20 minutos, no se hace nada, y al tercer día la persona
// desaparece. Esto le quita a la app el poder de romperle la semana: se queda
// el primer ejercicio, un par de minutos, y el día CUENTA igual.
export function versionMinima(dia) {
  if (!dia) return null;

  const primero = dia.ejercicios?.[0] ?? null;
  const duracion = Math.min(2, dia.duracion_min > 0 ? dia.duracion_min : 2);

  return {
    ...dia,
    reto: primero ? primero.nombre : dia.reto,
    duracion_min: duracion,
    ejercicios: primero ? [primero] : [],
    minima: true,
    mensaje: 'Dos minutos y ya está. Cuenta igual que el día completo.',
  };
}
