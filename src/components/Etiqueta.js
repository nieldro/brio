import { Text } from 'react-native';
import { useTema } from '../state/TemaContext';

// Etiqueta coral en versalitas. Ej: "reto de hoy".
export default function Etiqueta({ children, style }) {
  const { T } = useTema();
  return <Text style={[T.etiqueta, style]}>{children}</Text>;
}
