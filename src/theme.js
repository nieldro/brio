// theme.js — fuente única de estilo de Brío. Datos puros, sin React.
// Regla: ningún color, radio ni espaciado se escribe a mano fuera de este archivo.
//
// Hay dos paletas con las MISMAS claves. Los componentes piden colores por
// nombre semántico (`C.crema` es "el fondo", no "el color crema"), así que
// cambiar de tema no obliga a cambiar ni una línea de las pantallas.

// Paleta tomada del logo de Brío.
//
// Los colores salen de la identidad: el navy del wordmark, el coral de la
// figura, el verde azulado de la hoja, el ámbar de la chispa. Lo que NO se
// hereda del logo son los degradados ni los azules eléctricos: sobre una
// pantalla de texto son ilegibles, y el documento pide cero neón.
//
// Cada color de texto está medido contra su superficie. Los que llevan
// sufijo Texto existen porque el color de marca no alcanzaba el mínimo:
// un color puede ser perfecto para una forma y no servir para una letra.

export const PALETAS = {
  claro: {
    crema: '#F7F6FB', // fondos: el lavanda muy claro del logo
    blanco: '#FFFFFF', // tarjetas
    cafe: '#141B34', // textos: el navy del wordmark (15,8:1)
    gris: '#5A6480', // textos secundarios (5,5:1)
    borde: '#E4E3F0', // bordes
    coral: '#F2604C', // botones, chispa y acción: el coral de la figura
    coralTexto: '#C43B26', // coral para TEXTO pequeño: el de marca daba 2,9:1
    salvia: '#3DBFA0', // éxito y verde semáforo: puntos y rellenos, no texto
    salviaTexto: '#1B7A63', // el verde del logo como texto daba 1,9:1
    ambar: '#F5A623', // ámbar semáforo: el de la chispa
    rojo: '#E8574A', // rojo semáforo (informa, nunca castiga)
    rojoTexto: '#C0392B', // avisos de formulario (5,1:1)
    apagado: '#6B7590', // pestañas inactivas (4,6:1)
    coralSuave: '#FDEDE9', // fondo de opción elegida
  },

  // El azul profundo del logo en su versión oscura. Cero negro puro, como
  // manda el documento: el más oscuro es #131A2E, el mismo del ícono en
  // fondo oscuro de tu identidad.
  oscuro: {
    crema: '#131A2E', // fondos
    blanco: '#1E2740', // tarjetas: un paso por encima del fondo
    cafe: '#EDEFF7', // textos (12,9:1 sobre tarjeta)
    gris: '#A3ACC7', // textos secundarios (6,5:1)
    borde: '#333E5E', // bordes
    coral: '#F2604C', // el mismo de la marca: 4,6:1 sobre tarjeta
    coralTexto: '#F2604C', // en oscuro el coral ya se lee, no hace falta variante
    salvia: '#4ECFAE',
    salviaTexto: '#4ECFAE', // sobre oscuro da 7,6:1
    ambar: '#F7B84B',
    rojo: '#F2796B',
    rojoTexto: '#F2796B', // sobre oscuro da 5,4:1
    apagado: '#8792B5', // pestañas inactivas (4,8:1)
    coralSuave: '#3A2A2E', // fondo de opción elegida
  },
};

// Relleno de botones cuando llevan texto blanco encima.
// Separado del semáforo a propósito: un punto de color no necesita el mismo
// contraste que un botón con texto dentro.
export const RELLENOS = {
  claro: { coral: '#F2604C', salvia: '#2A9D82' },
  oscuro: { coral: '#F2604C', salvia: '#2A9D82' },
};

export function semaforoDe(C) {
  return { verde: C.salvia, ambar: C.ambar, rojo: C.rojo };
}

export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const R = {
  chico: 14,
  medio: 16,
  grande: 18,
  pildora: 999,
};

// Fase 1 usa la fuente del sistema. Cuando entren Nunito e Inter con expo-font
// solo cambia el valor de `familia` aquí.
export const F = {
  titulo: { familia: undefined, peso: '700' },
  texto: { familia: undefined, peso: '400' },
};

export function tipografiaDe(C) {
  return {
    saludo: { fontSize: 30, fontWeight: '700', color: C.cafe, lineHeight: 38 },
    titulo: { fontSize: 22, fontWeight: '700', color: C.cafe, lineHeight: 30 },
    subtitulo: { fontSize: 17, fontWeight: '600', color: C.cafe, lineHeight: 24 },
    cuerpo: { fontSize: 16, fontWeight: '400', color: C.cafe, lineHeight: 24 },
    secundario: { fontSize: 15, fontWeight: '400', color: C.gris, lineHeight: 22 },
    etiqueta: {
      fontSize: 12,
      fontWeight: '700',
      // 12px en negrita NO cuenta como texto grande: necesita 4,5:1.
      color: C.coralTexto,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    boton: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  };
}

// Sombra suave y única de la app. En oscuro las sombras no se ven: la
// separación la hace el borde, así que se apaga en vez de dejar un halo negro.
export function sombraDe(modo) {
  if (modo === 'oscuro') {
    return { shadowColor: 'transparent', shadowOpacity: 0, shadowRadius: 0, elevation: 0 };
  }
  return {
    shadowColor: '#3A2E2A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  };
}

// A propósito NO se exporta un `C` global ni un `T` global.
//
// Existieron durante la migración a modo oscuro y eran una trampa: un archivo
// que los importara se veía siempre en claro, sin fallar ni avisar. Ahora la
// única forma de obtener colores es useTema() o useEstilos(), que leen el tema
// activo. Si alguien vuelve a escribir `import { C } from '../theme'`, revienta
// de una vez en lugar de fallar en silencio solo de noche.

export default { PALETAS, RELLENOS, S, R, F, semaforoDe, tipografiaDe, sombraDe };
