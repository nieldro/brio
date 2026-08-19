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
import { analizar, loQueNote, hallazgos } from '../services/adaptacion';
import {
  totales,
  mapaDeDias,
  textoDeTotales,
  proximoHito,
} from '../services/recorrido';

// El mensaje del coach sale del avance real. Nunca reprocha lo que falta.
function mensajeCoach(hechos, nombre) {
  const quien = nombre ? `, ${nombre}` : '';
  if (hechos === 0) return `La semana está abierta${quien}. Un día basta para arrancar.`;
  if (hechos <= 2) return `Ya llevas ${hechos}${quien}. Eso es más que cero, y cuenta.`;
  if (hechos <= 5) return `${hechos} días esta semana${quien}. Vas bien.`;
  return `Semana casi completa${quien}. Esto ya es tuyo.`;
}

const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const crear = ({ C, T, R, S }) => ({
  encabezado: {
    gap: S.sm,
    marginBottom: S.sm,
  },
  cifraGrande: {
    fontSize: 56,
    fontWeight: '800',
    color: C.cafe,
    lineHeight: 62,
  },
  bajoCifra: {
    ...T.cuerpo,
    color: C.gris,
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
  // --- El mapa ---
  mapa: {
    gap: 5,
    marginTop: S.md,
  },
  semana: {
    flexDirection: 'row',
    gap: 5,
  },
  celda: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 5,
    backgroundColor: C.crema,
    overflow: 'hidden',
  },
  celdaFutura: {
    opacity: 0.35,
  },
  celdaHoy: {
    borderWidth: 2,
    borderColor: C.coral,
  },
  relleno2: {
    width: '100%',
    height: '100%',
  },
  iniciales: {
    flexDirection: 'row',
    gap: 5,
    marginTop: S.sm,
  },
  inicial: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: C.apagado,
  },
  // --- Totales ---
  rejilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.md,
  },
  dato: {
    flexGrow: 1,
    flexBasis: '44%',
    backgroundColor: C.crema,
    borderRadius: R.chico,
    padding: S.md,
  },
  datoCifra: {
    fontSize: 26,
    fontWeight: '800',
    color: C.cafe,
  },
  datoTexto: {
    ...T.secundario,
    fontSize: 13,
  },
  // --- Hallazgos ---
  hallazgo: {
    flexDirection: 'row',
    gap: S.md,
    marginTop: S.md,
  },
  marca: {
    width: 4,
    borderRadius: 2,
  },
  hallazgoTexto: {
    flex: 1,
  },
  hallazgoTitulo: {
    ...T.subtitulo,
    fontSize: 16,
  },
  hallazgoCuerpo: {
    ...T.secundario,
    marginTop: 2,
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
  const { C, T } = useTema();
  const { perfil, mejorRacha, diasCompletados, habitosHechos, diario, hoy } = useUsuario();

  const suma = useMemo(
    () => totales({ diasCompletados, habitosHechos, diario }),
    [diasCompletados, habitosHechos, diario],
  );

  const regresos = useMemo(() => contarRegresos(diasCompletados), [diasCompletados]);
  const mapa = useMemo(() => mapaDeDias(diasCompletados, hoy), [diasCompletados, hoy]);
  const hito = useMemo(() => proximoHito(suma.dias), [suma.dias]);

  const notas = useMemo(
    () => hallazgos(diasCompletados, hoy, { regresos, semanas: suma.semanas }),
    [diasCompletados, hoy, regresos, suma.semanas],
  );

  const observacion = useMemo(
    () => loQueNote(analizar(diasCompletados, hoy), perfil.nombre),
    [diasCompletados, hoy, perfil.nombre],
  );

  const { hechos, cumplimiento } = useMemo(() => {
    const semana = Object.values(fechasDeLaSemana(hoy));
    const marcados = new Set(diasCompletados);
    const n = semana.filter((f) => marcados.has(f)).length;
    return { hechos: n, cumplimiento: Math.round((n / 7) * 100) };
  }, [diasCompletados, hoy]);

  // La barra crece desde cero al entrar. Ver el avance moverse es distinto de
  // leer un número: el número informa, el movimiento se siente como avance.
  const avance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.timing(avance, {
      toValue: Math.min(cumplimiento, 100),
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animacion.start();
    return () => animacion.stop();
  }, [avance, cumplimiento]);

  const colorHallazgo = { bien: C.salvia, aviso: C.ambar, calma: C.gris };

  return (
    <Pantalla>
      {/* Lo primero es lo que llevas, no lo que te falta. */}
      <Aparece orden={0}>
        <View style={est.encabezado}>
          <Etiqueta>tu recorrido</Etiqueta>
          <Text style={est.cifraGrande}>{suma.dias}</Text>
          <Text style={est.bajoCifra}>{textoDeTotales(suma)}</Text>
        </View>
      </Aparece>

      {/* El mapa: ocho semanas de un vistazo. Nada de días perdidos en rojo;
          lo que no se hizo simplemente queda del color del fondo. */}
      <Aparece orden={1}>
        <Tarjeta>
          <Etiqueta>tus últimas ocho semanas</Etiqueta>
          <View style={est.mapa}>
            {mapa.map((semana) => (
              <View key={semana[0].clave} style={est.semana}>
                {semana.map((d) => (
                  <View
                    key={d.clave}
                    style={[est.celda, d.futuro && est.celdaFutura, d.esHoy && est.celdaHoy]}
                  >
                    {d.hecho && (
                      <LinearGradient
                        colors={DEGRADADOS.logrado}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={est.relleno2}
                      />
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={est.iniciales}>
            {INICIALES.map((i, n) => (
              <Text key={`${i}-${n}`} style={est.inicial}>
                {i}
              </Text>
            ))}
          </View>
        </Tarjeta>
      </Aparece>

      {/* Números que solo suben. Ninguno se pone en cero por fallar un día. */}
      <Aparece orden={2}>
        <Tarjeta>
          <Etiqueta>lo que llevas sumado</Etiqueta>
          <View style={[est.rejilla, { marginTop: 12 }]}>
            <View style={est.dato}>
              <Text style={est.datoCifra}>{suma.semanas}</Text>
              <Text style={est.datoTexto}>semanas con movimiento</Text>
            </View>
            <View style={est.dato}>
              <Text style={est.datoCifra}>{regresos}</Text>
              <Text style={est.datoTexto}>veces que volviste</Text>
            </View>
            <View style={est.dato}>
              <Text style={est.datoCifra}>{suma.habitos}</Text>
              <Text style={est.datoTexto}>hábitos cumplidos</Text>
            </View>
            <View style={est.dato}>
              <Text style={est.datoCifra}>{suma.lineas}</Text>
              <Text style={est.datoTexto}>líneas en tu diario</Text>
            </View>
          </View>

          {!!hito && (
            <>
              <View style={est.riel}>
                <View style={[est.relleno, { width: `${hito.fraccion * 100}%` }]}>
                  <LinearGradient
                    colors={DEGRADADOS.llama}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={est.relleno}
                  />
                </View>
              </View>
              <Text style={est.pie}>Camino a los {hito.meta} días.</Text>
            </>
          )}
        </Tarjeta>
      </Aparece>

      {/* Lo que el motor encontró en el historial. Cada uno con su evidencia:
          si no hay evidencia, el hallazgo no aparece. */}
      {notas.length > 0 && (
        <Aparece orden={3}>
          <Tarjeta>
            <Etiqueta>lo que he visto en ti</Etiqueta>
            {notas.map((n) => (
              <View key={n.clave} style={est.hallazgo}>
                <View style={[est.marca, { backgroundColor: colorHallazgo[n.tono] ?? C.borde }]} />
                <View style={est.hallazgoTexto}>
                  <Text style={est.hallazgoTitulo}>{n.titulo}</Text>
                  <Text style={est.hallazgoCuerpo}>{n.texto}</Text>
                </View>
              </View>
            ))}
          </Tarjeta>
        </Aparece>
      )}

      <Aparece orden={4}>
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

      <Aparece orden={5}>
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

      {!!observacion && (
        <Aparece orden={6}>
          <Tarjeta>
            <Etiqueta>lo que noté</Etiqueta>
            <Text style={est.mensajeCoach}>{observacion}</Text>
          </Tarjeta>
        </Aparece>
      )}

      <Aparece orden={7}>
        <Tarjeta>
          <Etiqueta>brío te dice</Etiqueta>
          <Text style={est.mensajeCoach}>{mensajeCoach(hechos, perfil.nombre)}</Text>
        </Tarjeta>
      </Aparece>
    </Pantalla>
  );
}
