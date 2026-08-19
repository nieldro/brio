// Cola de sincronización (patrón outbox). Pura y probada.
//
// EL PROBLEMA QUE RESUELVE
// Hoy las escrituras a la nube se lanzan y se olvidan: `marcarRegistro` hace
// su llamada y si falla, se traga el error. El dato queda en el teléfono pero
// la nube nunca se entera. Al cambiar de dispositivo, ese día desaparece.
//
// LA SOLUCIÓN
// Toda escritura entra primero a una cola persistente. El sincronizador la
// vacía cuando hay red, con espera creciente, y solo saca una operación
// cuando el servidor confirma. Si la app se cierra a mitad, la cola sobrevive.
//
// DECISIONES QUE IMPORTAN
//
// 1. Se colapsa por clave, no se acumula. Marcar el día tres veces no manda
//    tres escrituras: manda la última. Sin esto, una semana sin señal genera
//    una avalancha de peticiones al volver.
//
// 2. La última gana. Estas operaciones son idempotentes y de estado final
//    (el perfil ES esto, el día ESTÁ marcado), no incrementos. Así que
//    reemplazar es correcto y además evita conflictos.
//
// 3. Nada se descarta por fallar mucho. Un intento fallido sube la espera
//    hasta un techo, pero la operación se queda. Perder el dato de alguien
//    es peor que reintentar mil veces.

export const OPERACIONES = [
  'perfil',
  'registro',
  'logro',
  'habito',
  'gasto',
  'gasto-borrado',
  'presupuesto',
];

const ESPERA_BASE_MS = 2_000;
const ESPERA_MAXIMA_MS = 5 * 60_000;

// Dos operaciones con la misma clave se pisan entre sí. El perfil es uno solo;
// el registro y el logro son uno por día; el hábito, uno por hábito y día,
// porque marcar y desmarcar el mismo hábito debe quedarse con lo último.
export function claveDe(op) {
  if (op.tipo === 'perfil') return 'perfil';
  if (op.tipo === 'presupuesto') return 'presupuesto';
  if (op.tipo === 'habito') return `habito:${op.clave}:${op.fecha}`;

  // Los gastos se colapsan por SU id y no por el día. Con la regla general
  // (`tipo:fecha`) dos almuerzos del mismo martes se pisaban y solo subía uno:
  // el resto de las operaciones son de estado final, pero un gasto es una
  // cosa suelta y cada uno tiene que llegar.
  //
  // Anotar y borrar comparten clave a propósito: si la persona anota y borra
  // sin señal, lo que sale es el borrado, y no dos viajes contradictorios.
  if (op.tipo === 'gasto') return `gasto:${op.gasto?.id}`;
  if (op.tipo === 'gasto-borrado') return `gasto:${op.id}`;

  return `${op.tipo}:${op.fecha}`;
}

// Agrega o reemplaza. Devuelve una cola nueva: nunca muta la que recibe.
export function encolar(cola = [], operacion) {
  if (!OPERACIONES.includes(operacion?.tipo)) return cola;

  const clave = claveDe(operacion);
  const nueva = cola.filter((o) => claveDe(o) !== clave);

  return [
    ...nueva,
    {
      ...operacion,
      clave,
      intentos: 0,
      // Cuándo se puede volver a intentar. 0 = ya.
      esperarHasta: 0,
    },
  ];
}

// Lo que toca mandar ahora. Respeta la espera de cada operación.
export function pendientes(cola = [], ahora = Date.now()) {
  return cola.filter((o) => (o.esperarHasta ?? 0) <= ahora);
}

export function hayPendientes(cola = [], ahora = Date.now()) {
  return pendientes(cola, ahora).length > 0;
}

// El servidor confirmó: fuera de la cola.
export function confirmar(cola = [], clave) {
  return cola.filter((o) => o.clave !== clave);
}

// Falló: sube el intento y aleja el siguiente. La espera crece al doble
// hasta un techo de cinco minutos, para no castigar la batería ni la red.
export function reprogramar(cola = [], clave, ahora = Date.now()) {
  return cola.map((o) => {
    if (o.clave !== clave) return o;

    const intentos = (o.intentos ?? 0) + 1;
    const espera = Math.min(ESPERA_BASE_MS * 2 ** (intentos - 1), ESPERA_MAXIMA_MS);

    return { ...o, intentos, esperarHasta: ahora + espera };
  });
}

// Cuándo conviene volver a mirar la cola. null si no hay nada que esperar.
export function proximoIntento(cola = [], ahora = Date.now()) {
  if (!cola.length) return null;
  if (hayPendientes(cola, ahora)) return 0;

  const esperas = cola.map((o) => (o.esperarHasta ?? 0) - ahora).filter((ms) => ms > 0);
  return esperas.length ? Math.min(...esperas) : 0;
}

// Para mostrárselo al usuario sin tecnicismos.
export function resumen(cola = []) {
  if (!cola.length) return { cantidad: 0, texto: 'Todo guardado.' };

  const cantidad = cola.length;
  const atascada = cola.some((o) => (o.intentos ?? 0) >= 3);

  if (atascada) {
    return {
      cantidad,
      texto: 'Guardado en tu teléfono. Lo subo cuando vuelva la señal.',
    };
  }

  return {
    cantidad,
    texto: cantidad === 1 ? 'Guardando un cambio…' : `Guardando ${cantidad} cambios…`,
  };
}
