import { claveDia, diasEntreClaves } from './fecha.js';

// Cuánto tiene que hablar Brío.
//
// DE DÓNDE SALE LA IDEA
// El diseño ético de rachas dice que hay que ir retirando los estímulos
// externos una vez que el patrón ya está formado, para que la persona se
// sostenga en la satisfacción propia y no en la app. Duolingo lo hace con
// la dificultad; aquí se hace con la VOZ.
//
// POR QUÉ ES LO CORRECTO PARA BRÍO
// El objetivo de una app de hábitos es volverse innecesaria. Una app que
// necesita celebrarte cada día para que sigas no te está construyendo un
// hábito: te está construyendo una dependencia de ella.
//
// Y encaja con lo que el producto persigue: la confianza de creerse capaz.
// Al principio Brío empuja, porque nadie arranca solo. Después se corre a un
// lado, porque la persona ya no lo necesita, y eso mismo se lo dice.
//
// Nunca desaparece del todo. "Aquí estoy" siempre queda.

export const NIVELES = ['cerca', 'medio', 'lejos'];

// Semanas distintas con movimiento que hacen falta para que Brío se aparte.
const SEMANAS_MEDIO = 4;
const SEMANAS_LEJOS = 10;

// Y qué tan constante ha estado últimamente. Alguien con doce semanas que
// lleva un mes parado necesita a Brío cerca otra vez: la distancia se gana,
// pero también se devuelve cuando hace falta.
const CONSTANCIA_MINIMA = 0.35;

function constanciaReciente(diasCompletados = [], hoy = new Date(), ventana = 21) {
  const marcados = new Set(diasCompletados);
  const hoyClave = claveDia(hoy);

  let hechos = 0;
  for (const clave of marcados) {
    const atras = diasEntreClaves(clave, hoyClave);
    if (atras >= 0 && atras < ventana) hechos += 1;
  }

  return hechos / ventana;
}

// 'cerca' | 'medio' | 'lejos'
export function nivelDeAcompanamiento({ semanas = 0, diasCompletados = [] } = {}, hoy = new Date()) {
  const reciente = constanciaReciente(diasCompletados, hoy);

  // Si lleva tiempo sin aparecer, Brío vuelve a acercarse sin preguntar.
  if (reciente < CONSTANCIA_MINIMA) return 'cerca';

  if (semanas >= SEMANAS_LEJOS) return 'lejos';
  if (semanas >= SEMANAS_MEDIO) return 'medio';
  return 'cerca';
}

// El saludo de Hoy, según la distancia.
//
// Cerca: empuja y explica. Medio: acompaña sin adornos. Lejos: casi se calla,
// porque a esa altura la persona ya sabe qué hacer y decírselo sobra.
export function saludoSegunDistancia(nivel, { completadoHoy, racha, rota }) {
  if (nivel === 'lejos') {
    if (completadoHoy) return 'Hecho.';
    return 'Aquí estoy.';
  }

  if (nivel === 'medio') {
    if (completadoHoy) return racha > 1 ? `Hecho. Van ${racha}.` : 'Hecho.';
    if (rota) return 'Hoy arrancamos suave.';
    return 'Cuando quieras.';
  }

  // cerca
  if (completadoHoy) {
    return racha > 1
      ? `Ya está. Llevas ${racha} días seguidos y eso lo hiciste tú.`
      : 'Ya diste el primer paso. Con eso basta.';
  }
  if (rota) return 'Ayer no se pudo. Normal. Hoy arrancamos suave.';
  return 'Cuando quieras arrancamos. Sin prisa.';
}

// Lo que Brío dice sobre por qué habla menos. Se dice UNA vez, al cambiar de
// nivel: si no se explicara, la persona sentiría que la app se enfrió con
// ella, que es lo contrario de lo que está pasando.
export function porQueHabloMenos(nivel) {
  if (nivel === 'medio') {
    return 'Ya llevas un mes apareciendo, así que voy a hablarte menos. No es que me haya ido: es que ya no me necesitas tanto.';
  }
  if (nivel === 'lejos') {
    return 'A esta altura esto ya es tuyo. Me quedo a un lado y aquí sigo si me buscas.';
  }
  return null;
}

// Cada cuánto celebrar. Al principio siempre; después, solo lo que de verdad
// vale, para que la celebración no pierda su valor de tanto repetirse.
export function debeCelebrar(nivel, { esRegreso = false, esHito = false } = {}) {
  if (esRegreso || esHito) return true;
  return nivel === 'cerca';
}
