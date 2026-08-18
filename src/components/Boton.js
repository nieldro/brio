import { Pressable, Text } from 'react-native';
import { useEstilos, useTema } from '../state/TemaContext';

const crear = ({ C, R, S }) => ({
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

// Variantes: 'coral' (acción), 'salvia' (ya hecho), 'suave' (secundaria).
// Los rellenos salen de RELLENO, no de la paleta: llevan texto blanco encima
// y necesitan más contraste que un punto de color.
export default function Boton({ children, onPress, variante = 'coral', disabled, style }) {
  const est = useEstilos(crear);
  const { C, T, RELLENO } = useTema();

  const fondo = {
    coral: RELLENO.coral,
    salvia: RELLENO.salvia,
    suave: C.blanco,
  }[variante];

  const colorTexto = variante === 'suave' ? C.cafe : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        est.boton,
        { backgroundColor: fondo },
        variante === 'suave' && est.suave,
        pressed && est.presionado,
        style,
      ]}
    >
      <Text style={[T.boton, { color: colorTexto }]}>{children}</Text>
    </Pressable>
  );
}
