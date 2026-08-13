import { View, StyleSheet } from 'react-native';
import { C, R, S, SOMBRA } from '../theme';

// Tarjeta blanca base. Toda superficie de contenido de Brío pasa por aquí.
export default function Tarjeta({ children, style }) {
  return <View style={[styles.tarjeta, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: C.blanco,
    borderRadius: R.grande,
    borderWidth: 1,
    borderColor: C.borde,
    padding: S.xl,
    ...SOMBRA,
  },
});
