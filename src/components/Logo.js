import Svg, { Defs, LinearGradient, Stop, Path, Circle, G } from 'react-native-svg';

// El isotipo de Brío, dibujado como vector.
//
// Es el logo de la identidad: las dos hojas que sostienen, la llama, la
// persona con los brazos arriba, el rastro de circuito y la chispa. Cada
// pieza significa algo y por eso ninguna sobra:
//   hojas      acompañamiento, lo que te sostiene
//   llama      el brío, la energía
//   persona    tú, no un cuerpo de catálogo
//   circuito   la IA que guía
//   chispa     que siempre se puede volver a empezar
//
// Va en vector y no en imagen a propósito: se ve nítido a 24 px en una
// píldora y a 200 px en la bienvenida, con el mismo archivo y sin pesar.
//
// Los degradados viven AQUÍ y solo aquí. La regla de cero neón es para las
// pantallas de texto; el logo es una forma, no una superficie de lectura.
export default function Logo({ size = 96, style }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" style={style}>
      <Defs>
        <LinearGradient id="brioAbrazo" x1="0" y1="0.1" x2="0.9" y2="1">
          <Stop offset="0" stopColor="#43CBA3" />
          <Stop offset="0.45" stopColor="#3FA8D8" />
          <Stop offset="1" stopColor="#3D5BE0" />
        </LinearGradient>
        <LinearGradient id="brioLlama" x1="0.25" y1="0" x2="0.75" y2="1">
          <Stop offset="0" stopColor="#FBB03B" />
          <Stop offset="0.5" stopColor="#F7802F" />
          <Stop offset="1" stopColor="#F2604C" />
        </LinearGradient>
        <LinearGradient id="brioFigura" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFC85C" />
          <Stop offset="1" stopColor="#F79030" />
        </LinearGradient>
        <LinearGradient id="brioChispa" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD980" />
          <Stop offset="1" stopColor="#F5A623" />
        </LinearGradient>
      </Defs>

      {/* Las dos hojas que sostienen, y se juntan abajo */}
      <Path d="M 56 46 C 16 88, 22 148, 100 186 C 48 140, 44 92, 74 54 Z" fill="url(#brioAbrazo)" />
      <Path
        d="M 144 46 C 184 88, 178 148, 100 186 C 152 140, 156 92, 126 54 Z"
        fill="url(#brioAbrazo)"
        opacity={0.9}
      />

      {/* La llama */}
      <Path
        d="M 100 12 C 119 44, 133 66, 129 96 C 125 122, 111 140, 97 138 C 78 136, 68 117, 73 96 C 78 77, 93 65, 95 43 C 96 30, 98 19, 100 12 Z"
        fill="url(#brioLlama)"
      />

      {/* La persona, con los brazos naciendo del hombro */}
      <Path
        d="M 91 97 C 82 85, 76 71, 77 58"
        stroke="url(#brioFigura)"
        strokeWidth={8.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 108 97 C 117 85, 123 71, 122 58"
        stroke="url(#brioFigura)"
        strokeWidth={8.5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={99.5} cy={75} r={11} fill="url(#brioFigura)" />
      <Path
        d="M 99.5 90 C 92 90, 88 96, 88 106 C 88 120, 93 134, 99.5 143 C 106 134, 111 120, 111 106 C 111 96, 107 90, 99.5 90 Z"
        fill="url(#brioFigura)"
      />

      {/* El circuito */}
      <G stroke="#3D5BE0" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M 132 132 L 150 114 L 150 98" />
        <Path d="M 150 114 L 166 114" />
      </G>
      <Circle cx={150} cy={94} r={4.5} fill="#3D5BE0" />
      <Circle cx={170} cy={114} r={4.5} fill="#3D5BE0" />

      {/* La chispa */}
      <Path
        d="M 45 20 C 48 35, 51 38, 66 41 C 51 44, 48 47, 45 62 C 42 47, 39 44, 24 41 C 39 38, 42 35, 45 20 Z"
        fill="url(#brioChispa)"
      />
    </Svg>
  );
}
