import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos } from '../state/TemaContext';
import { DEGRADADOS } from '../theme';

const ANCHO = 52;
const ALTO = 30;
const BOLA = 24;

const crear = ({ C, T, R, S }) => ({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.lg,
    marginTop: S.md,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    ...T.subtitulo,
  },
  sub: {
    ...T.secundario,
  },
  riel: {
    width: ANCHO,
    height: ALTO,
    borderRadius: R.pildora,
    backgroundColor: C.borde,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  relleno: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bola: {
    width: BOLA,
    height: BOLA,
    borderRadius: BOLA / 2,
    backgroundColor: '#FFFFFF',
    marginLeft: 3,
  },
});

// Un interruptor de verdad, con el degradado de la marca cuando está
// encendido. Se usa el propio y no el del sistema porque el del sistema se ve
// distinto en cada teléfono y ninguno se parece a Brío.
//
// El área que se toca es la fila entera, no solo la bolita: acertarle a 30 px
// con el pulgar es más difícil de lo que parece.
export default function Interruptor({ titulo, sub, valor, onCambiar }) {
  const est = useEstilos(crear);
  const avance = useRef(new Animated.Value(valor ? 1 : 0)).current;

  useEffect(() => {
    const animacion = Animated.timing(avance, {
      toValue: valor ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animacion.start();
    return () => animacion.stop();
  }, [valor, avance]);

  return (
    <Pressable
      onPress={() => onCambiar(!valor)}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!valor }}
      accessibilityLabel={titulo}
      style={est.fila}
    >
      <View style={est.textos}>
        <Text style={est.titulo}>{titulo}</Text>
        {!!sub && <Text style={est.sub}>{sub}</Text>}
      </View>

      <View style={est.riel}>
        <Animated.View style={[est.relleno, { opacity: avance }]}>
          <LinearGradient
            colors={DEGRADADOS.llama}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={est.relleno}
          />
        </Animated.View>

        <Animated.View
          style={[
            est.bola,
            {
              transform: [
                {
                  translateX: avance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, ANCHO - BOLA - 6],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}
