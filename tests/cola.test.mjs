import test from 'node:test';
import assert from 'node:assert/strict';

import {
  encolar,
  pendientes,
  hayPendientes,
  confirmar,
  reprogramar,
  proximoIntento,
  resumen,
  claveDe,
} from '../src/services/cola.js';

const PERFIL = { tipo: 'perfil', datos: { nombre: 'Daniel' } };
const REGISTRO = { tipo: 'registro', fecha: '2026-08-18', reto: 'Caminata' };
const LOGRO = { tipo: 'logro', fecha: '2026-08-18', texto: 'Camine 20 min' };

const gasto = (id, nota) => ({
  tipo: 'gasto',
  gasto: { id, fecha: '2026-08-18', monto: 12000, categoria: 'mercado', nota },
});

// --- Dinero ---------------------------------------------------------------
//
// Los gastos rompen el supuesto del resto de la cola. Todo lo demás es de
// estado final —el perfil ES esto, el día ESTÁ marcado— y por eso se colapsa
// por día. Un gasto es una cosa suelta: dos almuerzos del mismo martes son
// dos gastos, y con la regla general uno de los dos se perdía en silencio.

test('dos gastos del mismo día no se pisan', () => {
  const cola = encolar(encolar([], gasto('g-1', 'almuerzo')), gasto('g-2', 'café'));
  assert.equal(cola.length, 2);
});

test('anotar el mismo gasto dos veces manda uno solo', () => {
  const cola = encolar(encolar([], gasto('g-1', 'almuerzo')), gasto('g-1', 'almuerzo del martes'));
  assert.equal(cola.length, 1);
  assert.equal(cola[0].gasto.nota, 'almuerzo del martes');
});

test('borrar un gasto que aún no subió cancela su envío', () => {
  // Sin señal, anotar y borrar tiene que salir como un solo viaje. Mandar el
  // gasto y después el borrado es hablar dos veces para no decir nada.
  const cola = encolar(encolar([], gasto('g-1', 'almuerzo')), {
    tipo: 'gasto-borrado',
    id: 'g-1',
  });

  assert.equal(cola.length, 1);
  assert.equal(cola[0].tipo, 'gasto-borrado');
});

test('el presupuesto es uno solo y gana el último', () => {
  const cola = encolar(
    encolar([], { tipo: 'presupuesto', datos: { mensual: 500000 } }),
    { tipo: 'presupuesto', datos: { mensual: 600000 } },
  );

  assert.equal(cola.length, 1);
  assert.equal(cola[0].datos.mensual, 600000);
});

test('las operaciones de dinero sí entran en la cola', () => {
  // `encolar` descarta en silencio cualquier tipo que no esté en la lista
  // blanca, así que olvidar registrarlo es perder el dato sin que nada avise.
  for (const op of [
    gasto('g-1', 'algo'),
    { tipo: 'gasto-borrado', id: 'g-1' },
    { tipo: 'presupuesto', datos: { mensual: 1 } },
  ]) {
    assert.equal(encolar([], op).length, 1, `${op.tipo} se cayó de la cola`);
  }
});

// --- Encolar --------------------------------------------------------------

test('encolar agrega y no muta la cola original', () => {
  const vacia = [];
  const c = encolar(vacia, REGISTRO);
  assert.equal(c.length, 1);
  assert.equal(vacia.length, 0, 'la cola original no se toca');
});

test('rechaza operaciones que no conoce', () => {
  const c = encolar([], { tipo: 'inventado', fecha: '2026-08-18' });
  assert.equal(c.length, 0);
});

test('la clave separa perfil, registro y logro', () => {
  assert.equal(claveDe(PERFIL), 'perfil');
  assert.equal(claveDe(REGISTRO), 'registro:2026-08-18');
  assert.equal(claveDe(LOGRO), 'logro:2026-08-18');
});

// --- Colapsar: lo que evita la avalancha ---------------------------------

test('marcar el mismo día tres veces manda una sola escritura', () => {
  let c = [];
  c = encolar(c, { ...REGISTRO, reto: 'A' });
  c = encolar(c, { ...REGISTRO, reto: 'B' });
  c = encolar(c, { ...REGISTRO, reto: 'C' });

  assert.equal(c.length, 1, 'se colapsa por clave');
  assert.equal(c[0].reto, 'C', 'gana la última, que es el estado final');
});

test('días distintos NO se colapsan entre sí', () => {
  let c = [];
  c = encolar(c, { tipo: 'registro', fecha: '2026-08-17' });
  c = encolar(c, { tipo: 'registro', fecha: '2026-08-18' });
  assert.equal(c.length, 2);
});

test('el registro y el logro del mismo día son operaciones distintas', () => {
  let c = encolar([], REGISTRO);
  c = encolar(c, LOGRO);
  assert.equal(c.length, 2);
});

test('editar el perfil diez veces deja una sola operación', () => {
  let c = [];
  for (let i = 0; i < 10; i += 1) c = encolar(c, { tipo: 'perfil', datos: { nombre: `n${i}` } });
  assert.equal(c.length, 1);
  assert.equal(c[0].datos.nombre, 'n9');
});

test('reencolar reinicia los intentos: es una operación nueva', () => {
  let c = encolar([], REGISTRO);
  c = reprogramar(c, 'registro:2026-08-18', 1000);
  assert.equal(c[0].intentos, 1);

  c = encolar(c, { ...REGISTRO, reto: 'otro' });
  assert.equal(c[0].intentos, 0);
  assert.equal(c[0].esperarHasta, 0, 'y se puede mandar ya');
});

// --- Espera creciente -----------------------------------------------------

test('una operación nueva se manda de inmediato', () => {
  const c = encolar([], REGISTRO);
  assert.equal(hayPendientes(c, 1000), true);
});

test('al fallar, la espera crece al doble', () => {
  let c = encolar([], REGISTRO);
  const clave = 'registro:2026-08-18';

  c = reprogramar(c, clave, 0);
  assert.equal(c[0].esperarHasta, 2000, 'primer fallo: 2s');

  c = reprogramar(c, clave, 0);
  assert.equal(c[0].esperarHasta, 4000, 'segundo: 4s');

  c = reprogramar(c, clave, 0);
  assert.equal(c[0].esperarHasta, 8000, 'tercero: 8s');
});

test('la espera tiene techo: no castiga la batería para siempre', () => {
  let c = encolar([], REGISTRO);
  const clave = 'registro:2026-08-18';
  for (let i = 0; i < 20; i += 1) c = reprogramar(c, clave, 0);

  assert.equal(c[0].esperarHasta, 5 * 60_000, 'cinco minutos como máximo');
  assert.equal(c[0].intentos, 20, 'pero se sigue contando');
});

test('mientras espera no se manda, y después sí', () => {
  let c = encolar([], REGISTRO);
  c = reprogramar(c, 'registro:2026-08-18', 0);

  assert.equal(hayPendientes(c, 1000), false, 'todavía no');
  assert.equal(hayPendientes(c, 2000), true, 'ya');
});

test('reprogramar solo toca la operación que fallo', () => {
  let c = encolar([], REGISTRO);
  c = encolar(c, LOGRO);
  c = reprogramar(c, 'registro:2026-08-18', 0);

  const registro = c.find((o) => o.clave === 'registro:2026-08-18');
  const logro = c.find((o) => o.clave === 'logro:2026-08-18');
  assert.equal(registro.intentos, 1);
  assert.equal(logro.intentos, 0, 'el otro sigue intacto');
});

// --- Nada se pierde -------------------------------------------------------

test('fallar muchas veces NUNCA descarta la operación', () => {
  let c = encolar([], REGISTRO);
  for (let i = 0; i < 500; i += 1) c = reprogramar(c, 'registro:2026-08-18', 0);
  assert.equal(c.length, 1, 'perder el dato de alguien es peor que reintentar');
});

test('solo el servidor saca cosas de la cola', () => {
  let c = encolar([], REGISTRO);
  c = confirmar(c, 'registro:2026-08-18');
  assert.equal(c.length, 0);
});

test('confirmar una clave que no está no rompe nada', () => {
  const c = encolar([], REGISTRO);
  assert.equal(confirmar(c, 'no-existe').length, 1);
});

// --- Cuándo volver a mirar ------------------------------------------------

test('sin cola no hay nada que esperar', () => {
  assert.equal(proximoIntento([], 0), null);
});

test('con algo listo, hay que mirar ya', () => {
  assert.equal(proximoIntento(encolar([], REGISTRO), 0), 0);
});

test('con todo esperando, dice cuánto falta para el más cercano', () => {
  let c = encolar([], REGISTRO);
  c = encolar(c, LOGRO);
  c = reprogramar(c, 'registro:2026-08-18', 0); // espera 2000
  c = reprogramar(c, 'logro:2026-08-18', 0); // espera 2000
  c = reprogramar(c, 'logro:2026-08-18', 0); // espera 4000

  assert.equal(proximoIntento(c, 0), 2000, 'el más cercano manda');
});

// --- Lo que ve el usuario -------------------------------------------------

test('el resumen no usa tecnicismos ni asusta', () => {
  assert.match(resumen([]).texto, /todo guardado/i);
  assert.match(resumen(encolar([], REGISTRO)).texto, /guardando/i);

  let atascada = encolar([], REGISTRO);
  for (let i = 0; i < 4; i += 1) atascada = reprogramar(atascada, 'registro:2026-08-18', 0);

  const r = resumen(atascada);
  assert.match(r.texto, /guardado en tu tel/i, 'tranquiliza: el dato no se perdió');
  assert.ok(!/error|fallo|reintent/i.test(r.texto), 'nada de jerga técnica');
});

test('el resumen cuenta bien en singular y plural', () => {
  let c = encolar([], REGISTRO);
  assert.match(resumen(c).texto, /un cambio/i);

  c = encolar(c, LOGRO);
  assert.match(resumen(c).texto, /2 cambios/i);
});

// --- El caso completo -----------------------------------------------------

test('una semana sin señal no genera una avalancha al volver', () => {
  let c = [];
  // Siete días marcados, cada uno tocado varias veces, más ediciones de perfil.
  for (const dia of ['12', '13', '14', '15', '16', '17', '18']) {
    for (let i = 0; i < 3; i += 1) {
      c = encolar(c, { tipo: 'registro', fecha: `2026-08-${dia}` });
      c = encolar(c, { tipo: 'logro', fecha: `2026-08-${dia}`, texto: `v${i}` });
    }
    c = encolar(c, { tipo: 'perfil', datos: {} });
  }

  // 7 registros + 7 logros + 1 perfil = 15, no 49.
  assert.equal(c.length, 15);
  assert.equal(c.filter((o) => o.tipo === 'perfil').length, 1);
});
