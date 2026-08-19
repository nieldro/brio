// Hábitos que Brío propone.
//
// La app se llama de hábitos y hasta hoy solo tenía el reto del día. Esto es
// lo otro: las cosas pequeñas que sostienen todo lo demás.
//
// Todas cumplen tres condiciones, y por eso están y otras no:
//   - Se hacen en menos de cinco minutos. Un hábito largo no es un hábito,
//     es otra tarea que se abandona.
//   - Se pueden hacer en un mal día. Ese es el día que decide si duran.
//   - No se pueden fallar a medias: o se hizo o no, sin porcentajes.
//
// Ninguna habla de comida en cantidades, de peso ni del cuerpo.

export const HABITOS = [
  { clave: 'agua', texto: 'Un vaso de agua al despertar', zona: 'cuerpo' },
  { clave: 'estirar', texto: 'Estirar dos minutos al levantarme', zona: 'cuerpo' },
  { clave: 'caminar', texto: 'Caminar aunque sea a la esquina', zona: 'cuerpo' },
  { clave: 'escaleras', texto: 'Subir por las escaleras hoy', zona: 'cuerpo' },
  { clave: 'respirar', texto: 'Tres respiraciones antes de arrancar el día', zona: 'calma' },
  { clave: 'pantalla', texto: 'Comer sin pantalla una vez hoy', zona: 'calma' },
  { clave: 'dormir', texto: 'Dejar el teléfono fuera de la cama', zona: 'calma' },
  { clave: 'sol', texto: 'Salir a que me dé el sol un momento', zona: 'calma' },
  { clave: 'gracias', texto: 'Nombrar una cosa buena del día', zona: 'animo' },
  { clave: 'bien', texto: 'Decirme una cosa buena de mí', zona: 'animo' },
  { clave: 'mensaje', texto: 'Escribirle a alguien que quiero', zona: 'animo' },
  { clave: 'fruta', texto: 'Sumar una fruta a lo que ya como', zona: 'cuerpo' },
];

// Cuántos se pueden llevar a la vez.
//
// Tres, y no es un número al azar: quien viene de abandonar cinco apps no
// necesita doce casillas nuevas que fallar. Con tres, fallar uno todavía deja
// dos hechos, y el día no se siente perdido.
export const MAXIMO = 3;

export const ZONAS_HABITO = [
  { clave: 'cuerpo', titulo: 'Para el cuerpo' },
  { clave: 'calma', titulo: 'Para la cabeza' },
  { clave: 'animo', titulo: 'Para el ánimo' },
];
