// Conversación quemada de la fase 2. En la fase 5 esto lo reemplaza
// la Edge Function `coach` y la tabla `mensajes`.

export const mensajesDemo = [
  { id: 'm1', rol: 'brio', texto: 'Hola Daniel. ¿Cómo amaneciste hoy?' },
  { id: 'm2', rol: 'user', texto: 'Con pocas ganas, la verdad.' },
  {
    id: 'm3',
    rol: 'brio',
    texto: 'Gracias por decirlo. Hoy hacemos la versión corta y con eso ya vamos bien.',
  },
];

// Chips de respuesta rápida y su respuesta local mientras no hay IA.
export const CHIPS = [
  {
    texto: 'No pude hoy',
    respuesta: 'Ayer no se pudo. Normal. Hoy arrancamos suave, con diez minutos.',
  },
  {
    texto: 'Me siento bajo',
    respuesta: 'Te leo y está bien sentirse así. No te pido nada hoy, solo que respires.',
  },
  {
    texto: 'Cambia mi reto',
    respuesta: 'Listo, lo cambio por una caminata corta. Tú eliges cuándo.',
  },
];
