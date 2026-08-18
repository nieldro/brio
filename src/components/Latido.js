import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { S } from '../theme';
import Chispa from './Chispa';

// Chispa que respira. Se usa mientras Brío prepara algo.
// El color lo resuelve Chispa desde el tema activo.
export default function Latido({ size = 56 }) {
  const escala = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(escala, {
          toValue: 0.85,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [escala]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: S.xxxl }}>
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Chispa size={size} />
      </Animated.View>
    </View>
  );
}
