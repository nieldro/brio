import { HABITOS, MAXIMO, ZONAS_HABITO } from '../data/habitos.js';
import { claveDia, diasEntreClaves } from './fecha.js';

// Los hábitos de Brío. Reglas puras, sin React ni red.
//
// La diferencia con el reto del día es que estos NO tienen racha. A propósito.
// Una racha por hábito son tres contadores más que pueden ponerse en cero, y
// para quien ya abandonó cinco apps, tres ceros el mismo día es la salida.
//
// Lo que sí se cuenta es cuántas veces se ha hecho en total. Ese número solo
// sube. Fallar un día no lo toca.

export { MAXIMO, ZONAS_HABITO };

export const catalogoDeHabitos = () =>
  ZONAS_HABITO.map((z) => ({
    ...z,
    habitos: HABITOS.filter((h) => h.zona === z.clave),
  })).filter((z) => z.habitos.length > 0);

export const habitoPorClave = (clave) => HABITOS.find((h) => h.clave === clave) ?? null;

// Los que la persona lleva, con su texto. Se ignoran las claves que ya no
// existen en el catálogo, en vez de dejar una casilla en blanco.
export function habitosElegidos(claves = []) {
  return claves.map(habitoPorClave).filter(Boolean);
}

export function puedeAgregar(claves = []) {
  return claves.length < MAXIMO;
}

// Alternar un hábito de la lista de elegidos. Si ya están los tres, no entra
// uno más: se dice, no se cambia el más viejo por sorpresa.
export function alternarElegido(claves = [], clave) {
  if (claves.includes(clave)) return claves.filter((c) => c !== clave);
  if (!puedeAgregar(claves)) return claves;
  return [...claves, clave];
}

// --- Lo hecho -------------------------------------------------------------
// `hechos` es { 'agua': ['2026-08-19', ...] }. Guardar las fechas y no un
// contador permite reconstruir todo si algún día se sincroniza mal.

export function estaHecho(hechos = {}, clave, fecha = new Date()) {
  return (hechos[clave] ?? []).includes(claveDia(fecha));
}

export function alternarHecho(hechos = {}, clave, fecha = new Date()) {
  const dia = claveDia(fecha);
  const dias = hechos[clave] ?? [];

  return {
    ...hechos,
    [clave]: dias.includes(dia) ? dias.filter((d) => d !== dia) : [dia, ...dias],
  };
}

export const vecesHecho = (hechos = {}, clave) => (hechos[clave] ?? []).length;

// Cuántos de los de hoy van marcados.
export function avanceDeHoy(claves = [], hechos = {}, fecha = new Date()) {
  const total = claves.length;
  const listos = claves.filter((c) => estaHecho(hechos, c, fecha)).length;
  return { hechos: listos, total, completo: total > 0 && listos === total };
}

// En cuántos de los últimos días se hizo. Es una proporción, no una racha:
// no se rompe, solo se mueve.
export function constancia(hechos = {}, clave, dias = 14, fecha = new Date()) {
  const hoy = claveDia(fecha);
  const recientes = (hechos[clave] ?? []).filter((d) => {
    const atras = diasEntreClaves(d, hoy);
    return atras >= 0 && atras < dias;
  });
  return recientes.length;
}

// Lo que Brío dice sobre un hábito. Nunca cuenta lo que faltó.
export function textoDeConstancia(veces, dias = 14) {
  if (veces === 0) return 'Cuando lo hagas, aquí lo vas a ver.';
  if (veces === 1) return 'Una vez. Así empieza todo.';
  if (veces >= dias) return 'Todos los días de las últimas dos semanas.';
  return `${veces} veces en las últimas dos semanas.`;
}

// El mensaje del día, según cuántos van.
export function frasePorAvance({ hechos, total, completo }) {
  if (total === 0) return 'Elige uno para empezar. Con uno basta.';
  if (completo) return total === 1 ? 'Hecho. Eso era todo.' : 'Los tres hechos. Buen día.';
  if (hechos === 0) return 'Cuando puedas. No hay prisa.';
  return `Vas ${hechos} de ${total}. Eso ya cuenta.`;
}
