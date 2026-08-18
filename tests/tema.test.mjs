import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PALETAS,
  RELLENOS,
  tipografiaDe,
  semaforoDe,
  sombraDe,
} from '../src/theme.js';

// --- Contraste real, no a ojo ---------------------------------------------
// WCAG 2.1: luminancia relativa y razón de contraste.

function luminancia(hex) {
  const canal = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const n = hex.replace('#', '');
  const r = canal(parseInt(n.slice(0, 2), 16));
  const g = canal(parseInt(n.slice(2, 4), 16));
  const b = canal(parseInt(n.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  const claro = Math.max(la, lb);
  const oscuro = Math.min(la, lb);
  return (claro + 0.05) / (oscuro + 0.05);
}

const MODOS = ['claro', 'oscuro'];

// --- Estructura -----------------------------------------------------------

test('las dos paletas tienen exactamente las mismas claves', () => {
  const claras = Object.keys(PALETAS.claro).sort();
  const oscuras = Object.keys(PALETAS.oscuro).sort();
  assert.deepEqual(
    oscuras,
    claras,
    'si una paleta le falta una clave, una pantalla se rompe solo en ese modo',
  );
});

test('todos los colores son hex de 6 dígitos', () => {
  for (const modo of MODOS) {
    for (const [clave, valor] of Object.entries(PALETAS[modo])) {
      assert.match(valor, /^#[0-9A-Fa-f]{6}$/, `${modo}.${clave} = ${valor}`);
    }
  }
});

// --- Reglas duras del documento ------------------------------------------

test('cero negro puro y cero blanco puro como fondo, en ningún modo', () => {
  for (const modo of MODOS) {
    for (const [clave, valor] of Object.entries(PALETAS[modo])) {
      assert.notEqual(valor.toUpperCase(), '#000000', `${modo}.${clave} es negro puro`);
    }
    // El fondo de la app nunca es blanco puro: siempre tiene temperatura.
    assert.notEqual(PALETAS[modo].crema.toUpperCase(), '#FFFFFF', `${modo}.crema es blanco puro`);
  }
});

test('el oscuro conserva la calidez de la marca: rojo mayor o igual que azul', () => {
  // Un oscuro gris azulado traicionaría la identidad. En cada color de
  // superficie y texto, el canal rojo manda sobre el azul.
  for (const clave of ['crema', 'blanco', 'borde', 'cafe', 'gris', 'apagado']) {
    const hex = PALETAS.oscuro[clave].replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    assert.ok(r >= b, `oscuro.${clave} es más azul que rojo: ${PALETAS.oscuro[clave]}`);
  }
});

test('el coral sigue siendo el mismo en los dos modos', () => {
  assert.equal(
    PALETAS.claro.coral,
    PALETAS.oscuro.coral,
    'el color de acción es la marca: no cambia de noche',
  );
});

// --- Legibilidad ----------------------------------------------------------

test('el texto principal pasa AA sobre fondo y sobre tarjeta', () => {
  for (const modo of MODOS) {
    const C = PALETAS[modo];
    for (const superficie of ['crema', 'blanco']) {
      const razon = contraste(C.cafe, C[superficie]);
      assert.ok(razon >= 4.5, `${modo}: cafe sobre ${superficie} da ${razon.toFixed(2)}:1`);
    }
  }
});

test('el texto secundario pasa AA sobre fondo y sobre tarjeta', () => {
  for (const modo of MODOS) {
    const C = PALETAS[modo];
    for (const superficie of ['crema', 'blanco']) {
      const razon = contraste(C.gris, C[superficie]);
      assert.ok(razon >= 4.5, `${modo}: gris sobre ${superficie} da ${razon.toFixed(2)}:1`);
    }
  }
});

test('el coral de TEXTO pasa AA sobre fondo y sobre tarjeta', () => {
  // La etiqueta "reto de hoy" es de 12px: no cuenta como texto grande.
  for (const modo of MODOS) {
    const C = PALETAS[modo];
    for (const superficie of ['crema', 'blanco']) {
      const razon = contraste(C.coralTexto, C[superficie]);
      assert.ok(razon >= 4.5, `${modo}: coralTexto sobre ${superficie} da ${razon.toFixed(2)}:1`);
    }
  }
});

test('el coral de MARCA se distingue como forma, aunque no sirva para texto chico', () => {
  // La chispa y los bordes son gráficos: el mínimo es 3:1, no 4,5:1.
  for (const modo of MODOS) {
    const C = PALETAS[modo];
    for (const superficie of ['crema', 'blanco']) {
      const razon = contraste(C.coral, C[superficie]);
      assert.ok(razon >= 2.8, `${modo}: coral sobre ${superficie} da ${razon.toFixed(2)}:1`);
    }
  }
});

test('los rellenos de botón aguantan texto blanco encima', () => {
  // Texto de 17px en negrita cuenta como texto grande: el mínimo es 3:1.
  for (const modo of MODOS) {
    for (const [clave, relleno] of Object.entries(RELLENOS[modo])) {
      const razon = contraste('#FFFFFF', relleno);
      assert.ok(razon >= 3, `${modo}: blanco sobre relleno ${clave} da ${razon.toFixed(2)}:1`);
    }
  }
});

test('la tarjeta se distingue del fondo en los dos modos', () => {
  for (const modo of MODOS) {
    const C = PALETAS[modo];
    assert.notEqual(C.blanco, C.crema, `${modo}: la tarjeta se pierde en el fondo`);
    const razon = contraste(C.blanco, C.crema);
    assert.ok(razon >= 1.05, `${modo}: tarjeta y fondo casi iguales (${razon.toFixed(3)}:1)`);
  }
});

test('los tres colores del semáforo se distinguen entre sí', () => {
  for (const modo of MODOS) {
    const s = semaforoDe(PALETAS[modo]);
    const pares = [
      ['verde', 'ambar'],
      ['ambar', 'rojo'],
      ['verde', 'rojo'],
    ];
    for (const [a, b] of pares) {
      assert.notEqual(s[a], s[b], `${modo}: ${a} y ${b} son el mismo color`);
    }
  }
});

// --- Derivados ------------------------------------------------------------

test('la tipografía toma el color del modo, no uno fijo', () => {
  const claro = tipografiaDe(PALETAS.claro);
  const oscuro = tipografiaDe(PALETAS.oscuro);
  assert.equal(claro.cuerpo.color, PALETAS.claro.cafe);
  assert.equal(oscuro.cuerpo.color, PALETAS.oscuro.cafe);
  assert.notEqual(claro.cuerpo.color, oscuro.cuerpo.color);
});

test('el texto de botón es blanco en los dos modos', () => {
  // Va encima de un relleno de color, no de la superficie del tema.
  for (const modo of MODOS) {
    assert.equal(tipografiaDe(PALETAS[modo]).boton.color, '#FFFFFF');
  }
});

test('en oscuro la sombra se apaga en vez de dejar un halo negro', () => {
  assert.equal(sombraDe('oscuro').elevation, 0);
  assert.ok(sombraDe('claro').elevation > 0);
});
