import { useRef } from 'react';
import { Pressable, Text, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos, useTema } from '../state/TemaContext';
import { DEGRADADOS } from '../theme';

const crear = ({ C, R, S }) => ({
  envoltura: {
    borderRadius: R.medio,
    overflow: 'hidden',
  },
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
    backgroundColor: C.blanco,
  },
});

// Variantes: 'coral' (acción), 'salvia' (ya hecho), 'suave' (secundaria).
//
// Las dos primeras llevan el degradado de la marca. El texto va en blanco y
// los degradados se eligieron con el tramo claro arriba a la izquierda, donde
// la letra no llega: sobre el ámbar puro el blanco no se leería.
//
// El botón se hunde un poco al tocarlo. No es adorno: sin respuesta física,
// en un teléfono lento la persona toca dos veces y marca el día por partida
// doble.
export default function Boton({ children, onPress, variante = 'coral', disabled, style }) {
  const est = useEstilos(crear);
  const { C, T } = useTema();
  const escala = useRef(new Animated.Value(1)).current;

  const animar = (hacia) =>
    Animated.spring(escala, {
      toValue: hacia,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();

  const colores = variante === 'salvia' ? DEGRADADOS.logrado : DEGRADADOS.llama;
  const esSuave = variante === 'suave';

  const contenido = (
    <Text style={[T.boton, { color: esSuave ? C.cafe : '#FFFFFF' }]}>{children}</Text>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: escala }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animar(0.97)}
        onPressOut={() => animar(1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        style={est.envoltura}
      >
        {esSuave ? (
          <View style={[est.boton, est.suave]}>{contenido}</View>
        ) : (
          <LinearGradient
            colors={colores}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={est.boton}
          >
            {contenido}
          </LinearGradient>
        )}
      </Pressable>
    </Animated.View>
  );
}
