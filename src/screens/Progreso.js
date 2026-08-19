import { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos, useTema } from '../state/TemaContext';
import { DEGRADADOS } from '../theme';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Chispa from '../components/Chispa';
import Aparece from '../components/Aparece';
import { useUsuario } from '../state/UsuarioContext';
import { fechasDeLaSemana } from '../services/fecha';
import { contarRegresos, textoRegresos } from '../services/regresos';
import { analizar, loQueNote } from '../services/adaptacion';

// El mensaje del coach sale del avance real. Nunca reprocha lo que falta.
function mensajeCoach(hechos, nombre) {
  const quien = nombre ? `, ${nombre}` : '';
  if (hechos === 0) return `La semana está abierta${quien}. Un día basta para arrancar.`;
  if (hechos <= 2) return `Ya llevas ${hechos}${quien}. Eso es más que cero, y cuenta.`;
  if (hechos <= 5) return `${hechos} días esta semana${quien}. Vas bien.`;
  return `Semana casi completa${quien}. Esto ya es tuyo.`;
}

const crear = ({ C, T, R, S }) => ({
  encabezado: {
    gap: S.sm,
    marginBottom: S.sm,
  },
  cifra: {
    fontSize: 40,
    fontWeight: '700',
    color: C.cafe,
    marginTop: S.sm,
  },
  riel: {
    height: 12,
    borderRadius: R.pildora,
    backgroundColor: C.crema,
    overflow: 'hidden',
    marginTop: S.md,
  },
  relleno: {
    height: '100%',
    borderRadius: R.pildora,
  },
  pie: {
    ...T.secundario,
    marginTop: S.md,
  },
  filaRacha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.md,
    marginBottom: S.sm,
  },
  cifraRacha: {
    fontSize: 28,
    fontWeight: '700',
    color: C.cafe,
  },
  mensajeCoach: {
    ...T.cuerpo,
    marginTop: S.md,
  },
});

export default function Progreso() {
  const est = useEstilos(crear);
  const { T } = useTema();
  const { perfil, mejorRacha, diasCompletados } = useUsuario();

  const regresos = useMemo(() => textoRegresos(contarRegresos(diasCompletados)), [diasCompletados]);

  const observacion = useMemo(
    () => loQueNote(analizar(diasCompletados, new Date()), perfil.nombre),
    [diasCompletados, perfil.nombre],
  );

  const { hechos, cumplimiento } = useMemo(() => {
    const semana = Object.values(fechasDeLaSemana(new Date()));
    const marcados = new Set(diasCompletados);
    const n = semana.filter((f) => marcados.has(f)).length;
    return { hechos: n, cumplimiento: Math.round((n / 7) * 100) };
  }, [diasCompletados]);

  // La barra crece desde cero al entrar. Ver el avance moverse es distinto de
  // leer un número: el número informa, el movimiento se siente como avance.
  const avance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.timing(avance, {
      toValue: Math.min(cumplimiento, 100),
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      // El ancho no se puede animar en el hilo nativo, y aquí no pasa nada:
      // es una sola barra, no una lista.
      useNativeDriver: false,
    });
    animacion.start();
    return () => animacion.stop();
  }, [avance, cumplimiento]);

  return (
    <Pantalla>
      <Aparece orden={0}>
        <View style={est.encabezado}>
          <Etiqueta>tu progreso</Etiqueta>
          <Text style={T.titulo}>Lo que ya llevas</Text>
        </View>
      </Aparece>

      <Aparece orden={1}>
        <Tarjeta>
          <Etiqueta>esta semana</Etiqueta>
          <Text style={est.cifra}>{cumplimiento}%</Text>
          <View style={est.riel}>
            <Animated.View
              style={[
                est.relleno,
                {
                  width: avance.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={DEGRADADOS.abrazo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={est.relleno}
              />
            </Animated.View>
          </View>
          <Text style={est.pie}>{hechos} de 7 días marcados</Text>
        </Tarjeta>
      </Aparece>

      {/* La métrica que ninguna otra app lleva. Va ANTES de la mejor racha
          a propósito: para quien ya abandonó cinco veces, esto es lo que
          necesita ver primero. */}
      <Aparece orden={2}>
        <Tarjeta>
          <Etiqueta>tus regresos</Etiqueta>
          <View style={est.filaRacha}>
            <Chispa size={26} />
            <Text style={est.cifraRacha}>{regresos.cifra}</Text>
          </View>
          <Text style={T.secundario}>{regresos.frase}</Text>
        </Tarjeta>
      </Aparece>

      <Aparece orden={3}>
        <Tarjeta>
          <Etiqueta>tu mejor racha</Etiqueta>
          <View style={est.filaRacha}>
            <Chispa size={26} />
            <Text style={est.cifraRacha}>
              {mejorRacha} {mejorRacha === 1 ? 'día' : 'días'}
            </Text>
          </View>
          <Text style={T.secundario}>
            {mejorRacha === 0
              ? 'Tu primera racha empieza cuando tú quieras.'
              : 'Ya lo lograste una vez. Se puede otra.'}
          </Text>
        </Tarjeta>
      </Aparece>

      {/* Lo que el motor de adaptación encontró en el historial. Solo
          aparece cuando hay un patrón de verdad: si no, Brío se calla en
          vez de inventar uno. */}
      {!!observacion && (
        <Aparece orden={4}>
          <Tarjeta>
            <Etiqueta>lo que noté</Etiqueta>
            <Text style={est.mensajeCoach}>{observacion}</Text>
          </Tarjeta>
        </Aparece>
      )}

      <Aparece orden={5}>
        <Tarjeta>
          <Etiqueta>brío te dice</Etiqueta>
          <Text style={est.mensajeCoach}>{mensajeCoach(hechos, perfil.nombre)}</Text>
        </Tarjeta>
      </Aparece>
    </Pantalla>
  );
}
