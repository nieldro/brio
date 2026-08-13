// Lecturas sobre el plan semanal. Puras, sin estado.
// Aceptan el mismo jsonb que guardará `planes.plan` en Supabase.

import { nombreDia } from './fecha';

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
