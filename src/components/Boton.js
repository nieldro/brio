import { Pressable, Text, StyleSheet } from 'react-native';
import { C, R, S, T } from '../theme';

// Variantes: 'coral' (acción), 'salvia' (ya hecho), 'suave' (secundaria).
export default function Boton({ children, onPress, variante = 'coral', disabled, style }) {
  const fondo = {
    coral: C.coral,
    salvia: C.salvia,
    suave: C.blanco,
  }[variante];

  const colorTexto = variante === 'suave' ? C.cafe : C.blanco;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: fondo },
        variante === 'suave' && styles.suave,
        pressed && styles.presionado,
        style,
      ]}
    >
      <Text style={[T.boton, { color: colorTexto }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    borderRadius: R.medio,
    paddingVertical: S.lg + 2,
    paddingHorizontal: S.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suave: {
    borderWidth: 1,
    borderColor: C.borde,
  },
  presionado: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
