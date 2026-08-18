// theme.js — fuente única de estilo de Brío. Datos puros, sin React.
// Regla: ningún color, radio ni espaciado se escribe a mano fuera de este archivo.
//
// Hay dos paletas con las MISMAS claves. Los componentes piden colores por
// nombre semántico (`C.crema` es "el fondo", no "el color crema"), así que
// cambiar de tema no obliga a cambiar ni una línea de las pantallas.

export const PALETAS = {
  claro: {
    crema: '#FFF6EC', // fondos
    coral: '#E2725B', // botones, chispa y acción: la marca, intacta
    coralTexto: '#B34A35', // coral para TEXTO pequeño: el de marca daba 2,89:1
    cafe: '#3A2E2A', // textos
    gris: '#7A6A5E', // textos secundarios: #8A7A6E daba 3,86:1 sobre crema
    blanco: '#FFFFFF', // tarjetas
    borde: '#E8D9C8', // bordes
    salvia: '#7FA98E', // éxito y verde semáforo
    ambar: '#E8A94C', // ámbar semáforo
    rojo: '#D96C5F', // rojo semáforo (informa, nunca castiga)
    apagado: '#B4A79B', // pestañas inactivas
    coralSuave: '#FDF0EC', // fondo de opción elegida
  },

  // Oscuro cálido, no gris azulado: Brío no se vuelve otra app de noche.
  // Cero negro puro, como manda el documento. El más oscuro es #1F1917,
  // un café casi negro que conserva la temperatura de la marca.
  oscuro: {
    crema: '#1F1917', // fondos
    coral: '#E2725B', // se mantiene: 5,6:1 sobre el fondo, sigue siendo la marca
    coralTexto: '#E2725B', // en oscuro el coral de marca ya se lee, no hace falta variante
    cafe: '#F5EAE0', // textos (blanco cálido, 12,9:1 sobre tarjeta)
    gris: '#B3A49A', // textos secundarios (6,3:1)
    blanco: '#2B2320', // tarjetas: un paso por encima del fondo
    borde: '#3D332E', // bordes
    salvia: '#8FBA9D', // aclarado para que se lea sobre oscuro
    ambar: '#EFB964',
    rojo: '#E58274',
    apagado: '#9C8C81', // pestañas inactivas (4,7:1, se lee de verdad)
    coralSuave: '#3A2724', // fondo de opción elegida
  },
};

// Relleno de botones cuando llevan texto blanco encima.
// Separado del semáforo a propósito: un punto de color no necesita el mismo
// contraste que un botón con texto dentro.
export const RELLENOS = {
  claro: { coral: '#E2725B', salvia: '#6F9A7E' },
  oscuro: { coral: '#E2725B', salvia: '#5E8A6E' },
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
