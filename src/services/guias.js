import { GUIAS, GUIA_GENERICA } from '../data/guias.js';

// Empareja el nombre que escribió la IA con una guía de la biblioteca.
//
// El plan lo genera Gemini, así que los nombres varían: "Sentadilla a la
// silla", "Sentadillas apoyadas", "Sentadilla en silla". Todos deben caer en
// la misma guía. Pura, sin red: se prueba sola.

export function normalizar(texto) {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Devuelve la guía que mejor calce, o null si ninguna lo hace.
// Gana la clave más larga: "paso lateral" debe ganarle a "paso".
export function buscarGuia(nombreEjercicio) {
  const nombre = normalizar(nombreEjercicio);
  if (!nombre) return null;

  let mejor = null;
  let largoMejor = 0;

  for (const guia of GUIAS) {
    for (const clave of guia.claves) {
      if (nombre.includes(clave) && clave.length > largoMejor) {
        mejor = guia;
        largoMejor = clave.length;
      }
    }
  }

  return mejor;
}

// Siempre devuelve algo mostrable. Si el ejercicio no está en la biblioteca,
// entrega el consejo genérico en vez de inventar técnica.
export function guiaDe(ejercicio) {
  const encontrada = buscarGuia(ejercicio?.nombre);

  if (encontrada) return { ...encontrada, esGenerica: false };

  return {
    ...GUIA_GENERICA,
    nombre: ejercicio?.nombre ?? 'Este movimiento',
    esGenerica: true,
  };
}

// El video del movimiento.
//
// Es una BÚSQUEDA, no un enlace a un video concreto, y eso es deliberado:
//   - Un id de YouTube escrito a mano se muere el día que el autor borra el
//     video, y la app queda con un enlace roto que nadie va a revisar.
//   - Un id pedido a la IA es peor: los inventa, y un enlace inventado
//     lleva a cualquier cosa. No se le puede mandar eso a nadie.
// Una búsqueda siempre responde, y responde con lo que existe hoy.
export function busquedaDeVideo(guia) {
  const que = guia?.busqueda || guia?.nombre || 'ejercicio en casa';
  const consulta = `como hacer ${que} tecnica correcta principiantes`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(consulta)}`;
}
