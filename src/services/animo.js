import { totales } from './recorrido.js';
import { contarRegresos } from './regresos.js';
import { estadoDeInsignias } from './insignias.js';

// Qué se le enseña a alguien en un día difícil.
//
// EL FALLO QUE ARREGLA
// El botón existía pero solo mostraba las líneas del diario. Quien nunca
// escribió abría su peor momento y no recibía nada. Y justamente esa persona
// —la que no escribe, la que no se felicita— es la que más lo necesita.
//
// Ahora se junta TODO lo que hizo, venga de donde venga: días marcados,
// semanas de permanencia, veces que volvió, hábitos cumplidos, insignias
// ganadas y lo que escribió. Si hizo aunque sea una cosa, aquí hay algo.
//
// LA REGLA
// Nada de lo que aparece aquí puede ser un consejo, una meta ni un pendiente.
// En un día difícil, "podrías intentar" es una piedra más. Solo se muestra lo
// que YA está hecho, en pasado, y ya.

export function pruebasDeLoQueHizo({
  diasCompletados = [],
  habitosHechos = {},
  diario = {},
  mejorRacha = 0,
  rutinasCompletas = 0,
} = {}) {
  const t = totales({ diasCompletados, habitosHechos, diario });
  const regresos = contarRegresos(diasCompletados);

  const pruebas = [];

  if (t.dias > 0) {
    pruebas.push({
      clave: 'dias',
      cifra: t.dias,
      texto: t.dias === 1 ? 'día en el que te moviste' : 'días en los que te moviste',
    });
  }

  if (t.semanas > 1) {
    pruebas.push({
      clave: 'semanas',
      cifra: t.semanas,
      texto: 'semanas distintas en las que apareciste',
    });
  }

  if (regresos > 0) {
    pruebas.push({
      clave: 'regresos',
      cifra: regresos,
      texto: regresos === 1 ? 'vez que paraste y volviste' : 'veces que paraste y volviste',
    });
  }

  if (rutinasCompletas > 0) {
    pruebas.push({
      clave: 'rutinas',
      cifra: rutinasCompletas,
      texto: rutinasCompletas === 1 ? 'rutina que no dejaste a medias' : 'rutinas que no dejaste a medias',
    });
  }

  if (t.habitos > 0) {
    pruebas.push({
      clave: 'habitos',
      cifra: t.habitos,
      texto: 'veces que hiciste algo que nadie te iba a revisar',
    });
  }

  if (mejorRacha > 1) {
    pruebas.push({
      clave: 'racha',
      cifra: mejorRacha,
      texto: 'días seguidos, en tu mejor momento',
    });
  }

  return pruebas;
}

// Las insignias ganadas, para mostrarlas como lo que son: cosas conseguidas
// que nadie le puede quitar.
export function insigniasGanadas(datos = {}) {
  return estadoDeInsignias(datos).filter((i) => i.ganada);
}

// Lo que Brío dice al abrir el día difícil.
//
// Nunca minimiza ("no es para tanto") ni exige ("ánimo, tú puedes"). Valida
// primero, como manda el documento para los días emocionales malos, y después
// señala la evidencia sin pedir nada a cambio.
export function mensajeDeDiaDificil(nombre, cuantasPruebas) {
  const quien = nombre?.trim() ? `${nombre.trim()}, ` : '';

  if (cuantasPruebas === 0) {
    return `${quien}hoy no tienes que hacer nada. Ya es bastante con el día que llevas.`;
  }

  return `${quien}hoy no te voy a pedir nada. Solo mira lo que ya hiciste, que sigue siendo tuyo.`;
}

// El cierre. Se dice después de las pruebas, y es lo único que se le pide:
// nada.
export function cierreDeDiaDificil(hayPlan) {
  if (!hayPlan) return 'Mañana seguimos. Hoy, descansa.';
  return 'Si quieres, el reto de hoy tiene una versión de dos minutos. Y si no, también está bien.';
}
