import {
  CATEGORIAS,
  MINIMO,
  formatearMonto,
  gastosDelMes,
  mesDeFecha,
  montoDeTexto,
  total,
  totalPorCategoria,
} from './gastos.js';

// El presupuesto de Brío y sus avisos. Reglas puras, sin React ni red.
//
// LO QUE ESTE ARCHIVO NO HACE, Y NO VA A HACER
// No dice en qué no gastar. No proyecta deudas. No compara con otras personas.
// No pone puntajes. No reclama el silencio de quien no anotó nada.
//
// El semáforo es el mismo del resto del producto y significa lo mismo: informa
// y nunca castiga. El rojo aquí no es una alarma, es una frase que dice "el mes
// ya pasó el número que tú mismo pusiste", en pasado y sin adjetivos. Quien usa
// esta app ya se critica solo; no necesita que la app lo ayude.

export const PRESUPUESTO_VACIO = { mensual: null, porCategoria: {} };

const numero = (valor) => {
  const n = Math.round(Number(valor));
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Cuánto del mes ha pasado. Es lo que separa "va rápido" de "va normal": sin
// mirar el calendario, gastar la mitad del tope el día 20 parecería igual de
// grave que gastarla el día 2.
export function avanceDelMes(hoy = new Date()) {
  const dias = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const dia = hoy.getDate();
  return { dias, dia, quedanDias: dias - dia, fraccionDelMes: dia / dias };
}

// Margen antes de decir que el mes va rápido. Sin él, cualquier compra grande
// a principio de mes encendería el ámbar, y un aviso que salta siempre deja de
// significar algo a la tercera vez.
const HOLGURA = 0.15;

export function colorDelMes(fraccionGastada, fraccionDelMes) {
  if (fraccionGastada >= 1) return 'rojo';
  if (fraccionGastada > fraccionDelMes + HOLGURA) return 'ambar';
  return 'verde';
}

export function estadoDelMes({ gastos = [], presupuesto = PRESUPUESTO_VACIO, hoy = new Date() } = {}) {
  const mes = mesDeFecha(hoy);
  const delMes = gastosDelMes(gastos, mes);
  const gastado = total(delMes);
  const tiempo = avanceDelMes(hoy);
  const mensual = numero(presupuesto?.mensual);

  const base = { mes, gastado, cuantos: delMes.length, ...tiempo };

  // Sin tope no hay semáforo. Poner uno "por defecto" sería inventarle a la
  // persona una raya que ella no puso y luego señalarla por cruzarla.
  if (!mensual) return { ...base, hay: false, mensual: null, queda: null, fraccion: null, color: null };

  const fraccion = gastado / mensual;

  return {
    ...base,
    hay: true,
    mensual,
    queda: mensual - gastado,
    fraccion,
    color: colorDelMes(fraccion, tiempo.fraccionDelMes),
  };
}

// Cada categoría con lo suyo. Aparecen las que tienen gasto y las que tienen
// tope, aunque estén en cero: un tope puesto y sin usar también es información.
export function estadoPorCategoria({ gastos = [], presupuesto = PRESUPUESTO_VACIO, hoy = new Date() } = {}) {
  const delMes = gastosDelMes(gastos, mesDeFecha(hoy));
  const sumas = totalPorCategoria(delMes);
  const topes = presupuesto?.porCategoria ?? {};
  const { fraccionDelMes } = avanceDelMes(hoy);

  return CATEGORIAS.map(({ clave, titulo }) => {
    const gastado = sumas[clave] ?? 0;
    const tope = numero(topes[clave]);
    const fraccion = tope ? gastado / tope : null;

    return {
      clave,
      titulo,
      gastado,
      tope,
      fraccion,
      color: tope ? colorDelMes(fraccion, fraccionDelMes) : null,
    };
  })
    .filter((c) => c.gastado > 0 || c.tope)
    .sort((a, b) => b.gastado - a.gastado);
}

// --- Cambiar el tope ------------------------------------------------------
// Puras a propósito: el reducer y la pantalla usan las mismas, y así "quitar
// el tope" significa lo mismo en los dos sitios.

export function fijarMensual(presupuesto = PRESUPUESTO_VACIO, monto) {
  return { ...PRESUPUESTO_VACIO, ...presupuesto, mensual: numero(monto) };
}

export function fijarCategoria(presupuesto = PRESUPUESTO_VACIO, clave, monto) {
  const porCategoria = { ...(presupuesto?.porCategoria ?? {}) };
  const valor = numero(monto);

  if (valor) porCategoria[clave] = valor;
  else delete porCategoria[clave];

  return { ...PRESUPUESTO_VACIO, ...presupuesto, porCategoria };
}

// El tope también se escribe a mano ("600 mil"), con el mismo lector que los
// gastos. Un campo que solo acepta "600000" se abandona.
export function topeDesdeTexto(texto) {
  const monto = montoDeTexto(texto);
  return monto != null && monto >= MINIMO ? monto : null;
}

// --- Lo que Brío dice -----------------------------------------------------

const abrir = (nombre, resto) =>
  nombre?.trim() ? `${nombre.trim()}, ${resto}` : resto.charAt(0).toUpperCase() + resto.slice(1);

const diasQueFaltan = (quedan) => {
  if (quedan <= 0) return 'hoy cierra el mes';
  if (quedan === 1) return 'queda un día de mes';
  return `quedan ${quedan} días de mes`;
};

// El aviso principal. Nunca dice "te pasaste", nunca manda y nunca reclama.
export function avisoDelMes(estado, nombre) {
  if (!estado || !estado.cuantos) {
    return abrir(nombre, 'este mes todavía está en blanco. Anota lo que quieras y aquí se va sumando.');
  }

  if (!estado.hay) {
    return abrir(
      nombre,
      `este mes llevas ${formatearMonto(estado.gastado)} anotados. Si algún día quieres ponerle un tope al mes, lo pones tú.`,
    );
  }

  if (estado.color === 'rojo') {
    const encima = formatearMonto(Math.abs(estado.queda));
    return abrir(
      nombre,
      `el mes pasó por ${encima} el tope que pusiste. Es un dato del mes, nada más.`,
    );
  }

  const vas = `vas en ${formatearMonto(estado.gastado)} de ${formatearMonto(estado.mensual)}`;

  if (estado.color === 'ambar') {
    return abrir(nombre, `${vas} y ${diasQueFaltan(estado.quedanDias)}. Te lo cuento por si sirve.`);
  }

  return abrir(nombre, `${vas} y ${diasQueFaltan(estado.quedanDias)}. El mes va a su ritmo.`);
}

// Cuánto va y cuánto queda, sin dramatismo y sin cuentas por día: repartir lo
// que queda entre los días que faltan es una correa, no una ayuda.
export function textoDeLoQueQueda(estado) {
  if (!estado?.hay) return null;

  if (estado.queda > 0) {
    return `Quedan ${formatearMonto(estado.queda)} de lo que pusiste para el mes.`;
  }

  return 'Lo que pusiste para el mes ya está completo. Los días que faltan siguen siendo tuyos.';
}

// Lo que sumó el mes pasado, para que poner el primer tope no sea adivinar.
export function topeSugerido(gastos = [], hoy = new Date()) {
  const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const suma = total(gastosDelMes(gastos, mesDeFecha(anterior)));

  // Se redondea hacia arriba: un tope sugerido por debajo de lo que la persona
  // gastó de verdad nace roto, y estrenar el presupuesto en rojo es la forma
  // más rápida de no volver a abrir esta pantalla.
  return suma > 0 ? Math.ceil(suma / 10000) * 10000 : null;
}

export function textoDeSugerencia(monto) {
  if (!monto) return 'Ponle el número que tú quieras. Se puede cambiar cuando se te ocurra.';
  return `El mes pasado sumaste ${formatearMonto(monto)}. Si no sabes qué poner, empieza por ahí.`;
}
