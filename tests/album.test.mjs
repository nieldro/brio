import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DIAS_DEL_CICLO,
  MINIMO_CUADROS,
  MAXIMO_CUADROS,
  nombreDeFoto,
  claveDeNombre,
  ordenar,
  hayFotoDe,
  seleccionarCuadros,
  ciclos,
  diasParaElCierre,
  estadoDelAlbum,
  textoDelAlbum,
  textoDeLaPelicula,
} from '../src/services/album.js';
import { diasEntreClaves, sumarDias } from '../src/services/fecha.js';

// Fecha local a mediodía: así ninguna prueba depende de la zona del que la corre.
const dia = (clave) => {
  const [a, m, d] = clave.split('-').map(Number);
  return new Date(a, m - 1, d, 12, 0, 0);
};

const foto = (clave) => ({ clave, uri: `file:///album/${clave}.jpg` });
const desde = (inicio, cuantas, paso = 1) =>
  Array.from({ length: cuantas }, (_, i) => foto(sumarDias(inicio, i * paso)));

// --- Nombres de archivo ---------------------------------------------------

test('el nombre del archivo es la fecha', () => {
  assert.equal(nombreDeFoto('2026-08-19'), '2026-08-19.jpg');
  assert.equal(claveDeNombre('2026-08-19.jpg'), '2026-08-19');
});

test('lo que no tenga forma de fecha se ignora', () => {
  // La carpeta puede tener basura del sistema; el álbum no puede romperse.
  assert.equal(claveDeNombre('.thumbnails'), null);
  assert.equal(claveDeNombre('foto.jpg'), null);
  assert.equal(claveDeNombre('2026-08-19.png'), null);
  assert.equal(claveDeNombre(undefined), null);
});

// --- Orden y búsqueda -----------------------------------------------------

test('ordena por fecha sin tocar el original', () => {
  const sueltas = [foto('2026-08-19'), foto('2026-08-01'), foto('2026-08-10')];
  const ordenadas = ordenar(sueltas);

  assert.deepEqual(
    ordenadas.map((f) => f.clave),
    ['2026-08-01', '2026-08-10', '2026-08-19'],
  );
  assert.equal(sueltas[0].clave, '2026-08-19');
});

test('sabe si ya hay foto de un día', () => {
  const fotos = [foto('2026-08-18'), foto('2026-08-19')];
  assert.equal(hayFotoDe(fotos, '2026-08-19'), true);
  assert.equal(hayFotoDe(fotos, '2026-08-20'), false);
  assert.equal(hayFotoDe([], '2026-08-19'), false);
});

// --- Cuadros de la película -----------------------------------------------

test('con pocas fotos entran todas', () => {
  const fotos = desde('2026-01-01', 10);
  assert.equal(seleccionarCuadros(fotos, MAXIMO_CUADROS).length, 10);
});

test('con muchas fotos se reparten, y la primera y la última siempre entran', () => {
  const fotos = desde('2026-01-01', 400);
  const cuadros = seleccionarCuadros(fotos, 50);

  assert.equal(cuadros.length, 50);
  assert.equal(cuadros[0].clave, fotos[0].clave);
  assert.equal(cuadros[cuadros.length - 1].clave, fotos[399].clave);
});

test('los cuadros elegidos quedan en orden', () => {
  const cuadros = seleccionarCuadros(desde('2026-01-01', 300), 40);
  for (let i = 1; i < cuadros.length; i += 1) {
    assert.ok(cuadros[i - 1].clave < cuadros[i].clave, 'los cuadros van hacia adelante');
  }
});

test('el reparto cubre todo el periodo, no solo el principio', () => {
  // El fallo obvio de un muestreo mal hecho es quedarse con las primeras N
  // fotos: la película mostraría medio año y se cortaría en el primer mes.
  const fotos = desde('2026-01-01', 366);
  const cuadros = seleccionarCuadros(fotos, 12);
  const abarcado = diasEntreClaves(cuadros[0].clave, cuadros[cuadros.length - 1].clave);

  assert.equal(abarcado, 365);
});

// --- Ciclos de medio año --------------------------------------------------

test('sin fotos no hay ciclos', () => {
  assert.deepEqual(ciclos([], dia('2026-08-19')), []);
});

test('el medio año se cuenta desde la primera foto, no desde enero', () => {
  const fotos = desde('2026-03-15', 5);
  const [primero] = ciclos(fotos, dia('2026-03-20'));

  assert.equal(primero.desde, '2026-03-15');
  assert.equal(primero.cierra, sumarDias('2026-03-15', DIAS_DEL_CICLO));
  assert.equal(primero.cerrado, false);
});

test('el ciclo se cierra cuando pasa el medio año', () => {
  const fotos = desde('2026-01-01', 20);
  const cierre = sumarDias('2026-01-01', DIAS_DEL_CICLO);

  assert.equal(ciclos(fotos, dia(sumarDias(cierre, -1)))[0].cerrado, false);
  assert.equal(ciclos(fotos, dia(cierre))[0].cerrado, true);
});

test('las fotos se reparten en el ciclo que les toca', () => {
  const primera = foto('2026-01-01');
  const tarde = foto(sumarDias('2026-01-01', DIAS_DEL_CICLO + 3));
  const lista = ciclos([primera, tarde], dia('2027-01-01'));

  assert.equal(lista.length, 2);
  assert.equal(lista[0].n, 0);
  assert.equal(lista[1].n, 1);
  assert.equal(lista[1].fotos[0].clave, tarde.clave);
});

test('un ciclo cerrado con muy pocas fotos no cuenta como medio año', () => {
  // Tres fotos en seis meses no son una película, y celebrarlo como si lo
  // fuera es la clase de premio vacío que el documento no quiere.
  const fotos = [foto('2026-01-01'), foto('2026-02-01'), foto('2026-03-01')];
  const [ciclo] = ciclos(fotos, dia('2027-01-01'));

  assert.equal(ciclo.cerrado, true);
  assert.equal(ciclo.suficientes, false);
  assert.equal(estadoDelAlbum(fotos, dia('2027-01-01')).mediosAnos, 0);
});

test('cuenta los días que faltan para cerrar el medio año', () => {
  const fotos = [foto('2026-01-01')];
  assert.equal(diasParaElCierre(fotos, dia('2026-01-01')), DIAS_DEL_CICLO);
  assert.equal(diasParaElCierre([], dia('2026-01-01')), null);
});

// --- Estado del álbum -----------------------------------------------------

test('álbum vacío', () => {
  const e = estadoDelAlbum([], dia('2026-08-19'));

  assert.equal(e.total, 0);
  assert.equal(e.tieneHoy, false);
  assert.equal(e.ultima, null);
  assert.equal(e.puedeVerPelicula, false);
  assert.equal(e.faltanFotos, MINIMO_CUADROS);
});

test('sabe si ya está la de hoy', () => {
  const hoy = dia('2026-08-19');
  assert.equal(estadoDelAlbum([foto('2026-08-19')], hoy).tieneHoy, true);
  assert.equal(estadoDelAlbum([foto('2026-08-18')], hoy).tieneHoy, false);
});

test('la película se abre a partir de la cuarta foto', () => {
  const hoy = dia('2026-08-19');
  assert.equal(estadoDelAlbum(desde('2026-08-16', 3), hoy).puedeVerPelicula, false);
  assert.equal(estadoDelAlbum(desde('2026-08-16', 4), hoy).puedeVerPelicula, true);
});

test('la última es la más reciente aunque lleguen desordenadas', () => {
  const fotos = [foto('2026-08-19'), foto('2026-08-01'), foto('2026-08-10')];
  assert.equal(estadoDelAlbum(fotos, dia('2026-08-19')).ultima.clave, '2026-08-19');
});

// --- Voz ------------------------------------------------------------------

const TODOS_LOS_TEXTOS = () => {
  const hoy = dia('2026-08-19');
  return [
    textoDelAlbum(estadoDelAlbum([], hoy)),
    textoDelAlbum(estadoDelAlbum([foto('2026-08-19')], hoy)),
    textoDelAlbum(estadoDelAlbum(desde('2026-08-16', 4), hoy)),
    textoDelAlbum(estadoDelAlbum(desde('2026-02-01', 30, 6), hoy)),
    textoDeLaPelicula(desde('2026-01-01', 10)),
    textoDeLaPelicula(desde('2026-01-01', 200)),
  ];
};

test('el álbum nunca nombra el cuerpo, el peso ni los días perdidos', () => {
  // Regla 1 y regla 6 del documento. Si alguien agrega un texto que compare
  // o que reproche, esta prueba lo para antes de que llegue a la pantalla.
  const prohibidas = [
    'peso',
    'kilo',
    'cuerpo',
    'gordo',
    'flaco',
    'antes y después',
    'perdiste',
    'fallaste',
    'te faltaron',
    'llevas sin',
  ];

  for (const texto of TODOS_LOS_TEXTOS()) {
    for (const mala of prohibidas) {
      assert.ok(
        !texto.toLowerCase().includes(mala),
        `"${texto}" no debería decir "${mala}"`,
      );
    }
  }
});

test('el álbum no promete resultados ni usa signos de admiración', () => {
  for (const texto of TODOS_LOS_TEXTOS()) {
    assert.ok(!texto.includes('!'), `"${texto}" lleva signo de admiración`);
    assert.ok(!texto.includes('¡'), `"${texto}" lleva signo de admiración`);
    assert.ok(!/cambio|resultado|transformaci/i.test(texto), `"${texto}" promete un resultado`);
  }
});

test('con una sola foto no dice "1 fotos"', () => {
  const texto = textoDelAlbum(estadoDelAlbum([foto('2026-08-19')], dia('2026-08-19')));
  assert.ok(!texto.includes('1 fotos'), texto);
});

test('la película habla del tiempo, no del cuerpo', () => {
  assert.match(textoDeLaPelicula(desde('2026-01-01', 10)), /10 días/);
  assert.match(textoDeLaPelicula(desde('2026-01-01', 200)), /meses/);
  assert.equal(textoDeLaPelicula([foto('2026-01-01')]), 'Todavía no hay suficientes fotos.');
});
