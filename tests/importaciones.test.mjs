import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Usar algo sin haberlo importado.
//
// Esta prueba existe porque el error se coló dos veces y ninguna herramienta
// lo avisó: Metro empaqueta sin quejarse, porque `<Logo />` es JavaScript
// perfectamente válido. Revienta en el teléfono, al abrir la pantalla, y en
// una app de siete pantallas eso puede tardar días en aparecer.
//
// Se revisan las dos formas en que pasa: componentes en JSX y hooks.

const RAIZ = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function archivos(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return ruta.endsWith('.js') ? [ruta] : [];
  });
}

// Todo lo que el archivo trae de fuera o define dentro.
function declarados(codigo) {
  const nombres = new Set();

  // import X, { a, b as c } from '...'
  for (const m of codigo.matchAll(/import\s+([^'"]+?)\s+from\s+['"][^'"]+['"]/g)) {
    const trozo = m[1];

    const porDefecto = trozo.match(/^\s*([A-Za-z_$][\w$]*)/);
    if (porDefecto) nombres.add(porDefecto[1]);

    const llaves = trozo.match(/\{([^}]*)\}/);
    if (llaves) {
      for (const parte of llaves[1].split(',')) {
        const alias = parte.split(/\s+as\s+/);
        const nombre = (alias[1] ?? alias[0]).trim();
        if (nombre) nombres.add(nombre);
      }
    }

    const todo = trozo.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (todo) nombres.add(todo[1]);
  }

  for (const m of codigo.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) nombres.add(m[1]);
  for (const m of codigo.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) nombres.add(m[1]);
  for (const m of codigo.matchAll(/class\s+([A-Za-z_$][\w$]*)/g)) nombres.add(m[1]);

  // const { a, b } = algo
  for (const m of codigo.matchAll(/(?:const|let)\s*\{([^}]*)\}\s*=/g)) {
    for (const parte of m[1].split(',')) {
      const alias = parte.split(':');
      const nombre = (alias[1] ?? alias[0]).replace(/=.*$/, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nombre)) nombres.add(nombre);
    }
  }

  // Parámetros desestructurados de una función: ({ a, b }) => ...
  for (const m of codigo.matchAll(/\(\s*\{([^}]*)\}\s*\)\s*=>/g)) {
    for (const parte of m[1].split(',')) {
      const alias = parte.split(':');
      const nombre = (alias[1] ?? alias[0]).replace(/=.*$/, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nombre)) nombres.add(nombre);
    }
  }

  return nombres;
}

const SIN_CODIGO = (codigo) =>
  codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // comentarios de bloque, incluidos los de JSX
    .replace(/\/\/.*$/gm, ' ');

const FUENTES = archivos(RAIZ);

test('hay archivos que revisar', () => {
  assert.ok(FUENTES.length > 20, `solo encontré ${FUENTES.length} archivos en src`);
});

test('todo componente usado en JSX está importado', () => {
  const faltantes = [];

  for (const ruta of FUENTES) {
    const codigo = SIN_CODIGO(readFileSync(ruta, 'utf8'));
    const tengo = declarados(codigo);

    for (const m of codigo.matchAll(/<([A-Z][\w$]*)/g)) {
      const nombre = m[1];
      if (!tengo.has(nombre)) faltantes.push(`${ruta.split('src')[1]}: <${nombre}>`);
    }
  }

  assert.deepEqual([...new Set(faltantes)], [], 'componentes usados sin importar');
});

test('todo hook usado está importado o definido ahí mismo', () => {
  const faltantes = [];

  for (const ruta of FUENTES) {
    const codigo = SIN_CODIGO(readFileSync(ruta, 'utf8'));
    const tengo = declarados(codigo);

    for (const m of codigo.matchAll(/\b(use[A-Z][\w$]*)\s*\(/g)) {
      const nombre = m[1];
      if (!tengo.has(nombre)) faltantes.push(`${ruta.split('src')[1]}: ${nombre}()`);
    }
  }

  assert.deepEqual([...new Set(faltantes)], [], 'hooks usados sin importar');
});
