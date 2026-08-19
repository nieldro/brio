import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  RETO_INICIAL,
  ESCALERA_BASE,
  HITOS,
  fijarMonto,
  pausar,
  reanudar,
  estaActivo,
  montoActual,
  ultimoMonto,
  primerDia,
  loAhorrado,
  apartadoHoy,
  montosSugeridos,
  estadoDeHitos,
  hitosRecienGanados,
  textoDeLoApartado,
  textoDesdeCuando,
  textoDeCuandoRige,
  rigeDesdeManana,
  mensajeDelReto,
  resumenDeAhorro,
  formatoMonto,
} from '../src/services/ahorro.js';
import { claveDia } from '../src/services/fecha.js';

// Miércoles 19 de agosto de 2026. Todo parte de aquí.
const HOY = new Date(2026, 7, 19);
// n días atrás. Con n negativo, hacia adelante: dia(-1) es mañana.
const dia = (n) => new Date(2026, 7, 19 - n);
const clave = (n) => claveDia(dia(n));

// Dos tramos encima del mismo día es un defecto por sí solo: `tramoDelDia` se
// queda con el primero, así que el día se cobra al monto VIEJO mientras la
// tarjeta anuncia el nuevo.
const SIN_FIN = '9999-12-31';

function solapes(reto) {
  const tramos = reto.tramos ?? [];
  const malos = [];

  for (let i = 0; i < tramos.length; i += 1) {
    const a = tramos[i];
    if (a.hasta && a.hasta < a.desde) malos.push(`tramo al revés: ${a.desde} a ${a.hasta}`);

    for (let j = i + 1; j < tramos.length; j += 1) {
      const b = tramos[j];
      if (a.desde <= (b.hasta ?? SIN_FIN) && b.desde <= (a.hasta ?? SIN_FIN)) {
        malos.push(`${a.desde}-${a.hasta} se solapa con ${b.desde}-${b.hasta}`);
      }
    }
  }

  return malos;
}

// Las frases se cuentan quitando antes los puntos de los miles: "Van 1.000."
// es una frase, no dos.
const frasesDe = (texto) =>
  String(texto)
    .replace(/(\d)\.(\d)/g, '$1$2')
    .split(/[.!?]+/)
    .filter((f) => f.trim());

// --- Lo básico ------------------------------------------------------------

test('sin reto no se aparta nada, y eso no es un error', () => {
  assert.deepEqual(loAhorrado([clave(0), clave(1)], RETO_INICIAL), { dias: 0, total: 0 });
  assert.equal(estaActivo(RETO_INICIAL), false);
  assert.equal(montoActual(RETO_INICIAL), 0);
  assert.equal(primerDia(RETO_INICIAL), null);
  assert.equal(textoDesdeCuando(RETO_INICIAL), null);
});

test('cada día marcado aparta la cantidad que la persona eligió', () => {
  const reto = fijarMonto(RETO_INICIAL, 2000, dia(10));
  assert.equal(estaActivo(reto), true);
  assert.equal(montoActual(reto), 2000);

  const r = loAhorrado([clave(10), clave(9), clave(8)], reto);
  assert.equal(r.dias, 3);
  assert.equal(r.total, 6000);
});

test('el reto no cobra hacia atrás: los días de antes no cuentan', () => {
  // Empezar hoy no puede regalar un total que no se apartó nunca. El número
  // grande de la pantalla tiene que ser dinero de verdad.
  const reto = fijarMonto(RETO_INICIAL, 2000, dia(5));
  const r = loAhorrado([clave(10), clave(6), clave(5), clave(2), clave(0)], reto);

  assert.equal(r.dias, 3);
  assert.equal(r.total, 6000);
});

test('marcar el mismo día dos veces no aparta dos veces', () => {
  const reto = fijarMonto(RETO_INICIAL, 1000, dia(3));
  assert.deepEqual(loAhorrado([clave(1), clave(1), clave(1)], reto), { dias: 1, total: 1000 });
});

// --- La regla que no se toca ---------------------------------------------

test('romper la racha NO borra lo apartado', () => {
  const reto = fijarMonto(RETO_INICIAL, 1000, dia(40));
  const antes = [clave(40), clave(39), clave(38)];

  assert.equal(loAhorrado(antes, reto).total, 3000);

  // Cinco semanas parado y vuelve. Lo de antes sigue completo y lo nuevo suma.
  const conHueco = [...antes, clave(2), clave(1)];
  assert.equal(loAhorrado(conHueco, reto).total, 5000, 'el hueco no puede restar');
});

test('nada de lo apartado se pierde: un mes entero tocando todos los botones', () => {
  // La propiedad entera del módulo, con el guion de una persona de verdad y en
  // el orden en que pasan las cosas: primero se marca el día en Hoy y DESPUÉS
  // se abre Ahorro y se toca algo.
  //
  // El orden importa más que el guion. Con un solo tramo fijo, sin pausas y
  // con los cambios hechos ANTES de que existan los días que afectan, esta
  // prueba era cierta por construcción: seguía verde aunque se borraran
  // `cerrarAntesDe`, `pausar` y `tramoDelDia` enteros.
  const ACCIONES = {
    30: (r, h, d) => fijarMonto(r, 5000, h, d), // empieza
    25: (r, h, d) => fijarMonto(r, 1000, h, d), // el mes viene duro, aparta menos
    18: (r, h) => pausar(r, h), // se cae del todo
    12: (r, h, d) => fijarMonto(r, 2000, h, d), // vuelve un día que no marcó
    9: (r, h, d) => fijarMonto(r, 800, h, d), // y baja otra vez
    5: (r, h) => pausar(r, h),
  };

  let reto = RETO_INICIAL;
  let dias = [];
  let maximo = 0;
  let ganadosAnterior = 0;

  for (let n = 30; n >= 0; n -= 1) {
    const hoy = dia(n);
    if (n % 4 !== 0) dias = [...dias, clave(n)]; // huecos a propósito

    const antes = loAhorrado(dias, reto).total;

    const accion = ACCIONES[n];
    if (accion) reto = accion(reto, hoy, dias);

    const r = loAhorrado(dias, reto);
    const ganados = estadoDeHitos(r.dias).filter((h) => h.ganado).length;

    assert.ok(r.total >= antes, `tocar el reto el día ${n} recalculó lo ya apartado`);
    assert.ok(r.total >= maximo, `el total bajó en el día ${n}`);
    assert.ok(ganados >= ganadosAnterior, `se perdió un hito en el día ${n}`);
    assert.deepEqual(solapes(reto), [], `tramos pisados el día ${n}`);

    maximo = r.total;
    ganadosAnterior = ganados;
  }

  assert.ok(maximo > 0);
});

test('bajar la cantidad no encoge lo que ya estaba apartado', () => {
  // Alguien que aparta menos porque el mes viene duro no puede ver caer su
  // total: eso se lee como un castigo por tener menos.
  //
  // El día de hoy ya está marcado y ya se vio sumado, que es lo que hace real
  // a esta prueba: con el cambio de cantidad puesto ANTES de que existan los
  // días afectados no se comprueba nada.
  const reto = fijarMonto(RETO_INICIAL, 5000, dia(3));
  const dias = [clave(3), clave(2), clave(1), clave(0)];

  assert.equal(loAhorrado(dias, reto).total, 20000);

  // Y ahora se abre Ahorro y se toca "Cambiar cuánto": 1.000.
  const barato = fijarMonto(reto, 1000, HOY, dias);

  assert.equal(loAhorrado(dias, barato).total, 20000, 'lo ya apartado se recalculó');
  assert.equal(montoActual(barato), 1000);

  // Lo nuevo rige desde mañana, porque hoy ya contó. Y se dice en pantalla:
  // una cifra que aún no manda, sin explicación, se lee como un error.
  assert.equal(rigeDesdeManana(barato, HOY), true);
  assert.match(textoDeCuandoRige(barato, HOY), /mañana/i);
  assert.equal(loAhorrado([...dias, clave(-1)], barato).total, 21000);
});

test('empezar hoy, apartar, pausar y volver con menos no toca lo de hoy', () => {
  // La otra puerta al mismo defecto, y se abre con tres toques seguidos.
  let reto = fijarMonto(RETO_INICIAL, 5000, HOY);
  const dias = [claveDia(HOY)];

  assert.equal(loAhorrado(dias, reto).total, 5000);

  reto = pausar(reto, HOY);
  assert.equal(loAhorrado(dias, reto).total, 5000, 'pausar se llevó lo de hoy');

  reto = reanudar(reto, HOY, 1000, dias);
  assert.equal(loAhorrado(dias, reto).total, 5000, 'volver con menos recalculó el día de hoy');
  assert.equal(montoActual(reto), 1000);
  assert.deepEqual(solapes(reto), []);
});

test('lo que anuncia la tarjeta es lo que se cobra: ningún día con dos tramos', () => {
  // Pausar cierra en HOY y volver el mismo día abría otro tramo desde HOY: ese
  // día quedaba cubierto por dos, y `tramoDelDia` se queda con el primero. La
  // persona leía 3.000 en la tarjeta y se le apartaban 2.000.
  const pausadoHoy = pausar(fijarMonto(RETO_INICIAL, 2000, dia(5)), HOY);
  const vuelto = reanudar(pausadoHoy, HOY, 3000, []);

  assert.deepEqual(solapes(vuelto), []);
  assert.equal(montoActual(vuelto), 3000);
  assert.equal(
    loAhorrado([claveDia(HOY)], vuelto).total,
    montoActual(vuelto),
    'el día se cobró a un monto distinto del que anuncia la tarjeta',
  );

  // Y por el otro camino: cambiar la cantidad sin pausar, el mismo día.
  const cambiado = fijarMonto(fijarMonto(RETO_INICIAL, 2000, dia(5)), 3000, HOY, []);
  assert.deepEqual(solapes(cambiado), []);
  assert.equal(loAhorrado([claveDia(HOY)], cambiado).total, 3000);
});

test('subir la cantidad solo cuenta de hoy en adelante', () => {
  let reto = fijarMonto(RETO_INICIAL, 1000, dia(10));
  reto = fijarMonto(reto, 3000, dia(2));

  assert.equal(loAhorrado([clave(10), clave(9), clave(2), clave(0)], reto).total, 8000);
  assert.equal(montoActual(reto), 3000);
});

test('cambiar de idea el mismo día deja un solo tramo, nunca uno al revés', () => {
  let reto = fijarMonto(RETO_INICIAL, 1000, HOY);
  reto = fijarMonto(reto, 3000, HOY);

  assert.equal(reto.tramos.length, 1);
  assert.equal(montoActual(reto), 3000);
  assert.equal(loAhorrado([claveDia(HOY)], reto).total, 3000);

  for (const t of reto.tramos) {
    if (t.hasta) assert.ok(t.desde <= t.hasta, `tramo al revés: ${t.desde} a ${t.hasta}`);
  }
});

test('una cantidad que no es cantidad no enciende nada', () => {
  for (const malo of [0, -50, 'abc', null, undefined, NaN]) {
    assert.equal(estaActivo(fijarMonto(RETO_INICIAL, malo, HOY)), false, `con ${malo}`);
  }
});

// --- Pausar ---------------------------------------------------------------

test('pausar no borra nada y no se lleva el día de hoy', () => {
  const dias = [clave(5), clave(1), clave(0)];
  let reto = fijarMonto(RETO_INICIAL, 2000, dia(5));
  const antes = loAhorrado(dias, reto).total;

  reto = pausar(reto, HOY);

  assert.equal(estaActivo(reto), false);
  assert.equal(loAhorrado(dias, reto).total, antes, 'pausar quitó dinero ya apartado');
});

test('pausar el mismo día que se cambió la cantidad no deja un tramo al revés', () => {
  // Dos toques seguidos: se cambia la cantidad un día que ya contó (lo nuevo
  // rige mañana) y se pausa antes de que llegue mañana. Ese tramo no alcanzó a
  // dejar nada, y guardado al revés se queda en la lista para siempre.
  const dias = [claveDia(HOY)];

  let reto = fijarMonto(RETO_INICIAL, 5000, HOY);
  reto = fijarMonto(reto, 1000, HOY, dias);
  reto = pausar(reto, HOY);

  assert.deepEqual(solapes(reto), []);
  assert.equal(estaActivo(reto), false);
  assert.equal(loAhorrado(dias, reto).total, 5000, 'pausar movió lo de hoy');
});

test('en pausa no se suma, y volver recuerda cuánto apartaba', () => {
  const pausado = pausar(fijarMonto(RETO_INICIAL, 2000, dia(10)), dia(6));
  assert.equal(loAhorrado([clave(3)], pausado).total, 0);
  assert.equal(ultimoMonto(pausado), 2000);

  const vuelto = reanudar(pausado, dia(2));
  assert.equal(montoActual(vuelto), 2000);
  assert.equal(loAhorrado([clave(3), clave(2)], vuelto).total, 2000);
});

// --- Los hitos ------------------------------------------------------------

test('los hitos se ganan por días apartados, nunca por cantidad', () => {
  // Un hito de dinero mide cuánto tiene la persona, no lo que hizo: quien
  // aparta 500 no llegaría nunca y quien aparta 50.000 llegaría sin haber
  // hecho nada distinto.
  const siete = [0, 1, 2, 3, 4, 5, 6].map(clave);
  const chico = fijarMonto(RETO_INICIAL, 500, dia(10));
  const grande = fijarMonto(RETO_INICIAL, 50000, dia(10));

  const ganados = (reto) =>
    estadoDeHitos(loAhorrado(siete, reto).dias)
      .filter((h) => h.ganado)
      .map((h) => h.clave);

  assert.deepEqual(ganados(chico), ganados(grande));
  assert.ok(ganados(chico).includes('aparte-7'));
});

test('lo que falta se muestra como avance, no como candado', () => {
  const treinta = estadoDeHitos(18).find((h) => h.clave === 'aparte-30');
  assert.equal(treinta.ganado, false);
  assert.equal(treinta.valor, 18);
  assert.ok(treinta.fraccion > 0.5 && treinta.fraccion < 1);

  assert.equal(estadoDeHitos(900).find((h) => h.clave === 'aparte-7').fraccion, 1);
  assert.ok(estadoDeHitos(0).every((h) => h.fraccion === 0 && !h.ganado));
});

test('reconoce el hito que se acaba de ganar, para poder celebrarlo', () => {
  assert.deepEqual(
    hitosRecienGanados(6, 7).map((h) => h.clave),
    ['aparte-7'],
  );
  assert.deepEqual(hitosRecienGanados(7, 8), []);
  assert.deepEqual(
    hitosRecienGanados(0, 1).map((h) => h.clave),
    ['aparte-1'],
  );
});

// --- Cuánto proponerle ----------------------------------------------------

// Cinco cosas distintas; la mediana de lo que cuesta cada una es 3.000.
const GASTOS = [
  { fecha: clave(20), monto: 300, categoria: 'antojos', nota: 'dulce' },
  { fecha: clave(18), monto: 1500, categoria: 'transporte', nota: 'bus' },
  { fecha: clave(15), monto: 3000, categoria: 'antojos', nota: 'café' },
  { fecha: clave(12), monto: 12000, categoria: 'ocio', nota: 'cine' },
  { fecha: clave(9), monto: 60000, categoria: 'mercado', nota: 'mercado' },
];

test('las cantidades que se proponen salen de lo que gasta la persona', () => {
  const m = montosSugeridos(GASTOS);

  assert.ok(m.length >= 2);
  assert.ok(m.every((x) => x > 0));
  assert.ok(Math.max(...m) < 3000, 'todas tienen que ser pequeñas para ella');
  assert.deepEqual([...m].sort((a, b) => a - b), m, 'vienen ordenadas');
  assert.equal(new Set(m).size, m.length, 'sin repetidas');
});

test('quien gasta cien veces más recibe cantidades cien veces mayores', () => {
  // La prueba de que el umbral no es un número inventado: la misma vida a otra
  // escala tiene que dar la misma propuesta a escala.
  const cien = GASTOS.map((g) => ({ ...g, monto: g.monto * 100 }));
  assert.deepEqual(
    montosSugeridos(cien),
    montosSugeridos(GASTOS).map((m) => m * 100),
  );
});

test('sin gastos apuntados hay una escalera de arranque, no una pantalla vacía', () => {
  assert.deepEqual(montosSugeridos([]), ESCALERA_BASE);
  assert.deepEqual(montosSugeridos(), ESCALERA_BASE);
});

// --- El resumen y la cifra ------------------------------------------------

test('el resumen trae todo lo que la pantalla necesita', () => {
  const reto = fijarMonto(RETO_INICIAL, 2000, dia(4));
  const dias = [clave(4), clave(3), clave(0)];
  const r = resumenDeAhorro(dias, reto, HOY);

  assert.equal(r.activo, true);
  assert.equal(r.monto, 2000);
  assert.equal(r.dias, 3);
  assert.equal(r.total, 6000);
  assert.equal(r.desde, clave(4));
  assert.equal(r.hoyApartado, true);
  assert.equal(r.hitos.length, HITOS.length);

  assert.equal(apartadoHoy([clave(1)], reto, HOY), false);
});

test('la cifra se lee sin decimales y con los miles separados', () => {
  assert.equal(formatoMonto(0), '0');
  assert.equal(formatoMonto(500), '500');
  assert.equal(formatoMonto(1000), '1.000');
  assert.equal(formatoMonto(12500), '12.500');
  assert.equal(formatoMonto(1234567), '1.234.567');
});

test('no revienta sin datos', () => {
  assert.doesNotThrow(() => resumenDeAhorro());
  assert.doesNotThrow(() => loAhorrado(undefined, undefined));
  assert.doesNotThrow(() => mensajeDelReto());
  assert.doesNotThrow(() => estadoDeHitos());
  assert.equal(resumenDeAhorro().total, 0);
});

// --- La voz ---------------------------------------------------------------

const ESCENARIOS = [
  {},
  { activo: true, dias: 0 },
  // La racha rota SIN nada apartado todavía. Es el camino de quien vuelve tras
  // un lapso, abre Ahorro y toca "Empezar", y faltaba justo aquí.
  { activo: true, dias: 0, rota: true },
  { activo: true, dias: 0, rota: true, nombre: 'Daniel' },
  { activo: true, dias: 1, hoyApartado: true },
  { activo: true, dias: 9, rota: true },
  { activo: true, dias: 9, rota: true, nombre: 'Daniel' },
  { activo: false, dias: 9 },
  { activo: true, dias: 40, nombre: 'Daniel' },
];

// El reto de quien cambió la cantidad un día que ya contó.
const CAMBIADO_HOY = fijarMonto(fijarMonto(RETO_INICIAL, 5000, HOY), 1000, HOY, [claveDia(HOY)]);

const TEXTOS = [
  ...ESCENARIOS.map((e) => mensajeDelReto(e)),
  textoDeLoApartado({ dias: 0, total: 0 }),
  textoDeLoApartado({ dias: 1, total: 1000 }),
  textoDeLoApartado({ dias: 42, total: 84000 }),
  textoDesdeCuando(fijarMonto(RETO_INICIAL, 1000, dia(10))),
  textoDeCuandoRige(CAMBIADO_HOY, HOY),
  ...HITOS.map((h) => h.titulo),
  ...HITOS.map((h) => h.texto),
];

test('ningún texto culpa, ordena ni promete', () => {
  const CULPA = /fracaso|excusas|deber[íi]as|fallaste|perdiste|te pasaste|malgast|derroch/i;
  const ORDEN = /\b(deja de|quita|elimina|recorta|no gastes|ahorra m[áa]s)\b/i;
  const PROMESA = /al a[ñn]o|inter[ée]s|intereses|rentab|vas a tener|podr[íi]as tener|meta de/i;

  for (const texto of TEXTOS) {
    assert.ok(texto, 'un texto salió vacío');
    assert.ok(!CULPA.test(texto), `"${texto}" culpa`);
    assert.ok(!ORDEN.test(texto), `"${texto}" da una orden`);
    assert.ok(!PROMESA.test(texto), `"${texto}" promete o proyecta`);
    assert.ok(!texto.includes('!'), `"${texto}" grita`);
    assert.ok(frasesDe(texto).length <= 2, `"${texto}" son más de dos frases`);
  }
});

test('ningún texto supone el género de la persona', () => {
  for (const texto of TEXTOS) {
    assert.ok(!/\b(listo|lista|preparad[oa]|content[oa])\b/i.test(texto), `"${texto}"`);
  }
});

test('cuando la racha se rompe, lo primero que se dice es que el dinero sigue ahí', () => {
  const texto = mensajeDelReto({ activo: true, dias: 9, rota: true, nombre: 'Daniel' });

  assert.match(texto, /^Daniel, /);
  assert.match(texto, /sigue aqu[íi]/i);
  assert.ok(!/racha|d[íi]as seguidos/i.test(texto), 'no le recuerda lo que se rompió');
});

test('funciona igual sin nombre, y sigue empezando en mayúscula', () => {
  const texto = mensajeDelReto({ activo: true, dias: 9, rota: true });
  assert.ok(!texto.startsWith(','), 'empieza con una coma suelta');
  assert.match(texto, /^Lo que apartaste/);

  for (const e of ESCENARIOS) {
    const t = mensajeDelReto(e);
    assert.match(t[0], /[A-ZÁÉÍÓÚÑ]/, `"${t}" empieza en minúscula`);
  }
});

test('sin nada apartado todavía, no se dice que sigue ahí lo que no existe', () => {
  // Las dos frases se leen juntas, una encima de la otra, en la misma
  // pantalla: "lo que apartaste sigue aquí" arriba y "todavía no hay nada
  // apartado" abajo es una app que no sabe lo que dice.
  const abajo = textoDeLoApartado({ dias: 0, total: 0 });
  assert.match(abajo, /Todav[íi]a no hay nada apartado/);

  for (const nombre of ['', 'Daniel']) {
    const arriba = mensajeDelReto({ activo: true, dias: 0, rota: true, nombre });
    assert.ok(!/apartaste|sigue aqu[íi]/i.test(arriba), `"${arriba}" contradice a "${abajo}"`);
  }
});

test('en pausa se ofrece volver sin insistir ni reclamar', () => {
  const texto = mensajeDelReto({ activo: false, dias: 9 });
  assert.match(texto, /sigue aqu[íi]/i);
  assert.match(texto, /cuando quieras/i);
});

// --- La pantalla ----------------------------------------------------------
//
// Las dos fallas que en React Native no se ven al compilar: un estilo que no
// existe (recibe undefined y no pasa nada) y usar `C.algo` sin sacarlo de
// useTema (revienta en el teléfono, no aquí).

const RUTA = new URL('../src/screens/Ahorro.js', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);
const PANTALLA = readFileSync(RUTA, 'utf8');

const fabricaDe = (texto) => {
  const inicio = texto.search(/const crear\s*=\s*\(/);
  const cuerpo = texto.slice(inicio);
  const fin = cuerpo.search(/\n\}\);/);
  const bloque = fin === -1 ? cuerpo : cuerpo.slice(0, fin);

  const claves = new Set();
  for (const m of bloque.matchAll(/^ {2}([A-Za-z_]\w*):\s*\{/gm)) claves.add(m[1]);
  return claves;
};

test('la pantalla no usa ni define estilos de más', () => {
  const definidas = fabricaDe(PANTALLA);
  const usadas = new Set([...PANTALLA.matchAll(/\best\.([A-Za-z_]\w*)/g)].map((m) => m[1]));

  assert.ok(definidas.size > 5, 'no se encontró la fábrica de estilos');

  for (const u of usadas) assert.ok(definidas.has(u), `usa est.${u} y no está definido`);
  for (const d of definidas) assert.ok(usadas.has(d), `define ${d} y nadie lo usa`);
});

test('la pantalla saca los colores de useTema y no del tema global', () => {
  const sinFabrica = PANTALLA.replace(/const crear\s*=\s*\([^)]*\)\s*=>\s*\(\{[\s\S]*?\n\}\);/g, ' ');

  if (/\bC\.[A-Za-z]/.test(sinFabrica)) {
    assert.match(sinFabrica, /const\s*\{[^}]*\bC\b[^}]*\}\s*=\s*useTema\(\)/);
  }

  // Los colores nunca se importan del theme: ese import se ve siempre en modo
  // claro, sin fallar y sin avisar.
  assert.ok(!/PALETAS|from '\.\.\/theme'/.test(PANTALLA), 'importa colores del theme');
});

test('el reto se guarda donde se persiste solo, no en el estado de la pantalla', () => {
  // Ahorro es pantalla de pila: se desmonta al volver atrás. Con el reto en un
  // useState, la persona fijaba 2.000, veía "Van 6.000", salía, volvía y leía
  // "Todavía no hay nada apartado". Perder lo apartado por navegar es el
  // castigo que este módulo promete no hacer.
  assert.match(PANTALLA, /usuario\.ahorro/, 'no lee el reto del estado global');
  assert.match(PANTALLA, /guardarAhorro\(\s*\{\s*tramos/, 'no guarda los tramos en el estado global');

  assert.ok(!/useState\(RETO_INICIAL\)/.test(PANTALLA), 'el reto sigue en un useState');
  assert.ok(
    !/retoAhorro|guardarRetoAhorro/.test(PANTALLA),
    'lee claves que el estado global no tiene, así que siempre cae al estado local',
  );
});

test('la pantalla le pasa al servicio los días marcados', () => {
  // Sin ellos, `fijarMonto` no sabe si hoy ya contó y recalcula un día que la
  // persona ya vio sumado.
  assert.match(PANTALLA, /fijarMonto\([^)]*diasCompletados\)/);
  assert.match(PANTALLA, /reanudar\([^)]*diasCompletados\)/);
});

test('esta pantalla NO repite los hallazgos de gastos hormiga', () => {
  // Se pintaban aquí y en Dinero, con los mismos títulos y las mismas
  // tarjetas. hormiga.js corta en tres justo porque una lista larga se lee
  // como una lista de reproches; enseñarla dos veces deshace esa contención.
  //
  // Esta pantalla es la de lo que se aparta. La de a dónde se va es Dinero, y
  // que solo haya una lo comprueba tests/hormiga.test.mjs.
  assert.ok(!/hallazgosDeGasto/.test(PANTALLA), 'los hallazgos volvieron a esta pantalla');
});

test('la pantalla habla como Brío', () => {
  const CULPA = /fracaso|excusas|deber[íi]as|te pasaste|malgast|derroch/i;
  assert.ok(!CULPA.test(PANTALLA));
  assert.match(PANTALLA, /no gana intereses/, 'falta decir que esto no promete nada');
});
