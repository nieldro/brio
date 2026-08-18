import test from 'node:test';
import assert from 'node:assert/strict';

import {
  correoValido,
  normalizarCorreo,
  revisarCorreo,
  revisarClave,
  revisarConfirmacion,
  listoParaEntrar,
  listoParaCrear,
  mensajeDeError,
  LARGO_MINIMO_CLAVE,
} from '../src/services/credenciales.js';

// --- Correo ---------------------------------------------------------------

test('acepta correos normales', () => {
  for (const c of [
    'daniel@ucentral.edu.co',
    'a@b.co',
    'nombre.apellido+brio@gmail.com',
    'DANIEL@UCENTRAL.EDU.CO',
  ]) {
    assert.ok(correoValido(c), `debió aceptar ${c}`);
  }
});

test('rechaza lo que claramente no es un correo', () => {
  for (const c of ['', '   ', 'daniel', 'daniel@', '@gmail.com', 'daniel gmail.com', 'a@b.c']) {
    assert.ok(!correoValido(c), `debió rechazar "${c}"`);
  }
});

test('el correo se normaliza para que no falle por mayúsculas o espacios', () => {
  assert.equal(normalizarCorreo('  Daniel@UCentral.Edu.CO '), 'daniel@ucentral.edu.co');
  assert.equal(normalizarCorreo(undefined), '');
});

// --- Clave ----------------------------------------------------------------

test('la clave exige el largo mínimo', () => {
  assert.ok(revisarClave('1234567'), 'siete caracteres no alcanza');
  assert.equal(revisarClave('12345678'), null);
  assert.equal(revisarClave('a'.repeat(LARGO_MINIMO_CLAVE)), null);
});

test('la confirmación atrapa el dedazo', () => {
  assert.equal(revisarConfirmacion('clavelarga', 'clavelarga'), null);
  assert.ok(revisarConfirmacion('clavelarga', 'clavelargo'));
  assert.ok(revisarConfirmacion('clavelarga', ''));
});

// --- Puertas --------------------------------------------------------------

test('entrar necesita correo y clave válidos', () => {
  assert.ok(listoParaEntrar({ correo: 'a@b.co', clave: '12345678' }));
  assert.ok(!listoParaEntrar({ correo: 'a@b', clave: '12345678' }));
  assert.ok(!listoParaEntrar({ correo: 'a@b.co', clave: '123' }));
});

test('crear cuenta además necesita la confirmación', () => {
  const base = { correo: 'a@b.co', clave: '12345678' };
  assert.ok(listoParaCrear({ ...base, confirmacion: '12345678' }));
  assert.ok(!listoParaCrear({ ...base, confirmacion: '1234567' }));
  assert.ok(!listoParaCrear({ ...base, confirmacion: '' }));
});

// --- Voz de Brío ----------------------------------------------------------

const PROHIBIDAS = ['fracaso', 'excusas', 'deberías', 'error', 'inválido', 'incorrecto'];

function revisarVoz(texto) {
  assert.ok(texto && texto.length > 0, 'ningún mensaje puede quedar vacío');

  const bajo = texto.toLowerCase();
  for (const mala of PROHIBIDAS) {
    assert.ok(!bajo.includes(mala), `"${texto}" usa "${mala}"`);
  }

  const frases = texto.split(/[.!?]+/).filter((f) => f.trim());
  assert.ok(frases.length <= 2, `"${texto}" tiene ${frases.length} frases, máximo 2`);

  // Nada de gritos ni signos de admiración: Brío no regaña ni celebra de más.
  assert.ok(!texto.includes('!'), `"${texto}" lleva signo de admiración`);
}

test('los avisos de los campos hablan como Brío', () => {
  const avisos = [
    revisarCorreo(''),
    revisarCorreo('daniel'),
    revisarClave(''),
    revisarClave('123'),
    revisarConfirmacion('clavelarga', ''),
    revisarConfirmacion('clavelarga', 'otra'),
  ];

  for (const a of avisos) revisarVoz(a);
});

test('los errores del servidor se traducen sin acusar a nadie', () => {
  const crudos = [
    'Invalid login credentials',
    'User already registered',
    'Email not confirmed',
    'Password should be at least 6 characters',
    'For security purposes, you can only request this after 60 seconds. rate limit',
    'Network request failed',
    'Unable to validate email address: invalid format',
  ];

  for (const crudo of crudos) {
    const traducido = mensajeDeError(crudo);
    revisarVoz(traducido);
    assert.notEqual(traducido, crudo, `"${crudo}" quedó sin traducir`);
  }
});

test('un error desconocido nunca muestra el texto crudo', () => {
  const raro = 'PGRST301: JWSError JWSInvalidSignature at 0x7f8b';
  const traducido = mensajeDeError(raro);
  assert.ok(!traducido.includes('JWS'), 'no puede filtrar detalle técnico');
  assert.ok(!traducido.includes('PGRST'), 'no puede filtrar el código interno');
  revisarVoz(traducido);
});

test('acepta tanto un Error como un texto suelto', () => {
  const deObjeto = mensajeDeError(new Error('Invalid login credentials'));
  const deTexto = mensajeDeError('Invalid login credentials');
  assert.equal(deObjeto, deTexto);
  assert.equal(mensajeDeError(null), mensajeDeError(undefined));
});
