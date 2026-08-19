import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { CHIPS } from '../src/data/chatDemo.js';
import { reducer, estadoInicial } from '../src/state/usuarioReducer.js';
import { claveDia } from '../src/services/fecha.js';
import { versionMinima } from '../src/services/plan.js';

const HOY = new Date(2026, 7, 19, 12);

// El chip "Cambia mi reto" contestaba "listo, lo cambio" y no cambiaba nada.
// Estas pruebas están para que no vuelva a pasar: un botón que promete y no
// cumple enseña que la app no vale la pena.

test('todo chip que promete un cambio trae la acción que lo hace', () => {
  const PROMESA = /cambi|dej[ée]|corta|hecho|listo/i;

  for (const chip of CHIPS) {
    if (PROMESA.test(chip.respuesta)) {
      assert.ok(chip.accion, `"${chip.texto}" promete algo y no tiene acción`);
    }
  }
});

test('las acciones de los chips existen de verdad', () => {
  // Un `accion: 'lo-que-sea'` que la pantalla no sabe atender es lo mismo
  // que no tener acción, pero más difícil de ver.
  const chat = readFileSync(new URL('../src/screens/Chat.js', import.meta.url), 'utf8');

  for (const chip of CHIPS.filter((c) => c.accion)) {
    assert.ok(
      chat.includes(`'${chip.accion}'`),
      `Chat.js no atiende la acción "${chip.accion}"`,
    );
  }
});

test('aliviar el reto queda guardado y es de hoy', () => {
  const conAlivio = reducer(estadoInicial, { tipo: 'ALIVIAR_RETO', valor: true, hoy: HOY });
  assert.equal(conAlivio.retoAliviado, claveDia(HOY));

  const sinAlivio = reducer(conAlivio, { tipo: 'ALIVIAR_RETO', valor: false, hoy: HOY });
  assert.equal(sinAlivio.retoAliviado, null);
});

test('el alivio es de un día, no un interruptor permanente', () => {
  // Al día siguiente se arranca de cero. Un "modo fácil" que quedó prendido
  // y nadie recuerda haber puesto termina siendo una app que pide menos de
  // lo que la persona puede.
  const ayer = reducer(estadoInicial, {
    tipo: 'ALIVIAR_RETO',
    valor: true,
    hoy: new Date(2026, 7, 18, 12),
  });

  assert.notEqual(ayer.retoAliviado, claveDia(HOY));
});

test('la versión corta cuenta igual que el día completo', () => {
  // Es la regla que sostiene todo el mecanismo: si contara menos, sería un
  // castigo con otro nombre.
  const dia = {
    dia: 'lunes',
    tipo: 'entrenamiento',
    reto: 'Fuerza de piernas',
    duracion_min: 20,
    ejercicios: [{ nombre: 'Sentadilla' }, { nombre: 'Zancada' }, { nombre: 'Plancha' }],
  };

  const corta = versionMinima(dia);

  assert.equal(corta.ejercicios.length, 1);
  assert.ok(corta.duracion_min <= 2);
  assert.match(corta.mensaje, /cuenta igual/i);
  assert.ok(!/!|¡/.test(corta.mensaje));
});

test('ningún chip grita ni culpa', () => {
  const PROHIBIDO = /fracas|excusa|deber[íi]as|quemar grasa|cuerpo ideal/i;

  for (const chip of CHIPS) {
    assert.ok(!PROHIBIDO.test(chip.respuesta), `"${chip.respuesta}" no debería existir`);
    assert.ok(!/[!¡]/.test(chip.respuesta), `"${chip.respuesta}" grita`);
  }
});
