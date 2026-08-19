import { claveDia, claveAyer } from './fecha.js';

// La métrica que ninguna otra app lleva.
//
// Todas cuentan días seguidos. Cuando se rompe la racha, el contador vuelve a
// cero y le dice a la persona, sin palabras, que fracasó. Para alguien que ya
// abandonó cinco apps, ese cero es la sexta confirmación de lo mismo.
//
// Brío cuenta otra cosa: cuántas veces VOLVIÓ. Volver después de parar es más
// difícil que seguir, y es exactamente lo que nadie le ha celebrado nunca.

const DIA_MS = 86_400_000;

function aFecha(clave) {
  const [a, m, d] = clave.split('-').map(Number);
  return Date.UTC(a, m - 1, d);
}

function diasEntre(claveA, claveB) {
  return Math.round((aFecha(claveB) - aFecha(claveA)) / DIA_MS);
}

// Un regreso es un día marcado después de haber parado al menos un día.
// El primer día de todos no cuenta: eso es empezar, no volver.
export function contarRegresos(diasCompletados = []) {
  const dias = [...new Set(diasCompletados)].sort();
  let regresos = 0;

  for (let i = 1; i < dias.length; i += 1) {
    if (diasEntre(dias[i - 1], dias[i]) > 1) regresos += 1;
  }

  return regresos;
}

// Regresos después de una parada larga. Volver a los dos días es una cosa;
// volver después de tres semanas es otra, y es la que casi nadie hace.
export const PARADA_LARGA = 14;

export function contarRegresosLargos(diasCompletados = []) {
  const dias = [...new Set(diasCompletados)].sort();
  let largos = 0;

  for (let i = 1; i < dias.length; i += 1) {
    if (diasEntre(dias[i - 1], dias[i]) > PARADA_LARGA) largos += 1;
  }

  return largos;
}

// ¿Cuántos días lleva sin marcar? null si nunca ha marcado.
export function diasSinVolver(diasCompletados = [], hoy = new Date()) {
  const dias = [...new Set(diasCompletados)].sort();
  if (!dias.length) return null;
  return diasEntre(dias[dias.length - 1], claveDia(hoy));
}

// ¿Marcar hoy sería un regreso? Sirve para celebrarlo en el momento justo,
// no después.
export function hoySeriaRegreso(estado, hoy = new Date()) {
  const dias = estado?.diasCompletados ?? [];
  if (!dias.length) return false;

  const clave = claveDia(hoy);
  if (dias.includes(clave)) return false; // ya marcó hoy

  return !dias.includes(claveAyer(hoy));
}

// Qué se le dice al volver. Nunca menciona los días perdidos: la persona ya
// sabe cuántos fueron, y recordárselos es justo lo que la hace irse.
export function celebrarRegreso(regresos, dias) {
  if (dias != null && dias >= 30) {
    return {
      titulo: 'Volviste.',
      sub: 'Después de tanto tiempo, esto vale más que cualquier racha.',
    };
  }

  if (regresos <= 1) {
    return { titulo: 'Volviste.', sub: 'Eso es lo más difícil, y ya lo hiciste.' };
  }

  return {
    titulo: 'Volviste otra vez.',
    sub: `Van ${regresos} regresos. Esa es tu verdadera constancia.`,
  };
}

// El texto que se muestra en Progreso.
export function textoRegresos(regresos) {
  if (regresos === 0) {
    return {
      cifra: '0',
      frase: 'Cuando pares y vuelvas, aquí lo vas a ver.',
    };
  }

  if (regresos === 1) {
    return {
      cifra: '1',
      frase: 'Paraste una vez y volviste. Eso ya te distingue.',
    };
  }

  return {
    cifra: String(regresos),
    frase: 'Volver es más difícil que seguir. Lo has hecho todas esas veces.',
  };
}
