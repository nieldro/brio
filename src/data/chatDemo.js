// Con qué abre el chat cuando todavía no hay historial.
//
// Aquí vivía una conversación quemada de la fase 2 que saludaba a "Daniel" y
// ponía en la burbuja del usuario una frase que nunca escribió. A cualquiera
// que no se llamara Daniel, la app lo llamaba por el nombre de otro y le
// atribuía palabras ajenas, justo en la pantalla donde promete acompañarlo.
//
// Ahora es UNA burbuja, de Brío, con el nombre de quien abre la app. Nada de
// palabras puestas en boca de nadie: la primera frase del usuario la escribe
// el usuario.
export function primerMensaje(nombre) {
  const quien = nombre?.trim();

  return {
    id: 'saludo',
    rol: 'brio',
    texto: quien ? `Hola ${quien}. Cuéntame cómo vas.` : 'Hola. Cuéntame cómo vas.',
  };
}

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
