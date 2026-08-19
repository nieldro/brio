import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  detectarRiesgo,
  respuestaDeRiesgo,
  LINEAS,
  NIVELES_QUE_CORTAN,
} from '../azure-functions/src/lib/riesgo.js';
import { CHIPS } from '../src/data/chatDemo.js';

// El lado de la app. Las reglas se prueban enteras en
// azure-functions/tests/riesgo.test.mjs; aquí se comprueba lo que solo puede
// fallar en el teléfono: que el chat use el detector, que lo use ANTES de la
// red, y que nadie haya hecho una segunda copia del texto de crisis.

const RAIZ = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CHAT = readFileSync(join(RAIZ, 'screens', 'Chat.js'), 'utf8');

test('el chat usa el detector del servidor, no una copia suya', () => {
  // Dos versiones de la misma regla se separan, y la que se queda vieja es
  // siempre la del sitio que nadie mira. Es el mismo trato que Ajustes le da
  // a recordatorio.js.
  assert.match(
    CHAT,
    /from '\.\.\/\.\.\/azure-functions\/src\/lib\/riesgo'/,
    'Chat.js no importa el detector compartido',
  );
});

test('el detector gana antes que la red', () => {
  const enviar = CHAT.slice(CHAT.indexOf('const enviar = async'));
  assert.ok(enviar.length > 200, 'no se encontró la función que manda el mensaje');

  const detecta = enviar.indexOf('detectarRiesgo(');
  const llama = enviar.indexOf('preguntarCoach(');

  assert.ok(detecta !== -1, 'el chat no detecta nada');
  assert.ok(llama !== -1, 'el chat ya no llama al coach');
  assert.ok(detecta < llama, 'el chat llama a la IA antes de mirar si hay riesgo');

  // Y la llamada tiene que quedar en la rama contraria: detectar y llamar
  // igual no serviría de nada.
  assert.match(
    enviar,
    /riesgo\.corta[\s\S]{0,200}\belse\b[\s\S]{0,160}preguntarCoach/,
    'la llamada a la IA no está en el else del riesgo',
  );
});

test('sin conexión, una señal de riesgo no cae en "no pude conectarme"', () => {
  // Ese texto es el plan B de la pantalla cuando no hay red. A quien acaba de
  // escribir que quiere hacerse daño lo dejaría exactamente a solas.
  for (const nivel of NIVELES_QUE_CORTAN) {
    const texto = respuestaDeRiesgo(nivel, 'Daniel');
    assert.ok(texto, `${nivel} corta la IA y la app no tendría qué responder`);
    assert.ok(!/no pude conectarme/i.test(texto), `${nivel}: es el texto de sin conexión`);
  }
});

test('la respuesta cabe en una burbuja de chat', () => {
  // El hilo pinta cada mensaje en un solo <Text>. Un salto de línea partiría
  // la burbuja y el número de teléfono podría quedar suelto abajo.
  for (const nivel of NIVELES_QUE_CORTAN) {
    const texto = respuestaDeRiesgo(nivel, 'Daniel');
    assert.ok(!texto.includes('\n'), `${nivel}: el texto lleva saltos de línea`);
  }
});

test('ningún chip de respuesta rápida dispara una alarma', () => {
  // Los tres chips son botones que la persona toca sin escribir nada. Si uno
  // de ellos contestara con una línea de crisis, la app quedaría inservible.
  for (const chip of CHIPS) {
    assert.equal(
      detectarRiesgo(chip.texto).corta,
      false,
      `el chip "${chip.texto}" cortocircuita el coach`,
    );
  }
});

test('"Me siento bajo" se acompaña, no se deriva', () => {
  // El chip existe justo para los días malos: tiene que llegar a la IA con la
  // nota de validar primero, no recibir un teléfono de urgencias.
  const r = detectarRiesgo('Me siento bajo');
  assert.equal(r.nivel, 'desanimo');
  assert.equal(r.corta, false);
});

function archivosJs(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivosJs(ruta);
    return nombre.endsWith('.js') ? [ruta] : [];
  });
}

test('las líneas de ayuda viven en un solo sitio', () => {
  // Un número de urgencias copiado a mano en una pantalla es un número que
  // algún día se queda desactualizado sin que nadie se entere.
  const copias = [];

  for (const ruta of archivosJs(RAIZ)) {
    const codigo = readFileSync(ruta, 'utf8');
    if (/l[íi]nea\s+(106|192)/i.test(codigo)) copias.push(ruta.split('src')[1]);
  }

  assert.deepEqual(copias, [], 'hay líneas de ayuda escritas a mano fuera de riesgo.js');
  assert.equal(LINEAS.bogota, '106');
  assert.equal(LINEAS.nacional, '192');
});
