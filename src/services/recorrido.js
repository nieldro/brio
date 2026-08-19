import { claveDia, diasEntreClaves, sumarDias } from './fecha.js';

// Tu recorrido: lo que llevas hecho, dicho con números que solo suben.
//
// Esto es lo que separa una app que acompaña de un formulario. Un formulario
// pregunta; una app que acompaña te devuelve lo que ha visto.
//
// REGLA QUE MANDA AQUÍ
// Todos los números de esta pantalla solo pueden SUBIR. Días en movimiento,
// veces que volviste, hábitos cumplidos, líneas escritas. Ninguno se pone en
// cero por fallar un día.
//
// Lo que NO hay, y no va a haber: porcentaje de días perdidos, racha rota,
// "llevas N días sin". Para alguien que ya abandonó cinco apps, ese número es
// la sexta confirmación de lo mismo.

const DIA_MS = 86_400_000;

// --- Totales ---------------------------------------------------------------

export function totales({ diasCompletados = [], habitosHechos = {}, diario = {} } = {}) {
  const dias = new Set(diasCompletados).size;

  const habitos = Object.values(habitosHechos).reduce(
    (suma, fechas) => suma + new Set(fechas ?? []).size,
    0,
  );

  const lineas = Object.values(diario).filter((t) => t?.trim?.()).length;

  return { dias, habitos, lineas, semanas: semanasConMovimiento(diasCompletados) };
}

// Semanas distintas en las que se movió al menos una vez. Mide permanencia,
// que es lo que de verdad importa, y no se rompe por saltarse días.
export function semanasConMovimiento(diasCompletados = []) {
  const semanas = new Set();

  for (const clave of diasCompletados) {
    const [a, m, d] = clave.split('-').map(Number);
    const fecha = new Date(Date.UTC(a, m - 1, d));
    // Lunes de esa semana, como marca del grupo.
    const dia = fecha.getUTCDay();
    const alLunes = dia === 0 ? -6 : 1 - dia;
    semanas.add(new Date(fecha.getTime() + alLunes * DIA_MS).toISOString().slice(0, 10));
  }

  return semanas.size;
}

// --- El mapa de los días ---------------------------------------------------

// Una cuadrícula de las últimas semanas, para ver el recorrido de un vistazo.
// Empieza siempre en lunes para que las columnas sean días de la semana.
export function mapaDeDias(diasCompletados = [], hoy = new Date(), semanas = 8) {
  const marcados = new Set(diasCompletados);
  const hoyClave = claveDia(hoy);

  // El lunes de la semana en curso.
  const diaDeHoy = hoy.getDay();
  const alLunes = diaDeHoy === 0 ? -6 : 1 - diaDeHoy;
  const lunesActual = sumarDias(hoyClave, alLunes);

  // El primer lunes del mapa.
  const inicio = sumarDias(lunesActual, -(semanas - 1) * 7);

  return Array.from({ length: semanas }, (_, s) =>
    Array.from({ length: 7 }, (_, d) => {
      const clave = sumarDias(inicio, s * 7 + d);
      const alFuturo = diasEntreClaves(hoyClave, clave) > 0;

      return {
        clave,
        hecho: marcados.has(clave),
        esHoy: clave === hoyClave,
        futuro: alFuturo,
      };
    }),
  );
}

// --- Hitos -----------------------------------------------------------------
//
// Se celebran al llegar, no se anuncian antes: "te faltan 3 para los 10" es
// una cuenta regresiva, y una cuenta regresiva se puede perder.

export const HITOS = [1, 3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

export function hitoAlcanzado(dias) {
  return HITOS.includes(dias) ? dias : null;
}

export function textoDeHito(dias) {
  if (dias === 1) return { titulo: 'Tu primer día.', sub: 'Ya no eres de los que solo lo piensan.' };
  if (dias === 7) return { titulo: 'Siete días.', sub: 'Una semana entera contigo.' };
  if (dias === 30) return { titulo: 'Treinta días.', sub: 'Esto ya no es un intento.' };
  if (dias === 100) return { titulo: 'Cien días.', sub: 'Muy poca gente llega aquí.' };
  if (dias === 365) return { titulo: 'Un año.', sub: 'No hay nada que agregar a eso.' };
  return { titulo: `${dias} días.`, sub: 'Uno detrás de otro, a tu ritmo.' };
}

// El siguiente hito, solo para pintarlo como algo que se acerca. Nunca se
// dice "te faltan N": se muestra el avance, que es otra cosa.
export function proximoHito(dias) {
  const siguiente = HITOS.find((h) => h > dias);
  if (!siguiente) return null;

  const anterior = [...HITOS].reverse().find((h) => h <= dias) ?? 0;
  const tramo = siguiente - anterior;

  return {
    meta: siguiente,
    fraccion: tramo > 0 ? (dias - anterior) / tramo : 0,
  };
}

// --- Lo que se le dice -----------------------------------------------------

export function textoDeTotales({ dias, semanas, habitos, lineas }) {
  if (dias === 0) {
    return 'Aquí va a estar todo lo que hagas. Empieza cuando quieras.';
  }

  const partes = [`${dias} ${dias === 1 ? 'día' : 'días'} en movimiento`];
  if (semanas > 1) partes.push(`${semanas} semanas distintas`);
  if (habitos > 0) partes.push(`${habitos} ${habitos === 1 ? 'hábito' : 'hábitos'} cumplidos`);
  if (lineas > 0) partes.push(`${lineas} ${lineas === 1 ? 'línea escrita' : 'líneas escritas'}`);

  return `${partes.join(', ')}.`;
}
