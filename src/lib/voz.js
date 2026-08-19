// La voz de Brío.
//
// No es un adorno: mientras alguien está en plancha o en la mitad de una
// sentadilla no puede leer el teléfono. Que la guía se escuche es la
// diferencia entre seguirla y adivinarla.
//
// Módulo pedido dentro de la función, por lo mismo de siempre: un import de
// módulo nativo en el alcance del archivo tumba la app entera en Expo Go si
// el módulo no está, y sin decir por qué.

const IDIOMA = 'es-MX';

// Un poco más lento que la voz por defecto. Una indicación de técnica leída
// rápido no se entiende, y quien la necesita es justo quien nunca entrenó.
const RITMO = 0.92;

let modulo;

function voz() {
  if (modulo !== undefined) return modulo;
  try {
    // eslint-disable-next-line global-require
    modulo = require('expo-speech');
  } catch {
    modulo = null;
  }
  return modulo;
}

export function hayVoz() {
  return voz() !== null;
}

// Lee un texto. Corta lo que estuviera diciendo: dos voces encima no se
// entienden, y volver a tocar el botón significa "esto, no lo otro".
export async function decir(texto, { alTerminar } = {}) {
  const Speech = voz();
  if (!Speech || !texto?.trim()) return false;

  try {
    Speech.stop();
    Speech.speak(texto, {
      language: IDIOMA,
      rate: RITMO,
      onDone: alTerminar,
      onStopped: alTerminar,
      onError: alTerminar,
    });
    return true;
  } catch {
    return false;
  }
}

export function callar() {
  try {
    voz()?.stop();
  } catch {}
}

export async function estaHablando() {
  try {
    return (await voz()?.isSpeakingAsync()) ?? false;
  } catch {
    return false;
  }
}

// La guía entera de un ejercicio, dicha como se la diría una persona.
//
// Se arma aquí y no en la pantalla para que suene igual en todas partes, y
// para poder probar el texto sin encender el altavoz.
export function guionDeGuia(guia, ejercicio) {
  if (!guia) return '';

  const partes = [`${guia.nombre}.`];

  if (ejercicio?.detalle) partes.push(`${ejercicio.detalle}.`);

  partes.push('Así se hace.');
  guia.como?.forEach((paso, i) => partes.push(`${i + 1}. ${paso}`));

  if (guia.cuidado) partes.push(`Fíjate en esto: ${guia.cuidado}`);
  if (guia.respira) partes.push(guia.respira);
  if (guia.masFacil) partes.push(`Si hoy no puedes: ${guia.masFacil}`);

  return partes.join(' ');
}
