// Datos quemados de la fase 1.
// El objeto `planDemo` respeta EXACTAMENTE el formato que devolverá la Edge
// Function `plan` en la fase 5. Cuando llegue la IA solo cambia el origen del
// dato, no las pantallas que lo consumen.

export const planDemo = {
  semana: 1,
  nivel: 'inicio',
  mensaje_semana: 'Esta semana solo construimos el arranque.',
  dias: [
    {
      dia: 'lunes',
      tipo: 'entrenamiento',
      reto: 'Primer paso',
      duracion_min: 10,
      ejercicios: [{ nombre: 'Caminata', detalle: '10 minutos a paso cómodo' }],
      comida_tip: 'Agrega un vaso de agua al despertar',
      comida_color: 'verde',
      mensaje: 'Hoy solo arrancamos. Con eso basta.',
    },
    {
      dia: 'martes',
      tipo: 'suave',
      reto: 'Soltar el cuerpo',
      duracion_min: 8,
      ejercicios: [{ nombre: 'Estiramiento', detalle: '8 minutos de cuello, espalda y piernas' }],
      comida_tip: 'Suma una fruta a tu desayuno',
      comida_color: 'verde',
      mensaje: 'Poco y suave también cuenta.',
    },
    {
      dia: 'miércoles',
      tipo: 'entrenamiento',
      reto: 'Fuerza tranquila',
      duracion_min: 12,
      ejercicios: [
        { nombre: 'Sentadilla a la silla', detalle: '2 series de 8, sin apuro' },
        { nombre: 'Plancha apoyada', detalle: '2 series de 15 segundos' },
      ],
      comida_tip: 'Que la mitad del plato del almuerzo sea verdura',
      comida_color: 'verde',
      mensaje: 'Doce minutos y listo. Tú puedes con eso.',
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
        { nombre: 'Caminata rápida', detalle: '10 minutos' },
        { nombre: 'Subir escaleras', detalle: '5 minutos a tu ritmo' },
      ],
      comida_tip: 'Agrega proteína al desayuno: huevo, yogur o queso',
      comida_color: 'verde',
      mensaje: 'Último empujón de la semana. Corto y bueno.',
    },
    {
      dia: 'sábado',
      tipo: 'suave',
      reto: 'Movimiento que te guste',
      duracion_min: 20,
      ejercicios: [{ nombre: 'Lo que disfrutes', detalle: 'Bailar, caminar o pasear. 20 minutos' }],
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
