// Ideas para sumarle a lo que ya comes.
//
// Escritas a mano, no generadas: la comida es donde más fácil se cuela una
// dieta disfrazada de consejo.
//
// Las reglas del documento mandan enteras y ninguna se negocia:
//   - Nunca calorías, macros ni cantidades exactas.
//   - Nunca dietas restrictivas ni ayunos.
//   - Tips de SUMA, no de resta. Agrega, no elimines.
//   - El semáforo informa, nunca castiga. No hay comida mala.
//
// Por eso ninguna idea empieza con "deja de", "evita" o "cambia". Todas
// empiezan con un verbo de sumar. Una prueba lo vigila.
//
// Y son de acá: arepa, aguacate, panela, frijol. Un consejo de comida que
// nombra alimentos que la persona no tiene en la cocina no sirve para nada.

export const MOMENTOS = [
  { clave: 'desayuno', titulo: 'Al desayuno' },
  { clave: 'almuerzo', titulo: 'Al almuerzo' },
  { clave: 'cena', titulo: 'A la cena' },
  { clave: 'entre', titulo: 'Entre comidas' },
];

export const IDEAS = [
  // --- Desayuno -----------------------------------------------------------
  { momento: 'desayuno', color: 'verde', texto: 'Súmale un huevo a lo que ya desayunas.' },
  { momento: 'desayuno', color: 'verde', texto: 'Acompáñalo con una fruta entera, de la que te guste.' },
  { momento: 'desayuno', color: 'verde', texto: 'Ponle aguacate a la arepa.' },
  { momento: 'desayuno', color: 'verde', texto: 'Toma un vaso de agua antes del café.' },
  { momento: 'desayuno', color: 'ambar', texto: 'Si desayunas dulce, súmale algo con huevo o queso al lado.' },
  { momento: 'desayuno', color: 'verde', texto: 'Agrega tomate y cebolla a los huevos.' },

  // --- Almuerzo -----------------------------------------------------------
  { momento: 'almuerzo', color: 'verde', texto: 'Que la mitad del plato sea verdura, del color que sea.' },
  { momento: 'almuerzo', color: 'verde', texto: 'Súmale una ensalada pequeña antes del plato fuerte.' },
  { momento: 'almuerzo', color: 'verde', texto: 'Acompaña con frijol, lenteja o garbanzo.' },
  { momento: 'almuerzo', color: 'verde', texto: 'Ponle un chorrito de aceite de oliva crudo a la ensalada.' },
  { momento: 'almuerzo', color: 'ambar', texto: 'Si el almuerzo viene solo, súmale fruta de postre.' },
  { momento: 'almuerzo', color: 'verde', texto: 'Come sentado y sin pantalla, aunque sea hoy.' },

  // --- Cena ---------------------------------------------------------------
  { momento: 'cena', color: 'verde', texto: 'Súmale verdura cocida, que cae más suave de noche.' },
  { momento: 'cena', color: 'verde', texto: 'Cena algo caliente: una sopa cuenta.' },
  { momento: 'cena', color: 'verde', texto: 'Agrega huevo o queso si la cena quedó liviana.' },
  { momento: 'cena', color: 'ambar', texto: 'Si cenas tarde, súmale algo fresco al lado.' },
  { momento: 'cena', color: 'verde', texto: 'Deja el vaso de agua servido para mañana.' },

  // --- Entre comidas ------------------------------------------------------
  { momento: 'entre', color: 'verde', texto: 'Ten fruta lavada y a la vista.' },
  { momento: 'entre', color: 'verde', texto: 'Súmale un puñado de maní o almendras a la tarde.' },
  { momento: 'entre', color: 'verde', texto: 'Un yogur natural con fruta encima.' },
  { momento: 'entre', color: 'verde', texto: 'Agua antes de decidir si de verdad tienes hambre.' },
  { momento: 'entre', color: 'ambar', texto: 'Si vas a picar, siéntate y come despacio. Cuenta igual.' },
];

// Lo que Brío dice arriba de la pantalla. Nunca promete nada.
export const FRASES = [
  'Aquí no se quita nada. Solo se suma.',
  'No hay comida mala. Hay platos que piden compañía.',
  'Comer bien no es comer poco.',
  'Una cosa a la vez. Con eso basta.',
];
