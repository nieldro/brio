import { useEffect, useRef } from 'react';
import { Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos } from '../state/TemaContext';
import { DEGRADADOS } from '../theme';
import Chispa from './Chispa';

const crear = ({ R, S }) => ({
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs + 2,
    borderRadius: R.pildora,
    paddingVertical: S.sm - 1,
    paddingHorizontal: S.md,
  },
  texto: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

// Píldora de racha. Muestra días seguidos, nunca días perdidos.
//
// Late una vez cuando el número sube. Es el único sitio de la app donde algo
// se mueve solo, y es a propósito: sumar un día es lo que se celebra.
export default function PildoraRacha({ dias = 0 }) {
  const est = useEstilos(crear);
  const escala = useRef(new Animated.Value(1)).current;
  const anterior = useRef(dias);

  useEffect(() => {
    if (dias <= anterior.current) {
      anterior.current = dias;
      return;
    }
    anterior.current = dias;

    Animated.sequence([
      Animated.spring(escala, { toValue: 1.18, useNativeDriver: true, speed: 20, bounciness: 12 }),
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
    ]).start();
  }, [dias, escala]);

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <LinearGradient
        colors={DEGRADADOS.llama}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={est.pildora}
      >
        <Chispa size={13} color="#FFFFFF" />
        <Text style={est.texto}>
          {dias} {dias === 1 ? 'día' : 'días'}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}
