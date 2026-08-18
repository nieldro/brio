import { Text } from 'react-native';
import { useTema } from '../state/TemaContext';

// La chispa de 4 puntas es el ícono de Brío. Se dibuja con carácter, sin librerías.
// Es una forma, no texto: usa el coral de marca, no la variante para texto chico.
export default function Chispa({ size = 14, color, style }) {
  const { C } = useTema();

  return (
    <Text
      style={[
        {
          fontSize: size,
          color: color ?? C.coral,
          lineHeight: size * 1.15,
          includeFontPadding: false,
        },
        style,
      ]}
    >
      ✦
    </Text>
  );
}
