import test from 'node:test';
import assert from 'node:assert/strict';

import { validarGasto, promptGasto, CATEGORIAS } from '../src/lib/gastoJson.js';
import { extraerJson } from '../src/lib/planJson.js';

const HOY = '2026-08-19';

const BUENO = {
  comercio: 'Supermercado La 14',
  total: 45300,
  fecha: '2026-08-18',
  categoria: 'mercado',
  nota: 'mercado de la semana',
  mensaje: 'Quedó anotado el mercado. Ya está.',
};

const con = (cambios) => validarGasto({ ...BUENO, ...cambios }, { hoy: HOY });

// --- Lo que sí pasa -------------------------------------------------------

test('una lectura limpia pasa y llega normalizada', () => {
  const r = con({ comercio: '  Supermercado La 14  ' });

  assert.equal(r.ok, true, r.errores.join('; '));
  assert.deepEqual(r.errores, []);
  assert.equal(r.resultado.hayFactura, true);
  assert.equal(r.resultado.monto, 45300);
  assert.equal(r.resultado.comercio, 'Supermercado La 14');
  assert.equal(r.resultado.fecha, '2026-08-18');
  assert.equal(r.resultado.categoria, 'mercado');
  assert.equal(r.resultado.categoriaSegura, true);
});

test('sirve con el JSON envuelto en comillas de markdown', () => {
  const crudo = '```json\n' + JSON.stringify(BUENO) + '\n```';
  assert.equal(validarGasto(extraerJson(crudo), { hoy: HOY }).ok, true);
});

test('"aquí no hay factura" es una respuesta válida, no un fallo', () => {
  const r = validarGasto({ total: null }, { hoy: HOY });

  assert.equal(r.ok, true);
  assert.equal(r.resultado.hayFactura, false);
});

test('una factura sin nombre de comercio se acepta igual', () => {
  // Hay tirillas donde el nombre no se lee. Exigirlo obliga a inventarlo.
  const r = con({ comercio: '', nota: '' });
  assert.equal(r.ok, true, r.errores.join('; '));
  assert.equal(r.resultado.comercio, null);
  assert.equal(r.resultado.nota, null);
});

// --- El total: el número que se le va a quedar anotado a alguien ----------

test('el total llega como sea que el modelo lo escriba', () => {
  assert.equal(con({ total: '45.300' }).resultado.monto, 45300);
  assert.equal(con({ total: '$45.300' }).resultado.monto, 45300);
  assert.equal(con({ total: 45300.0 }).resultado.monto, 45300);
});

test('los centavos no multiplican el gasto por cien', () => {
  // "45.300,00" son cuarenta y cinco mil trescientos, no cuatro millones.
  assert.equal(con({ total: '45.300,00' }).resultado.monto, 45300);
  assert.equal(con({ total: '1.234,56' }).resultado.monto, 1234);
});

test('rechaza un total que no es plata', () => {
  for (const total of [0, -100, 'muchos', {}, '$']) {
    assert.equal(con({ total }).ok, false, JSON.stringify(total));
  }
});

test('rechaza un total imposible en vez de anotarlo', () => {
  // Un OCR que lee mal pone ceros de más, y ese número se quedaría en el mes.
  const r = con({ total: 999_000_000_000 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /imposible/.test(e)), r.errores.join('; '));
});

// --- La regla de este archivo: nadie opina sobre la plata de nadie -------

test('rechaza opinar sobre la compra', () => {
  const mensajes = [
    'Eso está caro para lo que es.',
    'Buen precio, te salió barato.',
    'Gastaste mucho este mes.',
    'Deberías controlar estos gastos.',
    'Podrías ahorrar en esto.',
    'Trata de evitar estas compras.',
    'Es un gasto innecesario.',
    'Te pasaste del presupuesto.',
  ];

  for (const mensaje of mensajes) {
    const r = con({ mensaje });
    assert.equal(r.ok, false, `debería rechazar: ${mensaje}`);
    assert.ok(
      r.errores.some((e) => e.includes('opina')),
      `${mensaje} → ${r.errores.join('; ')}`,
    );
  }
});

test('tampoco se opina desde la nota, que sí la escribe el modelo', () => {
  assert.equal(con({ nota: 'antojo innecesario' }).ok, false);
  assert.equal(con({ nota: 'te pasaste con esto' }).ok, false);
});

test('el nombre del comercio se lee, no se juzga', () => {
  // El comercio no lo redacta el modelo: lo copia de la tirilla. Filtrarlo
  // como si fuera una opinión rechazaba facturas perfectamente legibles, y la
  // persona veía un fallo sin entender por qué.
  for (const comercio of [
    'Farmacia El Ahorro', // ahorr\w*
    'Tienda La Barata', // barat[oa]s?
    'Almacén El Lujo', // lujo
    'Distribuidora Control Total', // control\w*
  ]) {
    const r = con({ comercio });
    assert.equal(r.ok, true, `${comercio} → ${r.errores.join('; ')}`);
    assert.equal(r.resultado.comercio, comercio);
  }
});

test('al comercio le quedan el tope de largo y los signos de admiración', () => {
  // Los dos frenos que siguen teniendo sentido en un nombre propio: que quepa
  // en la pantalla y que no grite.
  assert.equal(con({ comercio: 'a'.repeat(200) }).ok, false);
  assert.equal(con({ comercio: 'Tienda Ya!' }).ok, false);
});

test('rechaza comentar la comida de una factura de mercado', () => {
  // Una tirilla de supermercado es una lista de comida, y la regla 1 manda
  // aquí también: ni calorías, ni dieta, ni si algo engorda.
  for (const mensaje of [
    'Muchas calorías en ese mercado.',
    'Eso no entra en una dieta.',
    'La gaseosa engorda.',
  ]) {
    assert.equal(con({ mensaje }).ok, false, mensaje);
  }
});

test('un mensaje que solo confirma sí pasa', () => {
  // La guarda no puede volverse tan estricta que no deje pasar nada.
  const r = con({ mensaje: 'Quedó anotado. Sigue tu mes.' });
  assert.equal(r.ok, true, r.errores.join('; '));
});

// --- Voz de Brío ----------------------------------------------------------

test('rechaza los signos de admiración', () => {
  assert.equal(con({ mensaje: 'Quedó anotado.' }).ok, true);
  assert.equal(con({ mensaje: 'Quedó anotado!' }).ok, false);
  assert.equal(con({ mensaje: '¡Listo, quedó anotado.' }).ok, false);
});

test('rechaza pasar de dos frases', () => {
  assert.equal(con({ mensaje: 'Quedó anotado. Ya está.' }).ok, true);

  const r = con({ mensaje: 'Quedó anotado. Ya está. Nos vemos mañana.' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => e.includes('2 frases')));
});

test('los puntos de miles no cuentan como frases', () => {
  // "$45.300" tiene dos puntos dentro: sin sacar el monto, una sola frase con
  // plata parecería tres y toda lectura buena se rechazaría.
  assert.equal(con({ mensaje: 'Quedaron anotados 45.300 del mercado.' }).ok, true);
});

test('rechaza las palabras prohibidas del documento', () => {
  assert.equal(con({ mensaje: 'Eso es un fracaso.' }).ok, false);
});

test('rechaza los textos larguísimos', () => {
  assert.equal(con({ mensaje: 'a'.repeat(300) }).ok, false);
});

// --- La categoría: no tumba la lectura, pero no adivina en silencio -------

test('las ocho categorías del producto son las válidas', () => {
  assert.deepEqual(CATEGORIAS, [
    'mercado', 'transporte', 'casa', 'salud', 'ocio', 'antojos', 'suscripciones', 'otros',
  ]);

  for (const categoria of CATEGORIAS) {
    assert.equal(con({ categoria }).resultado.categoria, categoria);
  }
});

test('una categoría inventada cae en otros y se avisa', () => {
  const r = con({ categoria: 'cripto' });

  assert.equal(r.ok, true);
  assert.equal(r.resultado.categoria, 'otros');
  assert.equal(r.resultado.categoriaSegura, false);
});

test('"otros" del modelo significa "no sé", y así se marca', () => {
  assert.equal(con({ categoria: 'otros' }).resultado.categoriaSegura, false);
});

// --- La fecha -------------------------------------------------------------

test('una fecha imposible no tumba la factura: se deja vacía', () => {
  for (const fecha of ['2026-02-31', 'ayer', '', null, 12345]) {
    const r = con({ fecha });
    assert.equal(r.ok, true, JSON.stringify(fecha));
    assert.equal(r.resultado.fecha, null, JSON.stringify(fecha));
  }
});

test('no se acepta una factura del futuro ni de hace años', () => {
  assert.equal(con({ fecha: '2026-08-20' }).resultado.fecha, null);
  assert.equal(con({ fecha: '2020-01-01' }).resultado.fecha, null);
  assert.equal(con({ fecha: HOY }).resultado.fecha, HOY);
});

// --- Estructura -----------------------------------------------------------

test('no revienta con basura', () => {
  for (const basura of [null, undefined, 'texto suelto', 42, []]) {
    const r = validarGasto(basura, { hoy: HOY });
    assert.equal(typeof r.ok, 'boolean');
    if (r.ok) assert.equal(r.resultado.hayFactura, false);
  }
});

test('"no hay factura" y "no entendí la respuesta" no son lo mismo', () => {
  // Confundirlos sería lo peor: un fallo del modelo se le mostraría a la
  // persona como "en tu foto no hay factura", y no se reintentaría.
  const sinFactura = validarGasto({ total: null }, { hoy: HOY });
  assert.equal(sinFactura.ok, true);
  assert.equal(sinFactura.resultado.hayFactura, false);

  const ilegible = validarGasto(extraerJson('lo siento, no puedo ayudarte con eso'), { hoy: HOY });
  assert.equal(ilegible.ok, false);
  assert.equal(ilegible.resultado, null);
});

// --- El prompt: la otra mitad de la misma regla ---------------------------

test('el prompt pide exactamente lo que el validador obliga', () => {
  const p = promptGasto({ nombre: 'Ana', hoy: HOY });

  for (const categoria of CATEGORIAS) assert.ok(p.includes(categoria), categoria);
  assert.match(p, /TOTAL A PAGAR/);
  assert.match(p, /\{"total": null\}/);
  assert.match(p, /máximo 2 frases/i);
  assert.match(p, /caro/i); // le prohíbe opinar con la palabra exacta
  assert.ok(p.includes(HOY), 'el modelo necesita saber qué día es hoy');
});

test('el prompt no grita ni supone quién eres', () => {
  const p = promptGasto({ nombre: '', hoy: HOY });

  assert.ok(!p.includes('¡'), 'el prompt lleva signos de admiración');
  assert.match(p, /alguien/); // sin nombre, no se inventa uno
});
