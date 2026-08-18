import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Red de seguridad para una falla que NO se ve al compilar.
//
// En React Native, `style={est.noExiste}` no lanza: recibe undefined y el
// estilo simplemente no se aplica. El defecto queda invisible hasta que
// alguien mira la pantalla. Con 22 archivos convertidos a mano al tema
// dinámico, esa clase de error es la más probable de todas.
//
// Esta prueba lee cada archivo de UI, saca las claves que define la fábrica
// de estilos y las compara contra las que usa el componente.

const RAIZ = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CARPETAS = ['components', 'screens', 'navigation'];

function archivosJs(dir) {
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivosJs(ruta));
    else if (nombre.endsWith('.js')) salida.push(ruta);
  }
  return salida;
}

// Claves de primer nivel dentro de `const crear = (...) => ({ ... })`.
// La fábrica siempre se escribe con la misma forma en este proyecto, así que
// alcanza con leer las claves indentadas a dos espacios.
function clavesDeLaFabrica(texto) {
  const inicio = texto.search(/const crear\s*=\s*\(/);
  if (inicio === -1) return null;

  const cuerpo = texto.slice(inicio);
  const fin = cuerpo.search(/\n\}\);/);
  const bloque = fin === -1 ? cuerpo : cuerpo.slice(0, fin);

  const claves = new Set();
  for (const m of bloque.matchAll(/^ {2}([A-Za-z_]\w*):\s*\{/gm)) claves.add(m[1]);
  return claves;
}

function clavesUsadas(texto) {
  const usadas = new Set();
  for (const m of texto.matchAll(/\best\.([A-Za-z_]\w*)/g)) usadas.add(m[1]);
  return usadas;
}

const ARCHIVOS = CARPETAS.flatMap((c) => archivosJs(join(RAIZ, c)));

test('hay archivos de UI que revisar', () => {
  assert.ok(ARCHIVOS.length >= 20, `solo se encontraron ${ARCHIVOS.length} archivos`);
});

test('ningún componente usa una clave de estilo que no existe', () => {
  const problemas = [];

  for (const ruta of ARCHIVOS) {
    const texto = readFileSync(ruta, 'utf8');
    const definidas = clavesDeLaFabrica(texto);
    if (!definidas) continue; // el archivo no tiene fábrica de estilos

    for (const usada of clavesUsadas(texto)) {
      if (!definidas.has(usada)) {
        problemas.push(`${ruta.split('src')[1]}: usa est.${usada} y la fábrica no lo define`);
      }
    }
  }

  assert.deepEqual(problemas, [], `\n${problemas.join('\n')}`);
});

test('ninguna fábrica define estilos que nadie usa', () => {
  // Estilo muerto no rompe nada, pero suele ser la huella de un renombre a
  // medias: alguien cambió el nombre en un sitio y no en el otro.
  const sobrantes = [];

  for (const ruta of ARCHIVOS) {
    const texto = readFileSync(ruta, 'utf8');
    const definidas = clavesDeLaFabrica(texto);
    if (!definidas) continue;

    const usadas = clavesUsadas(texto);
    for (const definida of definidas) {
      if (!usadas.has(definida)) {
        sobrantes.push(`${ruta.split('src')[1]}: define ${definida} y nadie lo usa`);
      }
    }
  }

  assert.deepEqual(sobrantes, [], `\n${sobrantes.join('\n')}`);
});

test('la fábrica de estilos vive fuera del componente', () => {
  // Si se declara dentro, cambia de identidad en cada render y el memo de
  // useEstilos deja de servir: se construye un StyleSheet nuevo cada vez.
  const dentro = [];

  for (const ruta of ARCHIVOS) {
    const texto = readFileSync(ruta, 'utf8');
    for (const linea of texto.split('\n')) {
      if (/^\s+const crear\s*=/.test(linea)) {
        dentro.push(`${ruta.split('src')[1]}: la fábrica está indentada, o sea dentro de algo`);
      }
    }
  }

  assert.deepEqual(dentro, [], `\n${dentro.join('\n')}`);
});
