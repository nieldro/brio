import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { S } from '../theme';
import Chispa from './Chispa';
import Logo from './Logo';

// Respira mientras Brío prepara algo.
//
// Con `marca` late el isotipo entero, para la pantalla de arranque. Sin ella
// late solo la chispa, que es lo que va dentro de una pantalla que ya tiene
// contenido: el logo completo ahí sería la marca gritando.
export default function Latido({ size = 56, marca = false }) {
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
        {marca ? <Logo size={size} /> : <Chispa size={size} />}
      </Animated.View>
    </View>
  );
}
