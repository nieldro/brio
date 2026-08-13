import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { C, S, T } from '../theme';
import Chispa from '../components/Chispa';

const DURACION_VISIBLE = 2000;

// Pantalla completa coral. Aparece al completar el reto y se va sola.
// Animated de React Native, sin librerías extra.
export default function Celebracion({ mensaje, onFin }) {
  const fondo = useRef(new Animated.Value(0)).current;
  const chispa = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fondo, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(chispa, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.delay(DURACION_VISIBLE),
      Animated.timing(fondo, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onFin?.();
    });
  }, [fondo, chispa, onFin]);

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.capa, { opacity: fondo }]}
    >
      <Animated.View
        style={{
          transform: [
            { scale: chispa.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
          ],
          opacity: chispa,
        }}
      >
        <Chispa size={72} color={C.blanco} />
      </Animated.View>

      <View style={styles.textos}>
        <Text style={styles.titulo}>{mensaje?.titulo ?? 'Hecho.'}</Text>
        <Text style={styles.sub}>{mensaje?.sub ?? 'Un día más contigo.'}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.coral,
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.xl,
    zIndex: 100,
    elevation: 100,
  },
  textos: {
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.xxl,
  },
  titulo: {
    ...T.saludo,
    color: C.blanco,
    textAlign: 'center',
  },
  sub: {
    ...T.cuerpo,
    color: C.blanco,
    opacity: 0.9,
    textAlign: 'center',
  },
});
