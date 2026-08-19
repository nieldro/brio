import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// Entrada suave: la tarjeta sube un poco y se revela.
//
// Con `orden` las tarjetas de una pantalla entran escalonadas, de arriba
// abajo. Eso hace dos cosas que un fundido plano no hace: guía la mirada por
// donde se lee, y da la sensación de que la app respondió rápido aunque los
// datos hayan tardado.
//
// Corto a propósito. Una animación de entrada que se nota es una animación
// que estorba a partir de la tercera vez que abres la app.
const DURACION = 340;
const ESCALON = 70;
const DESPLAZAMIENTO = 14;

export default function Aparece({ orden = 0, children, style }) {
  const avance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.timing(avance, {
      toValue: 1,
      duration: DURACION,
      delay: orden * ESCALON,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animacion.start();
    return () => animacion.stop();
  }, [avance, orden]);

  return (
    <Animated.View
      style={[
        {
          opacity: avance,
          transform: [
            {
              translateY: avance.interpolate({
                inputRange: [0, 1],
                outputRange: [DESPLAZAMIENTO, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
