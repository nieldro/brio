import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PRESUPUESTO_VACIO,
  avanceDelMes,
  avisoDelMes,
  colorDelMes,
  estadoDelMes,
  estadoPorCategoria,
  fijarCategoria,
  fijarMensual,
  textoDeLoQueQueda,
  textoDeSugerencia,
  topeDesdeTexto,
  topeSugerido,
} from '../src/services/presupuesto.js';

// Agosto de 2026 tiene 31 días. El día 19 el mes va por el 61 por ciento.
const DIA_19 = new Date(2026, 7, 19, 12);
const DIA_5 = new Date(2026, 7, 5, 12);

const gasto = (monto, cambios = {}) => ({
  id: `g-${monto}`,
  fecha: '2026-08-10',
  monto,
  categoria: 'otros',
  nota: '',
  recurrente: false,
  ...cambios,
});

// Los montos llevan puntos de miles: hay que sacarlos antes de contar frases.
const frases = (texto) =>
  texto.replace(/\d[\d.,]*/g, 'X').split(/[.?…]+/).filter((f) => f.trim()).length;

// --- El calendario --------------------------------------------------------

test('el mes se mide por días, no por sensación', () => {
  const t = avanceDelMes(DIA_19);

  assert.equal(t.dias, 31);
  assert.equal(t.dia, 19);
  assert.equal(t.quedanDias, 12);
  assert.ok(Math.abs(t.fraccionDelMes - 19 / 31) < 1e-9);
});

// --- El estado del mes ----------------------------------------------------

test('sin tope no hay semáforo, y eso está bien', () => {
  // Inventarle un tope a alguien es ponerle una raya que no puso, para después
  // señalarlo por cruzarla.
  const e = estadoDelMes({ gastos: [gasto(120000)], hoy: DIA_19 });

  assert.equal(e.hay, false);
  assert.equal(e.color, null);
  assert.equal(e.mensual, null);
  assert.equal(e.gastado, 120000);
  assert.equal(e.cuantos, 1);
});

test('solo se suma el mes en curso', () => {
  const gastos = [
    gasto(100000, { fecha: '2026-08-02' }),
    gasto(900000, { fecha: '2026-07-30' }),
    gasto(50000, { fecha: '2026-09-01' }),
  ];

  assert.equal(estadoDelMes({ gastos, hoy: DIA_19 }).gastado, 100000);
});

test('el semáforo mira el mes contra el calendario, no solo el total', () => {
  const presupuesto = { mensual: 1000000, porCategoria: {} };

  // Día 19, con el 30 por ciento gastado: va tranquilo.
  const verde = estadoDelMes({ gastos: [gasto(300000)], presupuesto, hoy: DIA_19 });
  assert.equal(verde.color, 'verde');
  assert.equal(verde.queda, 700000);

  // Día 5, con el 90 por ciento gastado: va más rápido que el mes.
  const ambar = estadoDelMes({ gastos: [gasto(900000)], presupuesto, hoy: DIA_5 });
  assert.equal(ambar.color, 'ambar');

  // Pasado el tope.
  const rojo = estadoDelMes({ gastos: [gasto(1050000)], presupuesto, hoy: DIA_19 });
  assert.equal(rojo.color, 'rojo');
  assert.equal(rojo.queda, -50000);
});

test('hay margen antes de encender el ámbar', () => {
  // Sin holgura, una compra grande a principio de mes encendería el aviso
  // siempre, y un aviso que salta siempre deja de decir algo.
  assert.equal(colorDelMes(0.6, 0.5), 'verde');
  assert.equal(colorDelMes(0.7, 0.5), 'ambar');
  assert.equal(colorDelMes(1, 0.5), 'rojo');
});

test('un tope de cero o basura es como no tener tope', () => {
  for (const mensual of [0, null, undefined, -5000, 'mucho']) {
    const e = estadoDelMes({ gastos: [gasto(1000)], presupuesto: { mensual }, hoy: DIA_19 });
    assert.equal(e.hay, false, String(mensual));
  }
});

// --- Por categoría --------------------------------------------------------

test('cada categoría trae lo suyo, y las vacías sin tope no salen', () => {
  const gastos = [
    gasto(200000, { categoria: 'mercado' }),
    gasto(60000, { categoria: 'transporte' }),
  ];
  const presupuesto = { mensual: null, porCategoria: { mercado: 300000, salud: 100000 } };

  const filas = estadoPorCategoria({ gastos, presupuesto, hoy: DIA_19 });

  assert.deepEqual(filas.map((f) => f.clave), ['mercado', 'transporte', 'salud']);
  assert.equal(filas[0].tope, 300000);
  assert.equal(filas[0].color, 'verde');
  // Sin tope propio no hay color: no se puede pasar de un número que no existe.
  assert.equal(filas[1].color, null);
  // Con tope y sin gasto, la fila existe igual: un tope sin usar es un dato.
  assert.equal(filas[2].gastado, 0);
});

// --- Cambiar el tope ------------------------------------------------------

test('poner y quitar el tope del mes', () => {
  const uno = fijarMensual(PRESUPUESTO_VACIO, 800000);
  assert.equal(uno.mensual, 800000);

  const ninguno = fijarMensual(uno, 0);
  assert.equal(ninguno.mensual, null);
  // No se pierde lo demás al tocar solo el mensual.
  assert.deepEqual(ninguno.porCategoria, {});
});

test('poner un tope por categoría, y quitarlo poniéndolo en cero', () => {
  const con = fijarCategoria(PRESUPUESTO_VACIO, 'mercado', 300000);
  assert.deepEqual(con.porCategoria, { mercado: 300000 });

  const sin = fijarCategoria(con, 'mercado', null);
  assert.deepEqual(sin.porCategoria, {});
});

test('el tope también se escribe como se habla', () => {
  assert.equal(topeDesdeTexto('600 mil'), 600000);
  assert.equal(topeDesdeTexto('1.200.000'), 1200000);
  assert.equal(topeDesdeTexto('un palo'), 1000000);
  assert.equal(topeDesdeTexto(''), null);
  assert.equal(topeDesdeTexto('no sé'), null);
});

test('el tope sugerido sale del mes pasado y nunca nace roto', () => {
  const gastos = [gasto(812500, { fecha: '2026-07-15' })];

  // Redondeado hacia arriba: sugerir menos de lo que ya gastó es estrenar el
  // presupuesto en rojo, y eso es no volver a abrir la pantalla.
  const sugerido = topeSugerido(gastos, DIA_19);
  assert.equal(sugerido, 820000);
  assert.ok(sugerido >= 812500);

  assert.equal(topeSugerido([], DIA_19), null);
});

// --- La voz, que aquí es media función -----------------------------------

const TODOS_LOS_TEXTOS = () => {
  const presupuesto = { mensual: 1000000, porCategoria: {} };

  const estados = [
    estadoDelMes({ gastos: [], hoy: DIA_19 }),
    estadoDelMes({ gastos: [gasto(120000)], hoy: DIA_19 }),
    estadoDelMes({ gastos: [gasto(300000)], presupuesto, hoy: DIA_19 }),
    estadoDelMes({ gastos: [gasto(900000)], presupuesto, hoy: DIA_5 }),
    estadoDelMes({ gastos: [gasto(1050000)], presupuesto, hoy: DIA_19 }),
    estadoDelMes({ gastos: [gasto(1000000)], presupuesto, hoy: new Date(2026, 7, 31, 12) }),
  ];

  return [
    ...estados.flatMap((e) => [avisoDelMes(e, 'Ana'), avisoDelMes(e, ''), textoDeLoQueQueda(e)]),
    textoDeSugerencia(820000),
    textoDeSugerencia(null),
  ].filter(Boolean);
};

test('ningún aviso regaña, ordena ni grita', () => {
  const PROHIBIDO =
    /\b(te pasaste|deber[íi]as|debes|controla|ahorra|recorta|evita|deja de|no gastes|no compres|gastaste mucho|exceso|excesiv\w*|innecesari\w*|derroch\w*|despilfarr\w*|malgast\w*|culpa|fracaso|excusas|cuidado|ojo|alerta|peligro)\b/i;

  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(!PROHIBIDO.test(t), `"${t}" regaña o manda`);
    assert.ok(!t.includes('!') && !t.includes('¡'), `"${t}" grita`);
    assert.ok(frases(t) <= 2, `"${t}" pasa de 2 frases`);
    assert.ok(!t.includes('undefined') && !t.includes('NaN'), `"${t}" se rompió`);
  }
});

test('ningún aviso dice en qué no gastar', () => {
  // Igual que con la comida: la app informa, no ordena, y nunca se mete con
  // en qué gastó la persona su plata.
  const EN_QUE = /\b(en vez de|mejor no|no compres|menos (comida|ocio|antojos|salidas)|dej[aá] de gastar)\b/i;
  for (const t of TODOS_LOS_TEXTOS()) assert.ok(!EN_QUE.test(t), t);
});

test('el aviso usa el nombre cuando lo hay, y arranca en mayúscula cuando no', () => {
  const e = estadoDelMes({ gastos: [gasto(300000)], presupuesto: { mensual: 1000000 }, hoy: DIA_19 });

  assert.match(avisoDelMes(e, 'Ana'), /^Ana, /);
  assert.match(avisoDelMes(e, ''), /^[A-ZÁÉÍÓÚ]/);
});

test('el mes en blanco se recibe con una invitación, no con un reclamo', () => {
  const e = estadoDelMes({ gastos: [], hoy: DIA_19 });
  const texto = avisoDelMes(e, 'Ana');

  assert.match(texto, /anota/i);
  assert.ok(!/olvidaste|no has anotado nada|llevas sin/i.test(texto), texto);
});

test('pasado el tope se informa en pasado y sin drama', () => {
  const e = estadoDelMes({
    gastos: [gasto(1050000)],
    presupuesto: { mensual: 1000000 },
    hoy: DIA_19,
  });

  const aviso = avisoDelMes(e, 'Ana');
  assert.match(aviso, /\$50\.000/); // dice de cuánto se trata, sin adjetivos
  assert.match(aviso, /dato/i);
  assert.ok(!/pasaste|mal|grave|problema/i.test(aviso), aviso);

  // Y lo que queda no se muestra en negativo, que se lee como una deuda.
  assert.ok(!textoDeLoQueQueda(e).includes('-$'), textoDeLoQueQueda(e));
});

test('sin tope no se habla de lo que queda', () => {
  assert.equal(textoDeLoQueQueda(estadoDelMes({ gastos: [gasto(1000)], hoy: DIA_19 })), null);
  assert.equal(textoDeLoQueQueda(null), null);
});
