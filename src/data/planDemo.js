// El plan de arranque.
//
// Se usa mientras la IA no ha entregado el primero, y cuando falla. Respeta
// EXACTAMENTE el formato que devuelve la Azure Function `plan`, bloques
// incluidos: si cambia el origen del dato, no cambia ninguna pantalla.
//
// Dos reglas que este plan cumple y que el validador del servidor exige:
//   - Un día de entrenamiento lleva de 3 a 5 ejercicios, no uno.
//   - Semana 1 arranca fácil y sin impacto: cero saltos, cero carrera.
//     Es el plan que ve alguien de quien todavía no sabemos nada.
//
// Todos los nombres tienen guía escrita a mano en data/guias.js. Si agregas
// uno nuevo, agrégale la guía o la persona verá el consejo genérico.

export const planDemo = {
  semana: 1,
  nivel: 'inicio',
  mensaje_semana: 'Esta semana solo construimos el arranque.',
  dias: [
    {
      dia: 'lunes',
      tipo: 'entrenamiento',
      reto: 'Primer paso',
      duracion_min: 12,
      ejercicios: [
        { bloque: 'calentamiento', nombre: 'Movilidad articular', detalle: '2 minutos de cuello, hombros y cadera' },
        { bloque: 'principal', nombre: 'Caminata', detalle: '6 minutos a paso cómodo' },
        { bloque: 'principal', nombre: 'Sentadilla a la silla', detalle: '2 series de 8, sin apuro' },
        { bloque: 'cierre', nombre: 'Estiramiento', detalle: '2 minutos de piernas y espalda' },
      ],
      comida_tip: 'Agrega un vaso de agua al despertar',
      comida_color: 'verde',
      mensaje: 'Hoy solo arrancamos. Con eso basta.',
    },
    {
      dia: 'martes',
      tipo: 'suave',
      reto: 'Soltar el cuerpo',
      duracion_min: 8,
      ejercicios: [
        { bloque: 'principal', nombre: 'Respiración', detalle: '3 minutos, sentado y sin apuro' },
        { bloque: 'cierre', nombre: 'Estiramiento', detalle: '5 minutos de cuello, espalda y piernas' },
      ],
      comida_tip: 'Suma una fruta a tu desayuno',
      comida_color: 'verde',
      mensaje: 'Poco y suave también cuenta.',
    },
    {
      dia: 'miércoles',
      tipo: 'entrenamiento',
      reto: 'Fuerza tranquila',
      duracion_min: 14,
      ejercicios: [
        { bloque: 'calentamiento', nombre: 'Movilidad articular', detalle: '2 minutos, empezando por los hombros' },
        { bloque: 'principal', nombre: 'Sentadilla a la silla', detalle: '2 series de 8' },
        { bloque: 'principal', nombre: 'Flexiones en la pared', detalle: '2 series de 8' },
        { bloque: 'principal', nombre: 'Puente de glúteos', detalle: '2 series de 10' },
        { bloque: 'cierre', nombre: 'Estiramiento', detalle: '3 minutos, sin prisa' },
      ],
      comida_tip: 'Que la mitad del plato del almuerzo sea verdura',
      comida_color: 'verde',
      mensaje: 'Catorce minutos y listo. Tú puedes con eso.',
    },
    {
      dia: 'jueves',
      tipo: 'descanso',
      reto: 'Descanso de verdad',
      duracion_min: 0,
      ejercicios: [],
      comida_tip: 'Cena algo caliente y sin pantalla',
      comida_color: 'ambar',
      mensaje: 'Descansar es parte del plan. Sin culpa.',
    },
    {
      dia: 'viernes',
      tipo: 'entrenamiento',
      reto: 'Cierre de semana',
      duracion_min: 15,
      ejercicios: [
        { bloque: 'calentamiento', nombre: 'Pasos laterales', detalle: '2 minutos, de lado a lado' },
        { bloque: 'principal', nombre: 'Caminata', detalle: '6 minutos a paso vivo' },
        { bloque: 'principal', nombre: 'Subir escaleras', detalle: '4 minutos a tu ritmo' },
        { bloque: 'principal', nombre: 'Elevación de talones', detalle: '2 series de 12' },
        { bloque: 'cierre', nombre: 'Estiramiento', detalle: '2 minutos de pantorrillas' },
      ],
      comida_tip: 'Agrega huevo o yogur a tu desayuno',
      comida_color: 'verde',
      mensaje: 'Último empujón de la semana. Corto y bueno.',
    },
    {
      dia: 'sábado',
      tipo: 'suave',
      reto: 'Movimiento que te guste',
      duracion_min: 20,
      ejercicios: [
        { bloque: 'principal', nombre: 'Bailar', detalle: '10 minutos con la música que quieras' },
        { bloque: 'principal', nombre: 'Caminata', detalle: '8 minutos, donde te guste caminar' },
        { bloque: 'cierre', nombre: 'Estiramiento', detalle: '2 minutos de lo que sientas cargado' },
      ],
      comida_tip: 'Come sentado y sin afán una vez hoy',
      comida_color: 'ambar',
      mensaje: 'Hoy el ejercicio lo eliges tú.',
    },
    {
      dia: 'domingo',
      tipo: 'descanso',
      reto: 'Preparar la semana',
      duracion_min: 0,
      ejercicios: [],
      comida_tip: 'Deja fruta lavada y a la vista',
      comida_color: 'verde',
      mensaje: 'Solo respira. Mañana seguimos.',
    },
  ],
};
