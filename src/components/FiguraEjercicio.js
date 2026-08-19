import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { useTema } from '../state/TemaContext';
import { POSTURAS, POSTURA_POR_DEFECTO } from '../data/posturas';

// Dibuja el movimiento: un monigote que va y viene entre las dos posturas
// del ejercicio. Leer "baja como si te fueras a sentar" no es lo mismo que
// verlo, y mandar a alguien a YouTube lo saca de la app justo cuando estaba
// a punto de empezar.
const DURACIONES = { lento: 2200, normal: 1500, rapido: 950 };

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Un solo reloj para muchas figuras.
//
// En la rutina hay cinco ejercicios a la vista y cada uno se mueve. Si cada
// figura llevara su propio temporizador serían cinco animaciones corriendo a
// la vez y el desplazamiento se sentiría pesado en un teléfono normal. Con un
// reloj compartido hay una sola, y todas respiran al mismo tiempo, que además
// se ve mejor.
export function useRelojDeFiguras(ritmo = 'normal') {
  const avance = useRef(new Animated.Value(0)).current;
  const duracion = DURACIONES[ritmo] ?? DURACIONES.normal;

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(avance, { toValue: 1, duration: duracion, useNativeDriver: false }),
        Animated.timing(avance, { toValue: 0, duration: duracion, useNativeDriver: false }),
      ]),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [avance, duracion]);

  return avance;
}

export default function FiguraEjercicio({ postura, size = 120, ritmo = 'normal', reloj }) {
  const { C } = useTema();
  const propio = useRef(new Animated.Value(0)).current;
  const avance = reloj ?? propio;

  const [a, b] = POSTURAS[postura] ?? POSTURAS[POSTURA_POR_DEFECTO];
  const duracion = DURACIONES[ritmo] ?? DURACIONES.normal;

  useEffect(() => {
    // Con reloj prestado, el ciclo lo lleva quien lo presta.
    if (reloj) return undefined;

    propio.setValue(0);
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(propio, { toValue: 1, duration: duracion, useNativeDriver: false }),
        Animated.timing(propio, { toValue: 0, duration: duracion, useNativeDriver: false }),
      ]),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [propio, duracion, postura, reloj]);

  // Cada número de la postura se convierte en una coordenada que viaja de la
  // primera a la segunda.
  const v = (i) => avance.interpolate({ inputRange: [0, 1], outputRange: [a[i], b[i]] });

  const hueso = {
    stroke: C.coral,
    strokeWidth: 5,
    strokeLinecap: 'round',
  };

  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <AnimatedCircle cx={v(0)} cy={v(1)} r={9} fill={C.coral} />

      {/* tronco */}
      <AnimatedLine x1={v(2)} y1={v(3)} x2={v(4)} y2={v(5)} {...hueso} />

      {/* brazo de este lado */}
      <AnimatedLine x1={v(2)} y1={v(3)} x2={v(6)} y2={v(7)} {...hueso} />
      <AnimatedLine x1={v(6)} y1={v(7)} x2={v(8)} y2={v(9)} {...hueso} />

      {/* brazo del otro */}
      <AnimatedLine x1={v(2)} y1={v(3)} x2={v(10)} y2={v(11)} {...hueso} opacity={0.55} />
      <AnimatedLine x1={v(10)} y1={v(11)} x2={v(12)} y2={v(13)} {...hueso} opacity={0.55} />

      {/* pierna de este lado */}
      <AnimatedLine x1={v(4)} y1={v(5)} x2={v(14)} y2={v(15)} {...hueso} />
      <AnimatedLine x1={v(14)} y1={v(15)} x2={v(16)} y2={v(17)} {...hueso} />

      {/* pierna del otro */}
      <AnimatedLine x1={v(4)} y1={v(5)} x2={v(18)} y2={v(19)} {...hueso} opacity={0.55} />
      <AnimatedLine x1={v(18)} y1={v(19)} x2={v(20)} y2={v(21)} {...hueso} opacity={0.55} />
    </Svg>
  );
}
