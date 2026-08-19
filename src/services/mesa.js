import { IDEAS, MOMENTOS, FRASES } from '../data/mesa.js';
import { claveDia } from './fecha.js';

// La mesa de Brío. Reglas puras, sin React.
//
// Lo que NO hace, y es lo importante: no lleva cuenta de nada. No sabe si
// cumpliste la idea de ayer, no la marca, no la cobra. Contar comidas es el
// primer paso hacia contar calorías, y ahí es donde esta app no va.

export function ideasDe(momento) {
  return IDEAS.filter((i) => i.momento === momento);
}

export function porMomento() {
  return MOMENTOS.map((m) => ({ ...m, ideas: ideasDe(m.clave) })).filter(
    (m) => m.ideas.length > 0,
  );
}

// Elige de forma estable por día: la misma idea toda la jornada, otra mañana.
// Sin azar en cada render, que haría bailar la pantalla al desplazarse.
function semilla(texto) {
  let n = 0;
  for (let i = 0; i < texto.length; i += 1) n = (n * 31 + texto.charCodeAt(i)) % 100000;
  return n;
}

export function ideaDelDia(momento, fecha = new Date()) {
  const lista = ideasDe(momento);
  if (!lista.length) return null;
  return lista[semilla(`${claveDia(fecha)}|${momento}`) % lista.length];
}

export function fraseDelDia(fecha = new Date()) {
  return FRASES[semilla(claveDia(fecha)) % FRASES.length];
}

// Las cuatro ideas del día, una por momento.
export function mesaDelDia(fecha = new Date()) {
  return MOMENTOS.map((m) => ({ ...m, idea: ideaDelDia(m.clave, fecha) })).filter((m) => m.idea);
}
