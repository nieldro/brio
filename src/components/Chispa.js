import { Text } from 'react-native';
import { C } from '../theme';

// La chispa de 4 puntas es el ícono de Brío. Se dibuja con carácter, sin librerías.
export default function Chispa({ size = 14, color = C.coral, style }) {
  return (
    <Text
      style={[
        { fontSize: size, color, lineHeight: size * 1.15, includeFontPadding: false },
        style,
      ]}
    >
      ✦
    </Text>
  );
}
