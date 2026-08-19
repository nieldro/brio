import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  PASOS_QUE_CUENTAN,
  pasosLegibles,
  fraseDePasos,
  lecturaDeHoy,
  explicacionDe,
  diasQueCaminaste,
  pruebaDeMovimiento,
} from '../src/services/movimiento.js';

const SENSOR = { disponible: true, permiso: true, historico: true };

// Los pasos son la métrica más fácil de convertir en una vara para medirse.
// Estas pruebas están para que nadie la instale sin querer.

// --- Cuando no hay nada que decir, no se dice nada -------------------------

test('sin sensor, sin permiso o sin lectura, la tarjeta no aparece', () => {
  for (const caso of [
    [{ disponible: false, permiso: false }, 'sin-sensor'],
    [{ disponible: true, permiso: false }, 'sin-permiso'],
    [{ ...SENSOR, pasos: null }, 'sin-lectura'],
  ]) {
    const l = lecturaDeHoy(caso[0]);
    assert.equal(l.visible, false);
    assert.equal(l.motivo, caso[1]);
  }
});

test('un día de pocos pasos no se comenta', () => {
  // Lo importante no es que no se felicite: es que NO se diga nada. Ni un
  // "hoy poco", ni un cero, ni la cifra suelta. Un teléfono que pasó la
  // tarde en la mesa marca trescientos pasos y eso no habla de nadie.
  const l = lecturaDeHoy({ ...SENSOR, pasos: 300 });

  assert.equal(l.visible, false);
  assert.equal(l.motivo, 'callado');
  assert.equal(l.texto, null);
  assert.equal(l.frase, null);
  assert.equal(l.pasos, null, 'la cifra baja ni siquiera se devuelve');
});

test('el silencio empieza justo debajo del umbral, no encima', () => {
  assert.equal(lecturaDeHoy({ ...SENSOR, pasos: PASOS_QUE_CUENTAN - 1 }).visible, false);
  assert.equal(lecturaDeHoy({ ...SENSOR, pasos: PASOS_QUE_CUENTAN }).visible, true);
});

test('el umbral no se presenta nunca como una meta', () => {
  // Si algún texto lo nombrara, dejaría de ser un silencio y pasaría a ser
  // un mínimo que cumplir, que es justo lo que no puede ser.
  for (const motivo of ['sin-sensor', 'sin-permiso', 'sin-lectura', 'callado']) {
    const e = explicacionDe(motivo);
    assert.ok(e, motivo);
    assert.ok(!/\d/.test(e), `"${e}" lleva una cifra`);
  }
});

// --- Cuando sí hay algo ----------------------------------------------------

test('la cuenta se lee en miles, como se escribe acá', () => {
  assert.equal(pasosLegibles(8240), '8.240');
  assert.equal(pasosLegibles(999), '999');
  assert.equal(pasosLegibles(1000000), '1.000.000');
  assert.equal(pasosLegibles(-5), '0');
  assert.equal(pasosLegibles(null), '0');
});

test('la lectura trae el número y una frase, y nada más', () => {
  const l = lecturaDeHoy({ ...SENSOR, pasos: 6420 });

  assert.equal(l.visible, true);
  assert.equal(l.pasos, 6420);
  assert.equal(l.texto, '6.420 pasos');
  assert.ok(l.frase.length > 0);
});

test('no se promete un día entero que no se midió', () => {
  // En Android el sistema no deja preguntar hacia atrás: la cuenta arranca
  // cuando arranca la app. Decir "hoy" ahí sería mentir con una cifra.
  assert.equal(lecturaDeHoy({ ...SENSOR, pasos: 5000, historico: true }).detalle, 'hoy');
  assert.equal(
    lecturaDeHoy({ ...SENSOR, pasos: 5000, historico: false }).detalle,
    'desde que abriste la app',
  );
});

test('los tres tramos afirman, y no hay un cuarto que reproche', () => {
  const frases = [2000, 6000, 12000].map(fraseDePasos);

  assert.equal(new Set(frases).size, 3, 'los tramos deben decir cosas distintas');
  assert.equal(fraseDePasos(PASOS_QUE_CUENTAN - 1), null, 'debajo del umbral no hay frase');
});

test('no existe una meta, ni una barra, ni un porcentaje', () => {
  // La forma más silenciosa de meter una meta es un campo nuevo en la salida.
  // Esta lista es la puerta: si alguien agrega "meta" o "restante", falla.
  const l = lecturaDeHoy({ ...SENSOR, pasos: 6420 });

  assert.deepEqual(Object.keys(l).sort(), [
    'detalle',
    'frase',
    'motivo',
    'pasos',
    'texto',
    'visible',
  ]);
});

// --- La huella que queda ---------------------------------------------------

test('se cuentan los días con caminata, no los pasos de toda la vida', () => {
  // Un total que solo sube no dice nada de nadie, y un promedio invita a
  // compararse consigo mismo, que es peor.
  const semana = {
    '2026-08-17': 8200,
    '2026-08-18': 140,
    '2026-08-19': 3400,
    '2026-08-20': 0,
  };

  assert.equal(diasQueCaminaste(semana), 2);
});

test('sin caminatas no se inventa una prueba', () => {
  assert.equal(pruebaDeMovimiento({}), null);
  assert.equal(pruebaDeMovimiento({ '2026-08-18': 200 }), null);
});

test('la prueba entra con la misma forma que las del día difícil', () => {
  const una = pruebaDeMovimiento({ '2026-08-19': 5000 });
  assert.deepEqual(Object.keys(una).sort(), ['cifra', 'clave', 'texto']);
  assert.equal(una.cifra, 1);
  assert.match(una.texto, /^día /);

  const varias = pruebaDeMovimiento({ '2026-08-18': 5000, '2026-08-19': 9000 });
  assert.equal(varias.cifra, 2);
  assert.match(varias.texto, /^días /);
});

// --- La voz ----------------------------------------------------------------

test('los pasos no se convierten en calorías ni en nada que se gaste', () => {
  const PROHIBIDO = /calor[íi]as?|\bkcal\b|quemar|grasa|kil[oó]\w*|\bpeso\b|gast\w*/i;

  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(!PROHIBIDO.test(t), `"${t}" convierte los pasos en otra cosa`);
  }
});

test('ningún texto pone una meta ni cuenta lo que faltó', () => {
  const VARA =
    /\bmeta\b|objetivo|te falta\w*|faltan|no llegaste|casi lo|r[ée]cord|mejor d[íi]a|promedio|racha/i;

  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(!VARA.test(t), `"${t}" pone una vara`);
  }
});

test('ningún texto exige, reprocha ni grita', () => {
  const EXIGENCIA =
    /\b(deber[íi]as|tienes que|[áa]nimo|esfu[ée]rzate|no te rindas|vamos|dale ya)\b/i;
  const REPROCHE = /fallaste|perdiste|te faltaron|rompiste|poco hoy|sedentar\w*/i;

  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(!EXIGENCIA.test(t), `"${t}" exige`);
    assert.ok(!REPROCHE.test(t), `"${t}" reprocha`);
    assert.ok(!t.includes('!') && !t.includes('¡'), `"${t}" grita`);
  }
});

test('los textos van en formas neutras de género', () => {
  const GENERO = /\b(listo|lista|cansado|cansada|orgulloso|orgullosa|solo tú|bienvenid[oa])\b/i;

  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(!GENERO.test(t), `"${t}" supone el género`);
  }
});

test('la voz de Brío: máximo dos frases', () => {
  const frases = (t) => t.split(/[.?…]+/).map((f) => f.trim()).filter(Boolean).length;

  for (const t of TODOS_LOS_TEXTOS()) {
    assert.ok(frases(t) <= 2, `"${t}" pasa de dos frases`);
  }
});

// --- Que esté enchufado, no solo escrito ----------------------------------
//
// Todo lo de arriba estuvo un tiempo perfectamente probado y completamente
// muerto: ni `lecturaDeHoy`, ni `explicacionDe`, ni `seguirPasos`, ni
// `pedirPermisoDePasos` los llamaba nadie en src/. Como el permiso no lo
// pedía nadie, `estadoDelPodometro` iba a devolver permiso: false para
// siempre y la tarjeta no habría aparecido nunca en ningún teléfono.
//
// Un módulo que no se ejecuta pasa todas las pruebas de unidad del mundo. Por
// eso esta parte no mira lo que las funciones devuelven: mira si alguien las
// llama. El sitio donde se enchufan es state/usePasos.js, que es lo que Hoy y
// Ajustes montan.

const RAIZ = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function archivosJs(dir) {
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivosJs(ruta));
    else if (nombre.endsWith('.js')) salida.push(ruta);
  }
  return salida;
}

// Los dos archivos del módulo no cuentan: usarse a sí mismo no es estar
// enchufado. Lo que se busca es quién los llama desde fuera.
const PROPIOS = [join(RAIZ, 'lib', 'pasos.js'), join(RAIZ, 'services', 'movimiento.js')];
const RESTO = archivosJs(RAIZ).filter((r) => !PROPIOS.includes(r));

test('el podómetro está enchufado a algo que se monta, no solo escrito', () => {
  const codigo = RESTO.map((r) => readFileSync(r, 'utf8')).join('\n');

  for (const nombre of [
    'estadoDelPodometro',
    'pedirPermisoDePasos',
    'seguirPasos',
    'lecturaDeHoy',
    'explicacionDe',
  ]) {
    assert.match(codigo, new RegExp(`\\b${nombre}\\b`), `nadie llama a ${nombre}: es código muerto`);
  }
});

// Se lee cuando hace falta y no al cargar el archivo: si el hook desaparece,
// lo que tiene que verse es qué prueba falla y por qué, no un error de
// lectura que se lleva por delante a las demás.
const RUTA_HOOK = join(RAIZ, 'state', 'usePasos.js');

function hook() {
  assert.ok(existsSync(RUTA_HOOK), 'no existe state/usePasos.js: nadie monta el podómetro');
  return readFileSync(RUTA_HOOK, 'utf8');
}

test('la suscripción se corta al salir de la pantalla', () => {
  // `seguirPasos` devuelve su propia limpieza. Si el efecto no la devuelve,
  // el teléfono sigue contando pasos con la pantalla cerrada: batería para
  // alimentar un número que ni siquiera se guarda.
  assert.match(hook(), /return seguirPasos\(/);
});

test('el permiso se pide donde la persona lo pidió, no al abrir la app', () => {
  // Un permiso de actividad en la cara al arrancar se niega por reflejo, y un
  // permiso negado no se vuelve a pedir nunca.
  const fuente = hook();
  const corte = fuente.indexOf('const activar');
  assert.ok(corte > 0, 'el hook ya no ofrece con qué activarlo');

  assert.ok(
    !/pedirPermisoDePasos\(/.test(fuente.slice(0, corte)),
    'el permiso se pide al montar, antes de que nadie lo haya pedido',
  );
  assert.match(fuente.slice(corte), /pedirPermisoDePasos\(/);
});

// Todo lo que un ojo puede llegar a leer sobre los pasos.
function TODOS_LOS_TEXTOS() {
  const salida = [];

  for (const pasos of [1500, 6000, 12000]) {
    const l = lecturaDeHoy({ ...SENSOR, pasos });
    salida.push(l.frase, l.detalle);
  }

  for (const motivo of ['sin-sensor', 'sin-permiso', 'sin-lectura', 'callado']) {
    salida.push(explicacionDe(motivo));
  }

  salida.push(pruebaDeMovimiento({ '2026-08-19': 5000 }).texto);
  salida.push(pruebaDeMovimiento({ '2026-08-18': 5000, '2026-08-19': 5000 }).texto);

  return [...new Set(salida)];
}
