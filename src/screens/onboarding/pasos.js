export { interpolar } from '../../services/texto';

// Los 11 pasos del onboarding, declarativos.
// Los textos son los del documento del producto. Si hay que cambiar una frase,
// se cambia aquí y en ningún otro lado.

export const PASOS = [
  {
    id: 'intro',
    tipo: 'mensaje',
    titulo: 'Hola. Soy Brío.',
    sub: 'No vengo a exigirte. Vengo a acompañarte.',
    boton: 'Empecemos',
  },
  {
    id: 'nombre',
    tipo: 'campo',
    titulo: '¿Cómo te llamo?',
    campo: 'nombre',
    placeholder: 'Tu nombre',
    boton: 'Seguir',
  },
  {
    id: 'objetivo',
    tipo: 'opciones',
    titulo: '{nombre}, ¿qué buscas?',
    campo: 'objetivo',
    opciones: [
      { etiqueta: 'Perder peso', valor: 'Perder peso' },
      { etiqueta: 'Ganar músculo', valor: 'Ganar músculo' },
      { etiqueta: 'Sentirme mejor', valor: 'Sentirme mejor' },
      { etiqueta: 'Crear el hábito', valor: 'Crear el hábito' },
    ],
  },
  {
    id: 'porque',
    tipo: 'opciones',
    titulo: '¿Y para qué lo quieres de verdad?',
    sub: 'Esto queda entre tú y yo.',
    campo: 'porque',
    permiteOtro: true,
    opciones: [
      { etiqueta: 'Mi salud', valor: 'Mi salud' },
      { etiqueta: 'Mi familia', valor: 'Mi familia' },
      { etiqueta: 'Volver a gustarme', valor: 'Volver a gustarme' },
      { etiqueta: 'Tener energía', valor: 'Tener energía' },
    ],
  },
  {
    id: 'datos',
    tipo: 'datos',
    titulo: 'Cuéntame de ti.',
    sub: 'Solo para armar tu plan.',
    boton: 'Seguir',
  },
  {
    id: 'lugar',
    tipo: 'opciones',
    titulo: '¿Dónde entrenamos?',
    campo: 'lugar',
    opciones: [
      { etiqueta: 'En casa', valor: 'En casa' },
      { etiqueta: 'En el gym', valor: 'En el gym' },
      { etiqueta: 'Mezclado', valor: 'Mezclado' },
    ],
  },
  {
    id: 'tiempo',
    tipo: 'opciones',
    titulo: '¿Cuánto tiempo real tienes al día?',
    campo: 'tiempo_min',
    pie: 'Poco y constante gana siempre.',
    opciones: [
      { etiqueta: '10 minutos', valor: 10 },
      { etiqueta: '20 minutos', valor: 20 },
      { etiqueta: '30 minutos', valor: 30 },
      { etiqueta: '45 minutos', valor: 45 },
    ],
  },
  {
    id: 'permiso',
    tipo: 'mensaje',
    titulo: '¿Me dejas recordarte?',
    sub: 'Máximo dos mensajes al día. Lo prometo.',
    boton: 'Dale',
    // En la fase 6 este paso además pide el permiso real de Expo Push.
    alAvanzar: { notificaciones: true },
  },
  {
    id: 'hora',
    tipo: 'hora',
    titulo: '¿A qué hora te hablo?',
    campo: 'hora_recordatorio',
    boton: 'Listo',
  },
  {
    id: 'cargando',
    tipo: 'cargando',
    titulo: 'Dame un momento.',
    sub: 'Estoy armando tu semana.',
  },
  {
    id: 'final',
    tipo: 'final',
    boton: 'Vamos',
  },
];
