import { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos } from '../state/TemaContext';
import { DEGRADADOS } from '../theme';
import Chispa from '../components/Chispa';
import Logo from '../components/Logo';

const DURACION_VISIBLE = 2000;
const CHISPAS = 10;

// La celebración lleva el degradado de la marca en los dos modos: es un
// momento de identidad, no una superficie del tema. El texto va blanco y el
// degradado se orienta para que las letras caigan sobre el tramo azul.
const crear = ({ T, S }) => ({
  capa: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
  },
  fondo: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.xl,
  },
  textos: {
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.xxl,
  },
  titulo: {
    ...T.saludo,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sub: {
    ...T.cuerpo,
    color: '#FFFFFF',
    opacity: 0.92,
    textAlign: 'center',
  },
  chispa: {
    position: 'absolute',
  },
});

// Pantalla completa. Aparece al completar el reto y se va sola.
//
// El isotipo entra dando un giro y de él salen chispas hacia afuera. Es el
// único momento efusivo de Brío, y está bien que lo sea: la app celebra lo
// pequeño de inmediato, y esto es lo pequeño hecho visible.
//
// Todo con Animated de React Native, sin librerías extra.
export default function Celebracion({ mensaje, onFin }) {
  const est = useEstilos(crear);
  const fondo = useRef(new Animated.Value(0)).current;
  const marca = useRef(new Animated.Value(0)).current;
  const estallido = useRef(new Animated.Value(0)).current;

  // Las chispas salen en abanico. El ángulo se calcula una vez: si cambiara
  // en cada render, saltarían de sitio a mitad de la animación.
  const chispas = useMemo(
    () =>
      Array.from({ length: CHISPAS }, (_, i) => {
        const angulo = (i / CHISPAS) * Math.PI * 2;
        return {
          x: Math.cos(angulo),
          y: Math.sin(angulo),
          tam: 12 + (i % 3) * 6,
        };
      }),
    [],
  );

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fondo, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(marca, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(estallido, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
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
  }, [fondo, marca, estallido, onFin]);

  return (
    <Animated.View pointerEvents="auto" style={[est.capa, { opacity: fondo }]}>
      <LinearGradient
        colors={DEGRADADOS.marca}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={est.fondo}
      >
        <View>
          {chispas.map((c, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                est.chispa,
                {
                  opacity: estallido.interpolate({
                    inputRange: [0, 0.25, 1],
                    outputRange: [0, 1, 0],
                  }),
                  transform: [
                    {
                      translateX: estallido.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, c.x * 130],
                      }),
                    },
                    {
                      translateY: estallido.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, c.y * 130],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Chispa size={c.tam} color="#FFFFFF" />
            </Animated.View>
          ))}

          <Animated.View
            style={{
              opacity: marca,
              transform: [
                { scale: marca.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                {
                  rotate: marca.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-25deg', '0deg'],
                  }),
                },
              ],
            }}
          >
            <Logo size={112} />
          </Animated.View>
        </View>

        <View style={est.textos}>
          <Text style={est.titulo}>{mensaje?.titulo ?? 'Hecho.'}</Text>
          <Text style={est.sub}>{mensaje?.sub ?? 'Un día más contigo.'}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
