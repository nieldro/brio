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

// Chips de respuesta rápida.
//
// `respuesta` es lo que contesta Brío mientras no hay IA. `accion` es lo que
// el chip HACE en la app, y por eso existe: "Cambia mi reto" contestaba
// "listo, lo cambio" y no cambiaba nada. Un botón que promete y no cumple
// enseña que la app no vale la pena, y eso no se recupera con una frase.
export const CHIPS = [
  {
    texto: 'No pude hoy',
    accion: 'aliviar',
    respuesta: 'Ayer no se pudo. Normal. Te dejé la versión corta de hoy, de dos minutos.',
  },
  {
    texto: 'Me siento bajo',
    respuesta: 'Te leo y está bien sentirse así. No te pido nada hoy, solo que respires.',
  },
  {
    texto: 'Cambia mi reto',
    accion: 'aliviar',
    respuesta: 'Hecho. Te dejé el reto en su versión corta, de dos minutos. Cuenta igual.',
  },
];
