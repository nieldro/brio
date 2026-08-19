import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import * as pareja from '../src/services/pareja.js';
import {
  ALFABETO,
  LARGO_CODIGO,
  DIAS_INVITACION,
  MAXIMO_MIEMBROS,
  MOTIVOS_ENTRADA,
  RETOS_PAREJA,
  HITOS,
  retoPorClave,
  generarCodigo,
  normalizarCodigo,
  formatearCodigo,
  codigoValido,
  revisarCodigo,
  crearReto,
  esMiembro,
  elOtro,
  invitacionVigente,
  vencimientoDeInvitacion,
  renovarInvitacion,
  unirseConCodigo,
  salir,
  yaSume,
  sumar,
  avance,
  estadoDelReto,
  companiaReciente,
  losDosHoy,
  hitoAlcanzado,
  textoDeAvance,
  textoDeCompania,
  textoDeEstado,
  textoDelBoton,
  textoParaInvitar,
  textoAlSalir,
} from '../src/services/pareja.js';

const ANA = 'usuario-ana';
const LUIS = 'usuario-luis';
const OTRA = 'usuario-tercera';

const DIA = (n) => new Date(2026, 7, n, 12); // agosto de 2026
const LUNES = DIA(10);
const MARTES = DIA(11);
const MIERCOLES = DIA(12);

// Lo que devuelve la búsqueda por código cuando sí encontró el reto. En la
// app la hace el servidor: este teléfono no puede ver el reto de otra persona.
const hallado = (reto) => ({ estado: 'ok', reto });

// Un reto de dos, con el código ya apagado, listo para las pruebas de avance.
function retoActivo(hoy = LUNES) {
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy });
  return unirseConCodigo({ quien: LUIS, codigo: 'abc-d23', hallazgo: hallado(solo), hoy }).reto;
}

// --- El catálogo ----------------------------------------------------------

test('las claves de los retos no se repiten', () => {
  const claves = RETOS_PAREJA.map((r) => r.clave);
  assert.equal(new Set(claves).size, claves.length);
});

test('cada reto tiene una meta conjunta que se puede alcanzar', () => {
  for (const r of RETOS_PAREJA) {
    assert.ok(r.meta > 0, `${r.clave} no tiene meta`);
    assert.ok(r.meta <= 40, `${r.clave} pide ${r.meta}, que es una condena`);
  }
});

test('ningún reto manda dejar de hacer algo ni habla del cuerpo', () => {
  const PROHIBIDO =
    /calor[íi]as?|gramos?|\bkcal\b|kilos?|\bpeso\b|adelgaz\w*|dieta\w*|deja de|no comas|evit\w*/i;

  for (const r of RETOS_PAREJA) {
    assert.ok(!PROHIBIDO.test(`${r.titulo} ${r.texto}`), r.clave);
  }
});

test('una clave inventada no arma un reto vacío', () => {
  assert.equal(retoPorClave('inventado'), null);
  assert.equal(crearReto({ clave: 'inventado', quien: ANA, codigo: 'ABCD23' }), null);
});

// --- El código de invitación ----------------------------------------------

test('el alfabeto deja fuera lo que se confunde al dictarlo', () => {
  for (const c of '01ILOU') {
    assert.ok(!ALFABETO.includes(c), `${c} se parece a otro y no debería estar`);
  }
});

test('mil códigos seguidos y ninguno lleva un carácter confundible', () => {
  for (let i = 0; i < 1000; i += 1) {
    const codigo = generarCodigo();
    assert.equal(codigo.length, LARGO_CODIGO);
    for (const c of codigo) {
      assert.ok(ALFABETO.includes(c), `salió "${c}" en ${codigo}`);
    }
  }
});

test('el código se puede dictar por teléfono: se parte en dos', () => {
  assert.equal(formatearCodigo('ABCD23'), 'ABC-D23');
  // Y lo que se dicta vuelve a ser lo que se guardó.
  assert.equal(normalizarCodigo(formatearCodigo('ABCD23')), 'ABCD23');
});

test('se acepta como venga escrito: minúsculas, espacios y guiones', () => {
  for (const escrito of ['abcd23', 'ABC-D23', ' abc d23 ', 'abc.d23', 'AbC-d23']) {
    assert.equal(normalizarCodigo(escrito), 'ABCD23', escrito);
    assert.ok(codigoValido(escrito), escrito);
  }
});

test('un código con letras de fuera del alfabeto no vale', () => {
  assert.equal(codigoValido('ABCD2I'), false); // la i no existe aquí
  assert.equal(codigoValido('ABCD2'), false); // corto
  assert.equal(codigoValido(''), false);
  assert.equal(codigoValido(null), false);
});

test('el aviso del código dice qué falta, no qué hizo mal', () => {
  assert.match(revisarCodigo(''), /escribe/i);
  assert.match(revisarCodigo('ABCD2'), new RegExp(String(LARGO_CODIGO)));
  assert.equal(revisarCodigo('abc-d23'), null);
});

// Los caracteres que el alfabeto deja fuera, sacados del alfabeto mismo: si
// mañana se saca uno más, esta lista crece sola y la prueba de abajo exige que
// el aviso lo nombre.
const FUERA = [...'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((c) => !ALFABETO.includes(c));

const NOMBRE_DE = {
  0: 'cero',
  1: 'uno',
  I: '\\bi\\b',
  L: '\\bele\\b',
  O: '\\bo\\b',
  U: '\\bu\\b',
};

test('el aviso nombra TODOS los caracteres que no van en un código', () => {
  // Decía "no van el cero, el uno, la i ni la o" mientras rechazaba también la
  // ele y la u. Quien escribía 'ABCDU3' leía una lista donde su letra no
  // estaba y se quedaba buscando un error que, según el aviso, no existía.
  assert.deepEqual(FUERA, ['0', '1', 'I', 'L', 'O', 'U']);

  for (const caracter of FUERA) {
    const texto = revisarCodigo(`ABCD${caracter}3`);
    assert.ok(texto, `'${caracter}' pasa como si fuera un código bueno`);

    const nombre = NOMBRE_DE[caracter];
    assert.ok(nombre, `nadie sabe cómo se llama '${caracter}' en el aviso`);
    assert.match(texto, new RegExp(nombre, 'i'), `"${texto}" no nombra '${caracter}'`);
  }
});

test('el código se puede sembrar para que la prueba no dependa del azar', () => {
  const azar = () => 0; // siempre el primer carácter del alfabeto
  assert.equal(generarCodigo(azar), ALFABETO[0].repeat(LARGO_CODIGO));
});

test('la invitación vence, para que un código pegado en un grupo no abra puertas', () => {
  const reto = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: DIA(1) });

  assert.equal(vencimientoDeInvitacion(reto), '2026-08-08');
  assert.equal(invitacionVigente(reto, DIA(1)), true);
  assert.equal(invitacionVigente(reto, DIA(1 + DIAS_INVITACION)), true);
  assert.equal(invitacionVigente(reto, DIA(2 + DIAS_INVITACION)), false);
});

test('renovar la invitación no borra lo que llevan', () => {
  let reto = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: DIA(1) });
  reto = sumar(reto, { quien: ANA, hoy: DIA(1) });

  const renovado = renovarInvitacion(reto, { codigo: 'MNPQ45', hoy: DIA(20) });

  assert.equal(renovado.codigo, 'MNPQ45');
  assert.equal(invitacionVigente(renovado, DIA(20)), true);
  assert.equal(avance(renovado).hechos, 1);
});

test('con los dos dentro ya no se puede volver a abrir la puerta', () => {
  const reto = retoActivo();
  assert.deepEqual(renovarInvitacion(reto, { codigo: 'MNPQ45', hoy: MARTES }), reto);
});

// --- Crear y unirse -------------------------------------------------------

test('el que crea el reto queda dentro, y solo él', () => {
  const reto = crearReto({ clave: 'caminar', quien: ANA, codigo: 'abc-d23', hoy: LUNES });

  assert.deepEqual(reto.miembros, [ANA]);
  assert.deepEqual(reto.aportes, []);
  assert.equal(reto.codigo, 'ABCD23'); // se guarda normalizado
  assert.equal(estadoDelReto(reto, LUNES), 'esperando');
});

test('unirse con el código mete al segundo y apaga el código', () => {
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: LUNES });
  const r = unirseConCodigo({ quien: LUIS, codigo: 'abc-d23', hallazgo: hallado(solo), hoy: LUNES });

  assert.equal(r.ok, true);
  assert.equal(r.error, null);
  assert.deepEqual(r.reto.miembros, [ANA, LUIS]);
  assert.equal(r.reto.codigo, null);
  assert.equal(estadoDelReto(r.reto, LUNES), 'activo');
});

// La prueba del defecto que dejaba media pantalla sin salida: quien llega
// invitado NO tiene ningún reto, así que unirse no puede pedirle uno. Cuando
// lo pedía, el invitado llegaba con null y la app le contestaba "ese código no
// me suena" a la única persona que lo había escrito bien.
test('quien llega invitado entra sin tener ningún reto propio', () => {
  const delOtro = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: LUNES });
  const r = unirseConCodigo({
    quien: LUIS,
    codigo: 'abc-d23',
    hallazgo: hallado(delOtro),
    hoy: LUNES,
  });

  assert.equal(r.ok, true);
  assert.deepEqual(r.reto.miembros, [ANA, LUIS]);
  // Y lo que se encontró no se toca: el reto nuevo es otro objeto.
  assert.deepEqual(delOtro.miembros, [ANA]);
  assert.equal(delOtro.codigo, 'ABCD23');
});

test('sin poder buscar el reto, no se acusa a nadie de escribir mal', () => {
  // Sin nube no hay forma de encontrar el reto de otra persona, y eso se dice
  // tal cual. Mandar a revisar un código correcto es culpar a quien acertó.
  const r = unirseConCodigo({ quien: LUIS, codigo: 'abc-d23', hoy: LUNES });

  assert.equal(r.ok, false);
  assert.ok(!/no me suena|rev[íi]salo/i.test(r.error), `"${r.error}" insinúa que escribió mal`);
  assert.match(r.error, /conexi[óo]n/i);
});

test('venció y no existe son dos cosas distintas y se dicen distinto', () => {
  const vencido = unirseConCodigo({
    quien: LUIS,
    codigo: 'ABCD23',
    hallazgo: { estado: 'vencido' },
    hoy: LUNES,
  });
  const inventado = unirseConCodigo({
    quien: LUIS,
    codigo: 'ABCD23',
    hallazgo: { estado: 'no-existe' },
    hoy: LUNES,
  });

  assert.match(vencido.error, /venci/i);
  assert.match(inventado.error, /no me suena/i);
  assert.notEqual(vencido.error, inventado.error);
});

test('un código que no es no deja entrar, y el reto encontrado no se toca', () => {
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: LUNES });
  const r = unirseConCodigo({ quien: LUIS, codigo: 'MNPQ45', hallazgo: hallado(solo), hoy: LUNES });

  assert.equal(r.ok, false);
  assert.ok(r.error);
  assert.deepEqual(solo.miembros, [ANA]);
});

test('con el código vencido se pide uno nuevo, sin regañar', () => {
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: DIA(1) });
  const r = unirseConCodigo({
    quien: LUIS,
    codigo: 'ABCD23',
    hallazgo: hallado(solo),
    hoy: DIA(20),
  });

  assert.equal(r.ok, false);
  assert.match(r.error, /venci|nuevo/i);
});

test('un tercero no entra: dos ya es una pareja, tres es una red social', () => {
  const activo = retoActivo();
  // Aunque alguien se hubiera guardado el código de antes.
  const conCodigo = { ...activo, codigo: 'ABCD23', codigoDesde: '2026-08-10' };
  const r = unirseConCodigo({
    quien: OTRA,
    codigo: 'ABCD23',
    hallazgo: hallado(conCodigo),
    hoy: MARTES,
  });

  assert.equal(r.ok, false);
  assert.equal(conCodigo.miembros.length, MAXIMO_MIEMBROS);
});

test('quien ya está dentro no entra dos veces', () => {
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: LUNES });
  const r = unirseConCodigo({ quien: ANA, codigo: 'ABCD23', hallazgo: hallado(solo), hoy: LUNES });

  assert.equal(r.ok, false);
  assert.equal(solo.miembros.length, 1);
});

test('salir es un toque y no deja nada colgando', () => {
  const activo = retoActivo();
  assert.equal(salir(activo, ANA), null);
});

test('para el que se queda, el reto sigue y lo que llevan no se borra', () => {
  let reto = retoActivo();
  reto = sumar(reto, { quien: ANA, hoy: LUNES });
  reto = sumar(reto, { quien: LUIS, hoy: LUNES });

  // Así llega el reto desde el servidor después de que Ana se fue: un
  // miembro y sin código. De ahí sale el estado 'solo', sin guardar banderas.
  const quedan = { ...reto, miembros: [LUIS], codigo: null };

  assert.equal(estadoDelReto(quedan, MARTES), 'solo');
  assert.equal(avance(quedan).hechos, 2);
  assert.equal(elOtro(quedan, LUIS), null);
});

// --- Avanzar --------------------------------------------------------------

test('el reto avanza con lo que haga cualquiera de los dos', () => {
  let reto = retoActivo();
  assert.equal(avance(reto).hechos, 0);

  reto = sumar(reto, { quien: ANA, hoy: LUNES });
  assert.equal(avance(reto).hechos, 1);

  reto = sumar(reto, { quien: LUIS, hoy: LUNES });
  assert.equal(avance(reto).hechos, 2);
});

test('sumar dos veces el mismo día no infla el reto', () => {
  let reto = retoActivo();
  reto = sumar(reto, { quien: ANA, hoy: LUNES });
  const otraVez = sumar(reto, { quien: ANA, hoy: LUNES });

  assert.equal(otraVez, reto); // mismo objeto: no hubo cambio
  assert.equal(avance(reto).hechos, 1);
  assert.equal(yaSume(reto, ANA, LUNES), true);
  assert.equal(yaSume(reto, ANA, MARTES), false);
});

test('quien no está en el reto no puede sumarle', () => {
  const reto = retoActivo();
  assert.equal(sumar(reto, { quien: OTRA, hoy: LUNES }), reto);
  assert.equal(esMiembro(reto, OTRA), false);
});

test('el reto se completa al llegar a la meta', () => {
  let reto = { ...retoActivo(), meta: 3 };
  reto = sumar(reto, { quien: ANA, hoy: LUNES });
  reto = sumar(reto, { quien: LUIS, hoy: LUNES });
  assert.equal(avance(reto).completo, false);

  reto = sumar(reto, { quien: ANA, hoy: MARTES });
  assert.equal(avance(reto).completo, true);
  assert.equal(avance(reto).fraccion, 1);
  assert.equal(estadoDelReto(reto, MARTES), 'completo');
});

// --- Nadie compite (la regla que define el módulo) ------------------------

test('el avance es uno solo: no existe el dato de cuánto puso cada quien', () => {
  let reto = { ...retoActivo(), meta: 20 };
  for (let i = 0; i < 9; i += 1) reto = sumar(reto, { quien: ANA, hoy: DIA(10 + i) });
  reto = sumar(reto, { quien: LUIS, hoy: DIA(10) });

  assert.deepEqual(Object.keys(avance(reto)).sort(), ['completo', 'fraccion', 'hechos', 'meta']);
  assert.equal(avance(reto).hechos, 10);
});

test('ninguna función del módulo reparte el avance entre los dos', () => {
  // Si mañana alguien agrega `avanceDeCadaUno`, esta prueba lo para en seco:
  // el marcador no se muestra porque no se puede calcular.
  const REPARTO = /cadaUno|porPersona|mio|suyo|ranking|marcador|comparar|quienVa/i;

  for (const nombre of Object.keys(pareja)) {
    assert.ok(!REPARTO.test(nombre), `${nombre} suena a marcador`);
  }
});

test('con nueve de uno y uno del otro, los textos no delatan el reparto', () => {
  let reto = { ...retoActivo(), meta: 20 };
  for (let i = 0; i < 9; i += 1) reto = sumar(reto, { quien: ANA, hoy: DIA(10 + i) });
  reto = sumar(reto, { quien: LUIS, hoy: DIA(10) });

  const textos = [
    textoDeAvance(reto),
    textoDeCompania(reto, ANA, DIA(19)),
    textoDeCompania(reto, LUIS, DIA(19)),
    textoDeEstado(reto, DIA(19)),
  ];

  for (const t of textos) {
    assert.ok(!/\b9\b|\b1\b/.test(t), `"${t}" deja ver quién puso qué`);
  }
  assert.match(textoDeAvance(reto), /10 de 20/);
});

// --- Que el otro estuvo, nunca que faltó ---------------------------------

test('se ve que el otro estuvo hoy o ayer', () => {
  let reto = retoActivo();
  reto = sumar(reto, { quien: LUIS, hoy: LUNES });

  assert.equal(companiaReciente(reto, ANA, LUNES), 'hoy');
  assert.equal(companiaReciente(reto, ANA, MARTES), 'ayer');
});

test('más atrás de ayer no se dice nada: contar ausencias es vigilar', () => {
  let reto = retoActivo();
  reto = sumar(reto, { quien: LUIS, hoy: LUNES });

  assert.equal(companiaReciente(reto, ANA, MIERCOLES), null);
  assert.equal(companiaReciente(reto, ANA, DIA(25)), null);
});

test('nunca se le dice a alguien que su pareja lleva días sin aparecer', () => {
  let reto = retoActivo();
  reto = sumar(reto, { quien: LUIS, hoy: LUNES });
  reto = sumar(reto, { quien: ANA, hoy: DIA(25) });

  const AUSENCIA =
    /lleva \d+ d[íi]as?|sin aparecer|no ha (venido|estado|entrado|aparecido)|te dej[óo]|abandon\w*|d[íi]as? sin/i;

  const textos = [
    textoDeAvance(reto),
    textoDeCompania(reto, ANA, DIA(25)),
    textoDeEstado(reto, DIA(25)),
    textoDelBoton(reto, ANA, DIA(25)),
  ];

  for (const t of textos) assert.ok(!AUSENCIA.test(t), `"${t}" delata la ausencia del otro`);
});

test('cuando el otro no ha estado, se habla del ritmo de cada quien', () => {
  const reto = retoActivo();
  assert.match(textoDeCompania(reto, ANA, MIERCOLES), /ritmo|carrera/i);
});

test('los dos el mismo día es un momento compartido, no un empate', () => {
  let reto = retoActivo();
  reto = sumar(reto, { quien: ANA, hoy: LUNES });
  assert.equal(losDosHoy(reto, LUNES), false);

  reto = sumar(reto, { quien: LUIS, hoy: LUNES });
  assert.equal(losDosHoy(reto, LUNES), true);
  assert.match(textoDeCompania(reto, ANA, LUNES), /los dos/i);
});

// --- Hitos ----------------------------------------------------------------

test('el primero, la mitad y el final se celebran una sola vez', () => {
  const base = { ...retoActivo(), meta: 4 };

  const uno = sumar(base, { quien: ANA, hoy: DIA(10) });
  assert.equal(hitoAlcanzado(base, uno).clave, 'arranque');

  const dos = sumar(uno, { quien: LUIS, hoy: DIA(10) });
  assert.equal(hitoAlcanzado(uno, dos).clave, 'mitad');

  const tres = sumar(dos, { quien: ANA, hoy: DIA(11) });
  assert.equal(hitoAlcanzado(dos, tres), null); // entre hitos no se celebra

  const cuatro = sumar(tres, { quien: LUIS, hoy: DIA(11) });
  assert.equal(hitoAlcanzado(tres, cuatro).clave, 'completo');
});

test('un solo aporte que cruza dos hitos celebra uno, no dos', () => {
  const base = { ...retoActivo(), meta: 1 };
  const uno = sumar(base, { quien: ANA, hoy: LUNES });

  assert.equal(hitoAlcanzado(base, uno).clave, 'completo');
});

test('los hitos son del reto, no de una persona', () => {
  for (const h of HITOS) {
    assert.ok(!/\bt[úu]\b|tuyo|tuya/i.test(h.texto), `"${h.texto}" se lo adjudica a uno`);
  }
});

// --- Estados --------------------------------------------------------------

test('los seis estados salen de los datos, sin banderas de más', () => {
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: DIA(1) });

  assert.equal(estadoDelReto(null, LUNES), 'sin');
  assert.equal(estadoDelReto(solo, DIA(1)), 'esperando');
  assert.equal(estadoDelReto(solo, DIA(30)), 'vencida');
  assert.equal(estadoDelReto({ ...solo, codigo: null }, DIA(1)), 'solo');
  assert.equal(estadoDelReto(retoActivo(), LUNES), 'activo');

  let lleno = { ...retoActivo(), meta: 1 };
  lleno = sumar(lleno, { quien: ANA, hoy: LUNES });
  assert.equal(estadoDelReto(lleno, LUNES), 'completo');
});

// --- El texto para invitar ------------------------------------------------

test('la invitación lleva el código partido y el nombre del reto', () => {
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: LUNES });
  const texto = textoParaInvitar(solo, LUNES);

  assert.match(texto, /ABC-D23/);
  assert.match(texto, /caminar/i);
  // Sin código no hay nada que compartir, y se dice callando.
  assert.equal(textoParaInvitar({ ...solo, codigo: null }, LUNES), null);
});

test('un código vencido no se puede compartir', () => {
  // Miraba solo si el código existía, así que se podía mandar por WhatsApp
  // una invitación que al otro lado contesta "ese código ya venció". Quien
  // queda mal ahí es quien invitó.
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: DIA(1) });

  assert.ok(textoParaInvitar(solo, DIA(1 + DIAS_INVITACION)));
  assert.equal(invitacionVigente(solo, DIA(20)), false);
  assert.equal(textoParaInvitar(solo, DIA(20)), null);
});

// --- La voz ---------------------------------------------------------------

// Todos los textos que la persona puede llegar a leer en esta pantalla.
function todosLosTextos() {
  const sin = null;
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: DIA(1) });
  const activo = retoActivo();
  const conAlgo = sumar(sumar(activo, { quien: ANA, hoy: LUNES }), { quien: LUIS, hoy: LUNES });
  const quedan = { ...conAlgo, miembros: [ANA], codigo: null };
  let lleno = { ...activo, meta: 1 };
  lleno = sumar(lleno, { quien: ANA, hoy: LUNES });

  return [
    ...RETOS_PAREJA.map((r) => r.texto),
    ...HITOS.map((h) => h.texto),
    textoAlSalir(),
    ...Object.values(MOTIVOS_ENTRADA),
    revisarCodigo(''),
    ...FUERA.map((c) => revisarCodigo(`ABCD${c}3`)),
    revisarCodigo('ABCD2'),
    revisarCodigo('@@@@@@@'),
    unirseConCodigo({ quien: LUIS, codigo: 'MNPQ45', hallazgo: hallado(solo), hoy: DIA(1) }).error,
    unirseConCodigo({ quien: LUIS, codigo: 'ABCD23', hallazgo: hallado(solo), hoy: DIA(30) }).error,
    unirseConCodigo({ quien: ANA, codigo: 'ABCD23', hallazgo: hallado(solo), hoy: DIA(1) }).error,
    unirseConCodigo({ quien: LUIS, codigo: 'ABCD23', hoy: DIA(1) }).error,
    unirseConCodigo({
      quien: OTRA,
      codigo: 'ABCD23',
      hallazgo: hallado({ ...activo, codigo: 'ABCD23' }),
      hoy: LUNES,
    }).error,
    ...[sin, solo, activo, conAlgo, quedan, lleno].flatMap((r) => [
      textoDeAvance(r),
      textoDeEstado(r, LUNES),
      textoDeEstado(r, DIA(30)),
      textoDeCompania(r, ANA, LUNES),
      textoDeCompania(r, ANA, DIA(30)),
      textoDelBoton(r, ANA, LUNES),
    ]),
    textoParaInvitar(solo, DIA(1)),
  ].filter(Boolean);
}

test('hay textos que revisar', () => {
  assert.ok(todosLosTextos().length > 25);
});

test('ningún texto grita ni celebra con signos', () => {
  for (const t of todosLosTextos()) {
    assert.ok(!t.includes('!') && !t.includes('¡'), `"${t}" grita`);
  }
});

test('ningún texto pasa de dos frases', () => {
  for (const t of todosLosTextos()) {
    const frases = t.split(/[.?…]+/).filter((f) => f.trim().length > 0);
    assert.ok(frases.length <= 2, `"${t}" tiene ${frases.length} frases`);
  }
});

test('ningún texto usa las palabras prohibidas', () => {
  const PROHIBIDO =
    /fracas\w*|excusas?|deber[íi]as|quemar grasa|cuerpo ideal|sin dolor|culpa|castig\w*|vag\w*|floj\w*/i;

  for (const t of todosLosTextos()) assert.ok(!PROHIBIDO.test(t), t);
});

test('ningún texto supone el género de quien lee', () => {
  // "listo" y "lista" sobran: se dice "ya está".
  const GENERO = /\b(listo|lista|solo|sola|cansad[oa]|content[oa]|junt[oa]s?ito)\b/i;

  for (const t of todosLosTextos()) assert.ok(!GENERO.test(t), `"${t}" supone el género`);
});

test('ningún texto compara a las dos personas', () => {
  const COMPARA =
    /va(s)? ganando|vas perdiendo|mejor que|peor que|m[áa]s que t[úu]|menos que t[úu]|le ganas|te gana|puesto \d|primer lugar/i;

  for (const t of todosLosTextos()) assert.ok(!COMPARA.test(t), `"${t}" compara`);
});

test('ningún texto presiona ni pone plazos', () => {
  const PRESION = /tienes que|debes|ap[úu]rate|no te quedes atr[áa]s|te est[áa] esperando|urgente/i;

  for (const t of todosLosTextos()) assert.ok(!PRESION.test(t), `"${t}" presiona`);
});

test('como máximo un emoji por texto, y ninguno de fuego', () => {
  const EMOJI = /\p{Extended_Pictographic}/gu;

  for (const t of todosLosTextos()) {
    const cuantos = (t.match(EMOJI) ?? []).length;
    assert.ok(cuantos <= 1, `"${t}" lleva ${cuantos} emojis`);
    assert.ok(!/🔥|💪/.test(t), `"${t}" lleva fuego o bíceps`);
  }
});

// --- La pantalla ----------------------------------------------------------
//
// Lo mismo que hacen tests/estilos.test.mjs y tests/importaciones.test.mjs con
// toda la app, pero solo sobre este archivo: así se puede correr esta suite
// sola sin depender de lo que estén tocando otros.

const RUTA_PANTALLA = new URL('../src/screens/Pareja.js', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);
const PANTALLA = readFileSync(RUTA_PANTALLA, 'utf8');
const SIN_COMENTARIOS = PANTALLA.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');

// Solo la fábrica de estilos, sin el componente.
const FABRICA = (() => {
  const desde = SIN_COMENTARIOS.slice(SIN_COMENTARIOS.search(/const crear\s*=\s*\(/));
  return desde.slice(0, desde.search(/\n\}\);/));
})();

test('la pantalla no usa ninguna clave de estilo que no defina', () => {
  // En React Native `style={est.noExiste}` no lanza: llega undefined y el
  // estilo no se aplica. El defecto solo se ve mirando el teléfono.
  const definidas = new Set([...FABRICA.matchAll(/^ {2}([A-Za-z_]\w*):\s*\{/gm)].map((m) => m[1]));
  const usadas = new Set([...SIN_COMENTARIOS.matchAll(/\best\.([A-Za-z_]\w*)/g)].map((m) => m[1]));

  assert.ok(definidas.size > 5, 'no se encontró la fábrica de estilos');
  for (const u of usadas) assert.ok(definidas.has(u), `usa est.${u} y la fábrica no lo define`);
  for (const d of definidas) assert.ok(usadas.has(d), `define ${d} y nadie lo usa`);
});

test('los colores del JSX salen de useTema, no de la fábrica de estilos', () => {
  // La fábrica empieza por ({ C, T, R, S }) =>, así que dentro del componente
  // esos nombres NO existen si no se piden. Olvidarlo revienta la pantalla.
  const cuerpo = SIN_COMENTARIOS.replace(/const crear\s*=\s*\([^)]*\)\s*=>\s*\(\{[\s\S]*?\n\}\);/g, ' ');

  if (/\b[CTRS]\.[A-Za-z_$]/.test(cuerpo)) {
    assert.match(cuerpo, /const\s*\{[^}]*\bC\b[^}]*\}\s*=\s*useTema\(\)/);
  }
});

test('todo Pressable de la pantalla se puede usar con lector de pantalla', () => {
  const pressables = (SIN_COMENTARIOS.match(/<Pressable/g) ?? []).length;
  const roles = (SIN_COMENTARIOS.match(/accessibilityRole=/g) ?? []).length;
  const etiquetas = (SIN_COMENTARIOS.match(/accessibilityLabel=/g) ?? []).length;

  assert.ok(pressables >= 4, `solo hay ${pressables} Pressable`);
  assert.ok(roles >= pressables, `${pressables} Pressable y ${roles} accessibilityRole`);
  // Era `>= pressables - 1`, y ese menos uno dejaba pasar justo lo que la
  // prueba dice comprobar: un botón que el lector de pantalla anuncia mudo.
  assert.ok(
    etiquetas >= pressables,
    `${pressables} Pressable y ${etiquetas} accessibilityLabel: hay uno sin etiqueta`,
  );
});

test('los textos escritos en la pantalla también respetan la voz', () => {
  // Prosa suelta en el JSX y cadenas largas entre comillas: los dos sitios
  // donde se escapa un texto sin pasar por el servicio.
  const candidatos = [
    ...[...SIN_COMENTARIOS.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]),
    ...[...SIN_COMENTARIOS.matchAll(/'([^'\n]+)'/g)].map((m) => m[1]),
    // Las etiquetas de accesibilidad van entre comillas dobles y también se
    // leen en voz alta: son texto de la app como cualquier otro.
    ...[...SIN_COMENTARIOS.matchAll(/"([^"\n]+)"/g)].map((m) => m[1]),
  ].map((t) => t.replace(/\s+/g, ' ').trim());

  // Lo que quede con paréntesis, puntos y coma o signos igual es código que se
  // coló entre dos comillas, no una frase.
  const prosa = candidatos.filter(
    (t) => /[a-záéíóúñ]{3,}\s/i.test(t) && !/[{}()=;[\]]/.test(t) && !/\w\.\w/.test(t),
  );

  const PROHIBIDO =
    /fracas\w*|excusas?|deber[íi]as|quemar grasa|cuerpo ideal|culpa|castig\w*|va(s)? ganando|mejor que|te gana|lleva \d+ d[íi]as/i;

  assert.ok(prosa.length >= 8, `solo se encontraron ${prosa.length} textos`);
  for (const t of prosa) {
    assert.ok(!t.includes('¡') && !t.includes('!'), `"${t}" grita`);
    assert.ok(!PROHIBIDO.test(t), `"${t}" no habla como Brío`);
  }
});

test('el reto no vive en la pantalla: se pierde al tocar atrás', () => {
  // Pareja se abre desde Hoy y es pantalla de pila: native-stack la desmonta
  // al volver. Lo que estuviera en useState se iba con ella —el reto entero,
  // el código y los aportes—, y además Hoy lee esta misma clave para decidir
  // entre "Van juntos" e "Invita a alguien".
  assert.match(SIN_COMENTARIOS, /usuario\.pareja/, 'el reto no sale del estado global');
  assert.ok(
    !/\[\s*reto\s*,\s*set\w+\s*\]\s*=\s*useState/.test(SIN_COMENTARIOS),
    'el reto sigue viviendo en un useState de la pantalla',
  );
  assert.ok(!/setReto\(/.test(SIN_COMENTARIOS), 'sigue habiendo un setReto local');

  // Los cinco caminos que cambian el reto tienen que pasar por el estado
  // global: armarlo, entrar, renovar el código, sumar y salir.
  const guardados = (SIN_COMENTARIOS.match(/guardarPareja\(/g) ?? []).length;
  assert.ok(guardados >= 5, `solo ${guardados} caminos guardan el reto`);

  for (const fn of ['crearReto', 'renovarInvitacion', 'salir']) {
    assert.match(
      SIN_COMENTARIOS,
      new RegExp(`guardarPareja\\(\\s*${fn}\\(`),
      `lo que devuelve ${fn} no llega al estado global`,
    );
  }
});

test('la pantalla no le pide un reto a quien viene a unirse', () => {
  // El defecto: el enlace "Me pasaron un código" solo se dibujaba sin reto, y
  // unirse exigía uno, así que la respuesta era siempre "ese código no me
  // suena". La mitad del frente no llevaba a ninguna parte.
  assert.ok(!/unirseConCodigo\(\s*reto/.test(SIN_COMENTARIOS), 'sigue pasando el reto propio');
  assert.match(SIN_COMENTARIOS, /unirseConCodigo\(\{[\s\S]{0,160}hallazgo/);
  // Y el hallazgo sale de una búsqueda, no del reto que la pantalla ya tiene.
  assert.ok(!/hallazgo:\s*(hallado\()?reto/.test(SIN_COMENTARIOS));
});

test('con el código vencido no se puede compartir nada', () => {
  // 'esperando' y 'vencida' iban juntas en una sola variable, así que con el
  // código muerto seguían en pantalla la tarjeta y el botón de compartir.
  assert.ok(
    !/'esperando'[^\n]*\|\|[^\n]*'vencida'|'vencida'[^\n]*\|\|[^\n]*'esperando'/.test(
      SIN_COMENTARIOS,
    ),
    'la pantalla vuelve a tratar igual el código vivo y el vencido',
  );
  assert.match(
    SIN_COMENTARIOS,
    /'esperando'\s*&&\s*<Boton onPress=\{compartir\}/,
    'compartir ya no está atado a la invitación vigente',
  );
});

test('salir del reto no se pinta como un error', () => {
  // En Brío el rojo informa, nunca señala. Irse es una decisión normal y
  // llevaba el mismo estilo que un formulario mal llenado.
  const rojos = new Set(
    [...FABRICA.matchAll(/^ {2}([A-Za-z_]\w*):\s*\{([^}]*)\}/gm)]
      .filter((m) => /rojo/i.test(m[2]))
      .map((m) => m[1]),
  );
  assert.ok(rojos.size > 0, 'no se encontró ningún estilo en rojo');

  const guardado = SIN_COMENTARIOS.match(/set([A-Z]\w*)\(textoAlSalir\(\)\)/);
  assert.ok(guardado, 'la pantalla ya no muestra el texto de salir');

  const variable = guardado[1][0].toLowerCase() + guardado[1].slice(1);
  const pintado = SIN_COMENTARIOS.match(
    new RegExp(`style=\\{est\\.([A-Za-z_]\\w*)\\}>\\{${variable}\\}`),
  );
  assert.ok(pintado, `no se ve con qué estilo se pinta ${variable}`);
  assert.ok(!rojos.has(pintado[1]), `el texto de salir va en est.${pintado[1]}, que es rojo`);
});

test('quien espera a la otra persona también puede sumar', () => {
  // El texto de 'esperando' dice "mientras llega, puedes ir sumando tú", y el
  // botón solo salía con los dos dentro: la app ofrecía algo que no estaba en
  // ninguna parte.
  const solo = crearReto({ clave: 'caminar', quien: ANA, codigo: 'ABCD23', hoy: LUNES });
  assert.equal(estadoDelReto(solo, LUNES), 'esperando');
  assert.match(textoDeEstado(solo, LUNES), /sumando/i);

  // Se mira la guarda del botón y también lo que esa guarda consulta:
  // agrupar estados a mano es exactamente como se quedó fuera quien espera.
  const guarda = SIN_COMENTARIOS.match(/\{([^\n]*)&&[\s\S]{0,60}?<Boton onPress=\{sumarHoy\}/);
  assert.ok(guarda, 'no se encontró el botón de sumar');

  const mirados = [guarda[1]];
  for (const nombre of guarda[1].match(/[A-Za-z_]\w*/g) ?? []) {
    const definicion = SIN_COMENTARIOS.match(new RegExp(`const ${nombre}\\s*=([^\\n]*)`));
    if (definicion) mirados.push(definicion[1]);
  }

  for (const texto of mirados) {
    assert.ok(
      !/'activo'|'esperando'/.test(texto),
      `el botón de sumar depende de "${texto.trim()}", que deja fuera a quien espera`,
    );
  }
});

test('la pantalla cierra la promesa de compartir', () => {
  // Es la única promesa del archivo y el resto del proyecto sí las cierra.
  assert.match(SIN_COMENTARIOS, /Share\.share\([\s\S]{0,80}?\)\s*\.catch\(/);
});

// --- La migración ---------------------------------------------------------

const RUTA_SQL = new URL('../supabase/migrations/006_pareja.sql', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);
const SQL = readFileSync(RUTA_SQL, 'utf8');

test('unirse_a_reto distingue el código que no existe del que venció', () => {
  const desde = SQL.slice(SQL.indexOf('function unirse_a_reto'));
  const cuerpo = desde.slice(0, desde.indexOf('$$;'));

  // La búsqueda mira SOLO el código. Con la vigencia metida en el mismo
  // where, un código vencido y uno inventado devuelven los dos cero filas y
  // el único error posible es "no existe": el buen mensaje del cliente ("Ese
  // código ya venció. Pídele uno nuevo y seguimos.") no se podría mostrar
  // nunca, y quien pegó un código bueno pero viejo se iría creyendo que lo
  // escribió mal.
  const busqueda = cuerpo.match(/select[^;]*\bfrom retos_pareja\b[^;]*;/);
  assert.ok(busqueda, 'no se encontró la búsqueda por código');

  const filtro = busqueda[0].slice(busqueda[0].indexOf('where'));
  assert.ok(!/codigo_desde/.test(filtro), 'la vigencia sigue dentro del filtro de la búsqueda');

  assert.match(cuerpo, /raise exception 'codigo no valido'/);
  assert.match(cuerpo, /raise exception 'codigo vencido'/);
  // Y la vigencia se sigue obligando, solo que después y por separado.
  assert.match(cuerpo, /codigo_desde/);
});

test('los motivos que levanta el servidor tienen texto en el cliente', () => {
  // Si el servidor aprende a decir algo que el cliente no sabe traducir, la
  // persona termina leyendo el mensaje genérico de "no me suena".
  for (const motivo of ['vencido', 'no-existe', 'lleno']) {
    assert.ok(MOTIVOS_ENTRADA[motivo], `falta el texto de ${motivo}`);
  }
  assert.notEqual(MOTIVOS_ENTRADA.vencido, MOTIVOS_ENTRADA['no-existe']);
});
