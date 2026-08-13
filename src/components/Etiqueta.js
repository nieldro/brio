import { Text } from 'react-native';
import { T } from '../theme';

// Etiqueta coral en versalitas. Ej: "reto de hoy".
export default function Etiqueta({ children, style }) {
  return <Text style={[T.etiqueta, style]}>{children}</Text>;
}
