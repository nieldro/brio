// Genera los íconos de Brío. Node puro, sin librerías: el PNG se arma a mano
// con zlib, que ya viene con Node.
//
// El documento dice "la chispa sola es el ícono", así que eso es lo que se
// dibuja: la chispa de 4 puntas en el coral de la marca, sobre el navy del
// logo. Se genera por fórmula y no como imagen fija para que salga nítida en
// cualquier tamaño y para poder regenerarla si cambia la paleta.
//
//   node herramientas/generar-iconos.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(AQUI, '..', 'assets');

// --- Colores, los mismos de src/theme.js ----------------------------------

const NAVY = [0x13, 0x1a, 0x2e];
const CORAL = [0xf2, 0x60, 0x4c];
const AMBAR = [0xf5, 0xa6, 0x23];
const CREMA = [0xf7, 0xf6, 0xfb];

// --- PNG ------------------------------------------------------------------

const TABLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

// pixeles: Uint8Array RGBA de lado*lado*4
function armarPng(lado, pixeles) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filtro adaptativo
  ihdr[12] = 0; // sin entrelazado

  // Cada fila lleva delante su byte de filtro. Se usa 0 (ninguno): el
  // archivo pesa un poco más pero el código queda claro y sin sorpresas.
  const crudo = Buffer.alloc(lado * (lado * 4 + 1));
  for (let y = 0; y < lado; y += 1) {
    const destino = y * (lado * 4 + 1);
    crudo[destino] = 0;
    pixeles.copy
      ? pixeles.copy(crudo, destino + 1, y * lado * 4, (y + 1) * lado * 4)
      : Buffer.from(pixeles.buffer, y * lado * 4, lado * 4).copy(crudo, destino + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

// --- Formas ---------------------------------------------------------------

// La chispa de 4 puntas es una astroide: |x|^p + |y|^p <= r^p con p < 1.
// Cuanto menor la p, más afiladas las puntas. 0,55 da la punta del logo.
function dentroDeChispa(x, y, radio, p = 0.55) {
  const d = Math.abs(x) ** p + Math.abs(y) ** p;
  return d <= radio ** p;
}

function dentroDeCuadradoRedondo(x, y, mitad, esquina) {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax > mitad || ay > mitad) return false;
  const dx = ax - (mitad - esquina);
  const dy = ay - (mitad - esquina);
  if (dx <= 0 || dy <= 0) return true;
  return dx * dx + dy * dy <= esquina * esquina;
}

function mezclar(fondo, frente, alfa) {
  return [
    Math.round(fondo[0] * (1 - alfa) + frente[0] * alfa),
    Math.round(fondo[1] * (1 - alfa) + frente[1] * alfa),
    Math.round(fondo[2] * (1 - alfa) + frente[2] * alfa),
  ];
}

// MUESTRAS x MUESTRAS por píxel: sin esto las puntas de la chispa salen
// dentadas, que es justo donde más se nota en un ícono.
const MUESTRAS = 4;

function dibujar(lado, { conFondo, colorFondo, redondeado }) {
  const px = Buffer.alloc(lado * lado * 4);
  const centro = lado / 2;
  const radioChispa = lado * 0.36;
  const radioDestello = lado * 0.13;
  const centroDestello = { x: lado * 0.245, y: -lado * 0.245 };
  const mitad = lado / 2;
  const esquina = lado * 0.22;

  for (let y = 0; y < lado; y += 1) {
    for (let x = 0; x < lado; x += 1) {
      let cubiertaChispa = 0;
      let cubiertaDestello = 0;
      let cubiertaFondo = 0;

      for (let sy = 0; sy < MUESTRAS; sy += 1) {
        for (let sx = 0; sx < MUESTRAS; sx += 1) {
          const mx = x + (sx + 0.5) / MUESTRAS - centro;
          const my = y + (sy + 0.5) / MUESTRAS - centro;

          if (dentroDeChispa(mx, my, radioChispa)) cubiertaChispa += 1;
          if (
            dentroDeChispa(mx - centroDestello.x, my - centroDestello.y, radioDestello, 0.6)
          ) {
            cubiertaDestello += 1;
          }
          if (!redondeado || dentroDeCuadradoRedondo(mx, my, mitad, esquina)) cubiertaFondo += 1;
        }
      }

      const total = MUESTRAS * MUESTRAS;
      const aChispa = cubiertaChispa / total;
      const aDestello = cubiertaDestello / total;
      const aFondo = cubiertaFondo / total;

      let color = colorFondo;
      let alfa = conFondo ? aFondo : 0;

      if (aChispa > 0) {
        color = conFondo ? mezclar(colorFondo, CORAL, aChispa) : CORAL;
        alfa = Math.max(alfa, aChispa);
      }
      if (aDestello > 0) {
        color = mezclar(color, AMBAR, aDestello);
        alfa = Math.max(alfa, aDestello);
      }

      const i = (y * lado + x) * 4;
      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = Math.round(alfa * 255);
    }
  }

  return px;
}

// --- Salida ---------------------------------------------------------------

mkdirSync(ASSETS, { recursive: true });

const piezas = [
  // Ícono principal: chispa coral sobre el navy del logo.
  { archivo: 'icon.png', lado: 1024, conFondo: true, colorFondo: NAVY, redondeado: false },

  // Android compone el suyo: el frente va transparente y el fondo aparte.
  // Además el sistema recorta los bordes, así que la chispa va más pequeña.
  { archivo: 'android-icon-foreground.png', lado: 1024, conFondo: false, colorFondo: NAVY, redondeado: false, escala: 0.62 },
  { archivo: 'android-icon-background.png', lado: 1024, conFondo: true, colorFondo: NAVY, redondeado: false, soloFondo: true },
  { archivo: 'android-icon-monochrome.png', lado: 1024, conFondo: false, colorFondo: NAVY, redondeado: false, escala: 0.62, mono: true },

  // El splash se ve sobre el fondo claro de la app.
  { archivo: 'splash-icon.png', lado: 512, conFondo: false, colorFondo: CREMA, redondeado: false },

  { archivo: 'favicon.png', lado: 64, conFondo: true, colorFondo: NAVY, redondeado: true },
];

for (const p of piezas) {
  let px;

  if (p.soloFondo) {
    px = Buffer.alloc(p.lado * p.lado * 4);
    for (let i = 0; i < p.lado * p.lado; i += 1) {
      px[i * 4] = p.colorFondo[0];
      px[i * 4 + 1] = p.colorFondo[1];
      px[i * 4 + 2] = p.colorFondo[2];
      px[i * 4 + 3] = 255;
    }
  } else {
    const escala = p.escala ?? 1;
    if (escala === 1) {
      px = dibujar(p.lado, p);
    } else {
      // Se dibuja en un lienzo interior y se centra, para dejar el margen
      // que Android recorta sin deformar la chispa.
      const interior = Math.round(p.lado * escala);
      const dentro = dibujar(interior, p);
      px = Buffer.alloc(p.lado * p.lado * 4);
      const off = Math.round((p.lado - interior) / 2);
      for (let y = 0; y < interior; y += 1) {
        dentro.copy(
          px,
          ((y + off) * p.lado + off) * 4,
          y * interior * 4,
          (y + 1) * interior * 4,
        );
      }
    }

    if (p.mono) {
      // El ícono monocromo lo tiñe el sistema: solo importa la silueta.
      for (let i = 0; i < p.lado * p.lado; i += 1) {
        px[i * 4] = 255;
        px[i * 4 + 1] = 255;
        px[i * 4 + 2] = 255;
      }
    }
  }

  const png = armarPng(p.lado, px);
  writeFileSync(join(ASSETS, p.archivo), png);
  console.log(`${p.archivo.padEnd(30)} ${p.lado}x${p.lado}  ${(png.length / 1024).toFixed(1)} KB`);
}

console.log('\nListo. Los íconos salen de la paleta de src/theme.js.');
