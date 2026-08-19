import { claveDia, diasEntreClaves, sumarDias } from './fecha.js';

// Retos en pareja: dos personas que se acompañan en una misma cosa.
//
// LO QUE ESTE MÓDULO NO CALCULA, Y ES LA DECISIÓN QUE LO DEFINE
// No hay ninguna función que devuelva cuánto puso cada uno. Ninguna. El avance
// es uno solo y es de los dos, y la resta que diría quién va ganando no existe
// en ningún sitio. No es que la pantalla decida no mostrarla: es que no se
// puede pedir. En una app cuyo usuario ya abandonó otras por sentirse juzgado,
// un marcador entre dos personas es la forma más rápida de perder a la que va
// más lenta, que suele ser justo la que más necesita quedarse.
//
// LO QUE SÍ SE VE
// Que el otro estuvo, y qué llevan juntos. Presencia, nunca ausencia:
// `companiaReciente` devuelve 'hoy' o 'ayer' y, más atrás de eso, null. Decir
// "lleva tres días sin aparecer" convierte el acompañamiento en vigilancia, y
// además pone a una persona a responder por otra.
//
// Y SALIR
// `salir` devuelve null y no genera ningún aviso para el otro. Irse de un reto
// no es una falta y no se anuncia como tal.

export const MAXIMO_MIEMBROS = 2;

// --- El catálogo ----------------------------------------------------------
//
// Pocos y de suma, como los hábitos: cosas que se agregan al día, no cosas que
// hay que dejar de hacer. La meta es CONJUNTA, así que veinte son unos diez de
// cada quien si van parejos, y veinte de uno solo también valen: el reto no
// pregunta de dónde salió cada uno.

export const RETOS_PAREJA = [
  {
    clave: 'caminar',
    titulo: 'Caminar juntos',
    texto: 'Cada vez que alguno de los dos salga a caminar, el reto avanza.',
    meta: 20,
  },
  {
    clave: 'movernos',
    titulo: 'Movernos esta semana',
    texto: 'Cualquier movimiento cuenta, del tamaño que sea.',
    meta: 10,
  },
  {
    clave: 'agua',
    titulo: 'Tomar más agua',
    texto: 'Un vaso más al día, cada quien en su casa.',
    meta: 30,
  },
  {
    clave: 'estirar',
    titulo: 'Estirar antes de dormir',
    texto: 'Dos minutos alcanzan para que el día cuente.',
    meta: 21,
  },
];

export const retoPorClave = (clave) => RETOS_PAREJA.find((r) => r.clave === clave) ?? null;

// --- El código de invitación ----------------------------------------------
//
// Se comparte por fuera (WhatsApp, o dictado por teléfono) y por eso el
// alfabeto importa más de lo que parece: un código que se copia mal es una
// persona que no entra y no vuelve a intentarlo.
//
// Fuera van 0 y O, 1 e I y L, que se confunden al leerlos, y la U, para que el
// azar no arme una palabra fea en la pantalla de alguien. Es el alfabeto de
// Crockford sin el cero ni el uno: 30 caracteres, seis posiciones, más de
// setecientos millones de combinaciones.
//
// Como ninguno de los pares confundibles está DENTRO del alfabeto, no hace
// falta traducir nada al recibirlo: un código válido jamás contiene una letra
// que se pueda oír de dos maneras.
export const ALFABETO = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const LARGO_CODIGO = 6;

// Los que se dejaron fuera, para poder explicárselo a quien escribe uno de
// ellos en vez de mandarlo a revisar a ciegas.
const CONFUSOS = /[01ILOU]/;

// Días que vive una invitación. Un código eterno es un código que alguien
// pega en un grupo y sigue abriendo la puerta un año después.
export const DIAS_INVITACION = 7;

export function generarCodigo(azar = Math.random) {
  let codigo = '';
  for (let i = 0; i < LARGO_CODIGO; i += 1) {
    codigo += ALFABETO[Math.floor(azar() * ALFABETO.length)];
  }
  return codigo;
}

// Lo que escribe la persona no se parece a lo que se guarda: viene con
// espacios, con el guion que le pusimos nosotros y en minúscula.
export function normalizarCodigo(texto) {
  return String(texto ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

// 'ABCD23' se dicta mejor partido en dos: 'ABC-D23'.
export function formatearCodigo(codigo) {
  const limpio = normalizarCodigo(codigo);
  if (limpio.length !== LARGO_CODIGO) return limpio;
  return `${limpio.slice(0, 3)}-${limpio.slice(3)}`;
}

export function codigoValido(texto) {
  const limpio = normalizarCodigo(texto);
  if (limpio.length !== LARGO_CODIGO) return false;
  return [...limpio].every((c) => ALFABETO.includes(c));
}

// Devuelve null si está bien, o el texto que se le muestra a la persona.
// Dice qué falta, nunca qué hizo mal.
export function revisarCodigo(texto) {
  const limpio = normalizarCodigo(texto);
  if (!limpio) return 'Escribe el código que te pasaron.';
  // La lista tiene que nombrar los MISMOS caracteres que CONFUSOS. Faltaban la
  // ele y la u, así que quien escribía 'ABCDU3' leía una lista donde su letra
  // no estaba y se quedaba buscando un error que, según el aviso, no existía.
  if (CONFUSOS.test(limpio)) {
    return 'En los códigos no van el cero, el uno, la i, la ele, la o ni la u. Míralo otra vez y seguimos.';
  }
  if (limpio.length !== LARGO_CODIGO) {
    return `El código va con ${LARGO_CODIGO} caracteres. Revísalo y seguimos.`;
  }
  if (!codigoValido(limpio)) return 'Ese código no me suena. Revísalo y probamos otra vez.';
  return null;
}

// --- El reto ---------------------------------------------------------------
//
// La forma que viaja: { clave, meta, codigo, codigoDesde, miembros, aportes }.
// `aportes` es [{ quien, fecha }], uno por persona y día. Guardar la fecha y
// no un contador permite rehacer la cuenta si algún día la nube y el teléfono
// se desincronizan.

export function crearReto({ clave, quien, codigo, hoy = new Date() } = {}) {
  const base = retoPorClave(clave);
  if (!base || !quien) return null;

  return {
    clave: base.clave,
    meta: base.meta,
    codigo: normalizarCodigo(codigo) || null,
    codigoDesde: claveDia(hoy),
    miembros: [quien],
    aportes: [],
  };
}

export const esMiembro = (reto, quien) => (reto?.miembros ?? []).includes(quien);

// El otro, sin nombrarlo: aquí solo se usa para saber si estuvo.
export function elOtro(reto, yo) {
  return (reto?.miembros ?? []).find((m) => m !== yo) ?? null;
}

export function vencimientoDeInvitacion(reto) {
  if (!reto?.codigoDesde) return null;
  return sumarDias(reto.codigoDesde, DIAS_INVITACION);
}

export function invitacionVigente(reto, hoy = new Date()) {
  if (!reto?.codigo) return false;
  const vence = vencimientoDeInvitacion(reto);
  if (!vence) return false;
  return diasEntreClaves(claveDia(hoy), vence) >= 0;
}

// Un código nuevo, para cuando el anterior venció o para volver a invitar
// después de que alguien se fue. No hay penalización por pedirlo: rehacer una
// invitación no es empezar de cero, y lo que llevan sigue donde estaba.
export function renovarInvitacion(reto, { codigo, hoy = new Date() } = {}) {
  if (!reto) return reto;
  if ((reto.miembros ?? []).length >= MAXIMO_MIEMBROS) return reto;

  return { ...reto, codigo: normalizarCodigo(codigo) || null, codigoDesde: claveDia(hoy) };
}

// Por qué no se pudo entrar, y lo que se lee en cada caso. Viven aquí y no en
// la pantalla porque los decide el servidor: `unirse_a_reto` distingue un
// código que no existe de uno que venció, y esa diferencia solo sirve de algo
// si llega hasta el texto que la persona lee.
export const MOTIVOS_ENTRADA = {
  'no-existe': 'Ese código no me suena. Revísalo y probamos otra vez.',
  vencido: 'Ese código ya venció. Pídele uno nuevo y seguimos.',
  lleno: 'Ese reto ya tiene a dos. Puedes armar otro con quien quieras.',
  'ya-estas': 'Ya estás en este reto. No hay nada más que hacer.',
  'sin-nube': 'Para entrar con un código necesito conexión con Brío. Guarda tu cuenta y seguimos.',
  'sin-cuenta': 'Para entrar con un código hace falta guardar tu cuenta. Se hace en Ajustes, en un minuto.',
};

// El puente entre lo que dice Postgres y lo que lee la persona.
//
// `unirse_a_reto` levanta excepciones con texto en inglés de base de datos
// ('codigo no valido', 'reto lleno'). Sin este mapa, ese texto no llegaba a
// ninguna parte y toda la información que el servidor se molesta en
// distinguir —un código que no existe contra uno que venció— se perdía en un
// mensaje genérico. Vive aquí, al lado de los textos, para que agregar un
// motivo nuevo sea un solo cambio.
const DEL_SERVIDOR = {
  'codigo no valido': 'no-existe',
  'codigo vencido': 'vencido',
  'reto lleno': 'lleno',
  'ya tiene reto': 'ya-estas',
  'sin sesion': 'sin-cuenta',
  'no es tu reto': 'no-existe',
};

// Traduce el error que sube Supabase a una clave de MOTIVOS_ENTRADA.
// Lo que no reconozca cae en 'no-existe', que es el mensaje más suave y el
// que no acusa a nadie de nada.
export function motivoDelServidor(mensaje) {
  const limpio = String(mensaje ?? '').toLowerCase();

  for (const [dice, clave] of Object.entries(DEL_SERVIDOR)) {
    if (limpio.includes(dice)) return clave;
  }

  return 'no-existe';
}

// Unirse con el código.
//
// Quien llega invitado NO tiene ningún reto todavía, así que esta función no
// puede recibir uno: recibe el `hallazgo`, que es lo que devolvió la búsqueda
// por código —{ estado: 'ok', reto } o { estado } con el motivo—. La búsqueda
// solo la puede hacer `unirse_a_reto` en Supabase, porque es la única que
// puede mirar un reto ajeno.
//
// Antes el primer argumento era el reto propio, y quien se unía llegaba con
// null: la respuesta era siempre "ese código no me suena". Es decir, la app
// acusaba de escribir mal a la única persona que había escrito bien.
//
// Lo que el servidor ya decidió se vuelve a mirar aquí a propósito: el
// hallazgo puede venir de una copia guardada hace rato.
export function unirseConCodigo({ quien, codigo, hallazgo, hoy = new Date() } = {}) {
  const malFormado = revisarCodigo(codigo);
  if (malFormado) return { ok: false, error: malFormado, reto: null };

  const motivo = hallazgo?.estado ?? 'sin-nube';
  if (motivo !== 'ok') {
    return { ok: false, error: MOTIVOS_ENTRADA[motivo] ?? MOTIVOS_ENTRADA['no-existe'], reto: null };
  }

  const reto = hallazgo?.reto ?? null;
  if (!reto || normalizarCodigo(reto.codigo) !== normalizarCodigo(codigo)) {
    return { ok: false, error: MOTIVOS_ENTRADA['no-existe'], reto: null };
  }

  if (esMiembro(reto, quien)) {
    return { ok: false, error: MOTIVOS_ENTRADA['ya-estas'], reto: null };
  }

  if ((reto.miembros ?? []).length >= MAXIMO_MIEMBROS) {
    return { ok: false, error: MOTIVOS_ENTRADA.lleno, reto: null };
  }

  if (!invitacionVigente(reto, hoy)) {
    return { ok: false, error: MOTIVOS_ENTRADA.vencido, reto: null };
  }

  // El código se apaga al entrar el segundo: la puerta se cierra sola.
  return {
    ok: true,
    error: null,
    reto: { ...reto, codigo: null, miembros: [...reto.miembros, quien] },
  };
}

// Salir: en un toque y sin drama. Devuelve null porque para quien se va ya no
// hay reto, y no produce ningún aviso para el otro a propósito.
export function salir(reto, quien) {
  if (!reto || !esMiembro(reto, quien)) return reto ?? null;
  return null;
}

// --- Avanzar ---------------------------------------------------------------

export function yaSume(reto, quien, hoy = new Date()) {
  const fecha = claveDia(hoy);
  return (reto?.aportes ?? []).some((a) => a.quien === quien && a.fecha === fecha);
}

// Idempotente: sumar dos veces el mismo día no infla el reto.
export function sumar(reto, { quien, hoy = new Date() } = {}) {
  if (!reto || !esMiembro(reto, quien)) return reto;
  if (yaSume(reto, quien, hoy)) return reto;

  return { ...reto, aportes: [...(reto.aportes ?? []), { quien, fecha: claveDia(hoy) }] };
}

// El avance, y es el único que existe. Sin `mio`, sin `suyo`, sin diferencia.
export function avance(reto) {
  const meta = reto?.meta ?? 0;
  const hechos = (reto?.aportes ?? []).length;

  return {
    hechos,
    meta,
    fraccion: meta > 0 ? Math.min(1, hechos / meta) : 0,
    completo: meta > 0 && hechos >= meta,
  };
}

// 'sin' | 'esperando' | 'vencida' | 'activo' | 'solo' | 'completo'
//
// 'esperando' y 'solo' se distinguen sin guardar una bandera más: el código se
// apaga cuando entra el segundo, así que un reto de una sola persona CON
// código es uno al que nadie ha llegado todavía, y uno SIN código es uno del
// que alguien se fue.
export function estadoDelReto(reto, hoy = new Date()) {
  if (!reto) return 'sin';
  if (avance(reto).completo) return 'completo';

  const cuantos = (reto.miembros ?? []).length;
  if (cuantos >= MAXIMO_MIEMBROS) return 'activo';
  if (!reto.codigo) return 'solo';

  return invitacionVigente(reto, hoy) ? 'esperando' : 'vencida';
}

// Si el otro estuvo hoy o ayer. Más atrás devuelve null, y ese null es la
// regla entera: contar los días que alguien lleva sin aparecer es vigilarlo.
export function companiaReciente(reto, yo, hoy = new Date()) {
  const otro = elOtro(reto, yo);
  if (!otro) return null;

  const suyos = (reto.aportes ?? []).filter((a) => a.quien === otro).map((a) => a.fecha);
  if (!suyos.length) return null;

  const ultimo = suyos.sort().at(-1);
  const atras = diasEntreClaves(ultimo, claveDia(hoy));

  if (atras === 0) return 'hoy';
  if (atras === 1) return 'ayer';
  return null;
}

export function losDosHoy(reto, hoy = new Date()) {
  const miembros = reto?.miembros ?? [];
  if (miembros.length < MAXIMO_MIEMBROS) return false;
  return miembros.every((m) => yaSume(reto, m, hoy));
}

// --- Hitos -----------------------------------------------------------------
//
// Tres, y todos del reto, no de una persona. Se celebran en el momento en que
// se cruzan y no se pierden nunca: si mañana nadie suma nada, la mitad sigue
// estando hecha.

export const HITOS = [
  {
    clave: 'arranque',
    titulo: 'Arrancaron',
    texto: 'El primero ya está. Eso era lo que costaba.',
    en: () => 1,
  },
  {
    clave: 'mitad',
    titulo: 'Mitad del camino',
    texto: 'Van por la mitad, y la hicieron entre los dos.',
    en: (meta) => Math.ceil(meta / 2),
  },
  {
    clave: 'completo',
    titulo: 'Reto cumplido',
    texto: 'Lo terminaron. Nadie lo hizo por su cuenta.',
    en: (meta) => meta,
  },
];

// El hito que se acaba de cruzar, o null. Si un mismo aporte cruza dos, se
// devuelve el más grande: una celebración por vez.
export function hitoAlcanzado(antes, ahora) {
  const meta = ahora?.meta ?? 0;
  if (meta <= 0) return null;

  const previos = avance(antes).hechos;
  const nuevos = avance(ahora).hechos;
  if (nuevos <= previos) return null;

  const cruzados = HITOS.filter((h) => {
    const umbral = h.en(meta);
    return previos < umbral && nuevos >= umbral;
  });

  return cruzados.length ? cruzados[cruzados.length - 1] : null;
}

// --- Los textos ------------------------------------------------------------

export function textoDeAvance(reto) {
  const { hechos, meta, completo } = avance(reto);
  if (completo) return 'Reto cumplido. Lo hicieron entre los dos.';
  if (hechos === 0) return 'Todavía no hay nada, y está bien. Puede empezar cualquiera de los dos.';
  return `Llevan ${hechos} de ${meta} juntos.`;
}

// Lo que se dice del otro. Solo habla de cuando estuvo; su ausencia no tiene
// texto, porque no es asunto de esta persona.
//
// Devuelve null cuando todavía no hay nadie más: inventarle compañía a quien
// está esperando es peor que callarse.
export function textoDeCompania(reto, yo, hoy = new Date()) {
  if (!elOtro(reto, yo)) return null;
  if (losDosHoy(reto, hoy)) return 'Hoy estuvieron los dos. Así se ve bonito.';

  const cuando = companiaReciente(reto, yo, hoy);
  if (cuando === 'hoy') return 'Hoy estuvo por aquí. Cuando puedas, te sumas.';
  if (cuando === 'ayer') return 'Ayer estuvo por aquí.';

  return 'Cada quien a su ritmo. Esto no es una carrera.';
}

export function textoDeEstado(reto, hoy = new Date()) {
  const estado = estadoDelReto(reto, hoy);

  if (estado === 'sin') return 'Un reto de dos, sin marcador y sin comparaciones.';
  if (estado === 'esperando') {
    return 'Pásale el código a esa persona. Mientras llega, puedes ir sumando tú.';
  }
  if (estado === 'vencida') return 'Ese código ya venció. Te doy uno nuevo cuando quieras.';
  if (estado === 'solo') return 'Ahora sigues tú, y lo que llevan se queda. Puedes invitar a alguien cuando quieras.';
  if (estado === 'completo') return 'Terminaron el reto. Pueden dejarlo aquí o armar otro.';

  return 'Van los dos en esto. Avanza con lo que haga cualquiera.';
}

export function textoDelBoton(reto, yo, hoy = new Date()) {
  return yaSume(reto, yo, hoy) ? 'Ya sumaste hoy' : 'Hoy me moví';
}

// El mensaje que se manda por fuera. Lo escribe la persona, no Brío, así que
// va en primera persona y sin explicar la app entera.
//
// Un código vencido no se puede compartir: mirar solo si existe dejaba mandar
// por WhatsApp una invitación que al otro lado contesta "ese código ya
// venció". Quien queda mal ahí es quien invitó, no la app.
export function textoParaInvitar(reto, hoy = new Date()) {
  const base = retoPorClave(reto?.clave);
  if (!base || !reto?.codigo) return null;
  if (!invitacionVigente(reto, hoy)) return null;

  return `Armé un reto en Brío para los dos: ${base.titulo.toLowerCase()}. Entra con el código ${formatearCodigo(reto.codigo)}.`;
}

// Lo que ve quien se sale. Ni despedida triste ni reproche.
export function textoAlSalir() {
  return 'Ya saliste del reto. Nada de lo tuyo cambia por esto.';
}
