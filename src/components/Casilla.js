import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useEstilos, useTema } from '../state/TemaContext';

const crear = ({ C, R }) => ({
  casilla: {
    width: 30,
    height: 30,
    borderRadius: R.chico - 4,
    borderWidth: 2,
    borderColor: C.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcada: {
    borderColor: C.salvia,
    backgroundColor: C.salvia,
  },
});

// La casilla de un ejercicio hecho.
//
// El chulo se dibuja solo, de un trazo. Es medio segundo y hace que marcar un
// ejercicio se sienta como tacharlo en papel, que es exactamente la sensación
// que se busca: ir viendo cómo se vacía la lista.
export default function Casilla({ marcada = false, size = 30 }) {
  const est = useEstilos(crear);
  const { C } = useTema();
  const avance = useRef(new Animated.Value(marcada ? 1 : 0)).current;

  useEffect(() => {
    const animacion = Animated.timing(avance, {
      toValue: marcada ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      // El trazo del SVG no se puede animar en el hilo nativo.
      useNativeDriver: false,
    });
    animacion.start();
    return () => animacion.stop();
  }, [marcada, avance]);

  return (
    <Animated.View
      style={[
        est.casilla,
        { width: size, height: size },
        marcada && est.marcada,
        { transform: [{ scale: avance.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.14, 1] }) }] },
      ]}
    >
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        <AnimatedPath
          d="M 4 12.5 L 9.5 18 L 20 6.5"
          stroke={marcada ? '#FFFFFF' : C.borde}
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={26}
          strokeDashoffset={avance.interpolate({ inputRange: [0, 1], outputRange: [26, 0] })}
        />
      </Svg>
    </Animated.View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
