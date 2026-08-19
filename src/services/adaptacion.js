// Motor de adaptación. Puro, sin red, sin IA.
//
// POR QUÉ NO LO HACE LA IA
// Gemini escribe el plan, pero decidir QUÉ ajustar a partir del historial es
// un análisis con reglas: reproducible, explicable y auditable. Si el ajuste
// lo decidiera el modelo, dos semanas iguales darían planes distintos y no
// habría forma de justificar por qué. Aquí el porqué siempre se puede mostrar.
//
// QUÉ MIRA
// El documento solo usa el cumplimiento global de la semana. Eso pierde lo
// más útil: que alguien cumpla el 90% los martes y el 20% los lunes no es
// "60% de cumplimiento", es un lunes mal puesto.

import { claveDia } from './fecha.js';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIA_MS = 86_400_000;

// Cuántas veces hay que ver un día de la semana antes de opinar de él.
// Con menos, una sola falla parecería un patrón.
export const MINIMO_PARA_CONCLUIR = 3;

const UMBRAL_FLOJO = 0.35;
const UMBRAL_FUERTE = 0.8;

// Un día solo es "difícil" si CONTRASTA con el propio promedio de la persona.
//
// Sin esto, alguien que cumple poco en general tenía seis días empatados en
// cero y la app elegía uno al azar para decirle "los jueves te cuestan". Eso
// es inventar un patrón donde solo hay poca adherencia, y encima suena a
// reproche. Se exige que la persona cumpla razonablemente en general y que
// ese día quede claramente por debajo de lo suyo.
const MINIMO_GLOBAL_PARA_COMPARAR = 0.4;
const BRECHA_MINIMA = 0.3;

function aFecha(clave) {
  const [a, m, d] = clave.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function clavesEntre(desde, hasta) {
  const salida = [];
  for (let t = desde.getTime(); t <= hasta.getTime(); t += DIA_MS) {
    salida.push(claveDia(new Date(t)));
  }
  return salida;
}

// Cumplimiento por día de la semana sobre los últimos N días.
// Devuelve { lunes: {vistos, hechos, tasa}, ... } solo con los días que
// de verdad ocurrieron en la ventana.
// Cumplimiento global de la ventana. Es la vara contra la que se compara
// cada día: lo que importa no es un número absoluto, sino el contraste.
export function tasaGlobal(diasCompletados = [], hoy = new Date(), ventana = 28) {
  const marcados = new Set(diasCompletados);
  const desde = new Date(hoy.getTime() - (ventana - 1) * DIA_MS);
  const claves = clavesEntre(desde, hoy);
  if (!claves.length) return 0;
  return claves.filter((c) => marcados.has(c)).length / claves.length;
}

export function porDiaDeLaSemana(diasCompletados = [], hoy = new Date(), ventana = 28) {
  const marcados = new Set(diasCompletados);
  const desde = new Date(hoy.getTime() - (ventana - 1) * DIA_MS);

  const conteo = {};

  for (const clave of clavesEntre(desde, hoy)) {
    const nombre = DIAS[aFecha(clave).getDay()];
    conteo[nombre] ??= { vistos: 0, hechos: 0, tasa: 0 };
    conteo[nombre].vistos += 1;
    if (marcados.has(clave)) conteo[nombre].hechos += 1;
  }

  for (const d of Object.values(conteo)) {
    d.tasa = d.vistos ? d.hechos / d.vistos : 0;
  }

  return conteo;
}

// El día que más se le atraviesa. null si no hay un patrón de verdad.
//
// Devolver null es la respuesta correcta muchas veces: es preferible callar
// a señalar un día por casualidad.
export function diaMasDificil(diasCompletados = [], hoy = new Date(), ventana = 28) {
  const global = tasaGlobal(diasCompletados, hoy, ventana);

  // Si en general cumple poco, no hay un día culpable: están todos igual.
  if (global < MINIMO_GLOBAL_PARA_COMPARAR) return null;

  const conteo = porDiaDeLaSemana(diasCompletados, hoy, ventana);

  let peor = null;
  for (const [nombre, d] of Object.entries(conteo)) {
    if (d.vistos < MINIMO_PARA_CONCLUIR) continue;
    if (d.tasa > UMBRAL_FLOJO) continue;
    if (global - d.tasa < BRECHA_MINIMA) continue;
    if (!peor || d.tasa < peor.tasa) peor = { dia: nombre, ...d, global };
  }

  return peor;
}

// El día que mejor le sale. Sirve para poner ahí lo más exigente.
export function diaMasFuerte(diasCompletados = [], hoy = new Date(), ventana = 28) {
  const conteo = porDiaDeLaSemana(diasCompletados, hoy, ventana);

  let mejor = null;
  for (const [nombre, d] of Object.entries(conteo)) {
    if (d.vistos < MINIMO_PARA_CONCLUIR) continue;
    if (d.tasa < UMBRAL_FUERTE) continue;
    if (!mejor || d.tasa > mejor.tasa) mejor = { dia: nombre, ...d };
  }

  return mejor;
}

// Cumplimiento de una ventana de 7 días que termina hace `atras` días.
function tasaDeSemana(marcados, hoy, atras = 0) {
  const fin = new Date(hoy.getTime() - atras * 7 * DIA_MS);
  const inicio = new Date(fin.getTime() - 6 * DIA_MS);
  const claves = clavesEntre(inicio, fin);
  const hechos = claves.filter((c) => marcados.has(c)).length;
  return hechos / claves.length;
}

// ¿Va mejor, igual o peor que la semana pasada?
export function tendencia(diasCompletados = [], hoy = new Date()) {
  const marcados = new Set(diasCompletados);
  const estaSemana = tasaDeSemana(marcados, hoy, 0);
  const anterior = tasaDeSemana(marcados, hoy, 1);

  const diferencia = estaSemana - anterior;

  let direccion = 'igual';
  if (diferencia >= 0.15) direccion = 'sube';
  else if (diferencia <= -0.15) direccion = 'baja';

  return { estaSemana, anterior, diferencia, direccion };
}

// La decisión completa: qué ajustar y por qué.
//
// `nivel` sigue las reglas del documento (menos de 50 baja, 50 a 80 mantiene,
// más de 80 sube un 10%), pero además señala días concretos.
export function analizar(diasCompletados = [], hoy = new Date()) {
  const t = tendencia(diasCompletados, hoy);
  const cumplimiento = Math.round(t.estaSemana * 100);
  const dificil = diaMasDificil(diasCompletados, hoy);
  const fuerte = diaMasFuerte(diasCompletados, hoy);

  let nivel = 'mantener';
  if (cumplimiento < 50) nivel = 'bajar';
  else if (cumplimiento > 80) nivel = 'subir';

  const ajustes = [];

  if (dificil) {
    ajustes.push({
      tipo: 'aliviar-dia',
      dia: dificil.dia,
      porque: `cumpliste ${dificil.hechos} de ${dificil.vistos} ${dificil.dia}s`,
    });
  }

  if (fuerte && nivel === 'subir') {
    ajustes.push({
      tipo: 'reforzar-dia',
      dia: fuerte.dia,
      porque: `los ${fuerte.dia}s casi nunca fallas`,
    });
  }

  if (nivel === 'bajar' && !dificil) {
    ajustes.push({
      tipo: 'bajar-todo',
      porque: `esta semana fue de ${cumplimiento}%`,
    });
  }

  return { cumplimiento, nivel, tendencia: t.direccion, dificil, fuerte, ajustes };
}

// Lo que Brío le dice al usuario sobre lo que notó.
// Solo habla cuando tiene evidencia: si no, se queda callado en vez de
// inventar un patrón, que es peor que no decir nada.
export function loQueNote(analisis, nombre) {
  const quien = nombre?.trim() ? `${nombre.trim()}, ` : '';

  if (analisis.dificil) {
    return `${quien}noté que los ${analisis.dificil.dia}s te cuestan más. La próxima semana ese día va suave.`;
  }

  if (analisis.tendencia === 'sube') {
    return `${quien}esta semana te movió más que la pasada. Sigue así, sin apurarte.`;
  }

  if (analisis.fuerte) {
    return `${quien}los ${analisis.fuerte.dia}s son tu día fuerte. Ahí vamos a poner lo bueno.`;
  }

  return null;
}

// Todo lo que Brío ha notado, no solo lo primero.
//
// `loQueNote` devuelve UNA frase porque va en una tarjeta pequeña. Esto
// devuelve la lista entera, para la pantalla de progreso: es la diferencia
// entre una app que te pregunta cosas y una que te devuelve lo que ha visto.
//
// Cada hallazgo lleva su evidencia, y por eso se puede mostrar sin mentir.
// Sin evidencia suficiente, el hallazgo no entra: la lista corta y verdadera
// vale más que la larga y adivinada.
export function hallazgos(diasCompletados = [], hoy = new Date(), extra = {}) {
  const analisis = analizar(diasCompletados, hoy);
  const t = tendencia(diasCompletados, hoy);
  const salida = [];

  if (analisis.fuerte) {
    salida.push({
      clave: 'dia-fuerte',
      titulo: `Los ${analisis.fuerte.dia}s son tuyos`,
      texto: `Cumpliste ${analisis.fuerte.hechos} de ${analisis.fuerte.vistos}. Ahí es donde ponemos lo bueno.`,
      tono: 'bien',
    });
  }

  if (analisis.dificil) {
    salida.push({
      clave: 'dia-dificil',
      titulo: `Los ${analisis.dificil.dia}s se te atraviesan`,
      texto: `${analisis.dificil.hechos} de ${analisis.dificil.vistos}. No es falta de ganas: ese día está mal puesto, y lo vamos a mover.`,
      tono: 'aviso',
    });
  }

  if (t.direccion === 'sube') {
    salida.push({
      clave: 'sube',
      titulo: 'Vas hacia arriba',
      texto: `Esta semana te moviste más que la pasada. ${Math.round(t.estaSemana * 7)} días contra ${Math.round(t.anterior * 7)}.`,
      tono: 'bien',
    });
  }

  if (t.direccion === 'baja') {
    salida.push({
      clave: 'baja',
      titulo: 'Esta semana pesó más',
      texto: 'Pasa, y no significa nada sobre ti. La próxima la armo más suave.',
      tono: 'calma',
    });
  }

  // Volver es la métrica de Brío y merece su sitio aquí.
  if (extra.regresos > 0) {
    salida.push({
      clave: 'regresos',
      titulo: extra.regresos === 1 ? 'Volviste una vez' : `Volviste ${extra.regresos} veces`,
      texto: 'Parar y volver es más difícil que no parar nunca. Eso es lo que cuenta.',
      tono: 'bien',
    });
  }

  if (extra.semanas >= 4) {
    salida.push({
      clave: 'permanencia',
      titulo: `${extra.semanas} semanas distintas`,
      texto: 'Ya no es un arranque. Es algo que haces.',
      tono: 'bien',
    });
  }

  return salida;
}

// El contexto extra que se le manda a la IA para armar el plan.
// Convierte el análisis en instrucciones concretas, no en datos crudos:
// un modelo obedece mejor una orden que una tabla.
export function instruccionesParaElPlan(analisis) {
  const lineas = [];

  for (const a of analisis.ajustes) {
    if (a.tipo === 'aliviar-dia') {
      lineas.push(`El ${a.dia} debe ser descanso o suave: ${a.porque}.`);
    }
    if (a.tipo === 'reforzar-dia') {
      lineas.push(`El ${a.dia} puede ser el día más exigente: ${a.porque}.`);
    }
    if (a.tipo === 'bajar-todo') {
      lineas.push(`Baja la dificultad de toda la semana: ${a.porque}.`);
    }
  }

  return lineas;
}
