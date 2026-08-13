// theme.js — fuente única de estilo de Brío.
// Regla: ningún color, radio ni espaciado se escribe a mano fuera de este archivo.

export const C = {
  crema: '#FFF6EC', // fondos
  coral: '#E2725B', // botones y acción
  cafe: '#3A2E2A', // textos
  gris: '#8A7A6E', // textos secundarios
  blanco: '#FFFFFF', // tarjetas
  borde: '#E8D9C8', // bordes
  salvia: '#7FA98E', // éxito y verde semáforo
  ambar: '#E8A94C', // ámbar semáforo
  rojo: '#D96C5F', // rojo semáforo (informa, nunca castiga)
  apagado: '#B4A79B', // pestañas inactivas
};

// Semáforo de alimentación. Suma, nunca resta.
export const SEMAFORO = {
  verde: C.salvia,
  ambar: C.ambar,
  rojo: C.rojo,
};

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

// Fase 1 usa la fuente del sistema. En fase 2 entran Nunito e Inter con expo-font
// y solo cambia el valor de `familia` aquí.
export const F = {
  titulo: { familia: undefined, peso: '700' },
  texto: { familia: undefined, peso: '400' },
};

export const T = {
  saludo: { fontSize: 30, fontWeight: '700', color: C.cafe, lineHeight: 38 },
  titulo: { fontSize: 22, fontWeight: '700', color: C.cafe, lineHeight: 30 },
  subtitulo: { fontSize: 17, fontWeight: '600', color: C.cafe, lineHeight: 24 },
  cuerpo: { fontSize: 16, fontWeight: '400', color: C.cafe, lineHeight: 24 },
  secundario: { fontSize: 15, fontWeight: '400', color: C.gris, lineHeight: 22 },
  etiqueta: {
    fontSize: 12,
    fontWeight: '700',
    color: C.coral,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  boton: { fontSize: 17, fontWeight: '700', color: C.blanco },
};

// Sombra suave y única de la app. Nada de elevaciones dramáticas.
export const SOMBRA = {
  shadowColor: '#3A2E2A',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export default { C, SEMAFORO, S, R, F, T, SOMBRA };
