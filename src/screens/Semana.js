import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos, useTema } from '../state/TemaContext';
import { DEGRADADOS } from '../theme';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Aparece from '../components/Aparece';
import { useUsuario } from '../state/UsuarioContext';
import { planDemo } from '../data/planDemo';
import { nombreDia, fechasDeLaSemana } from '../services/fecha';
import { resumenReto } from '../services/plan';

// El tipo del día es texto de 12px: usa el coral de texto, no el de marca.
const tiposDe = (C) => ({
  entrenamiento: { texto: 'entrenamiento', color: C.coralTexto, veta: C.coral },
  suave: { texto: 'suave', color: C.salviaTexto, veta: C.salvia },
  descanso: { texto: 'descanso', color: C.gris, veta: C.borde },
});

const crear = ({ C, T, R, S }) => ({
  encabezado: {
    gap: S.sm,
    marginBottom: S.sm,
  },
  tira: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: S.lg,
  },
  ficha: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.borde,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fichaHoy: {
    borderColor: C.coral,
  },
  fichaHecha: {
    borderColor: 'transparent',
  },
  relleno: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  inicial: {
    fontSize: 14,
    fontWeight: '800',
    color: C.gris,
    textTransform: 'uppercase',
  },
  inicialHoy: {
    color: C.coralTexto,
  },
  inicialHecha: {
    color: '#FFFFFF',
  },
  cuenta: {
    ...T.secundario,
    marginTop: S.md,
  },
  dia: {
    paddingVertical: S.lg,
    paddingLeft: S.xl + 6,
    overflow: 'hidden',
  },
  veta: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  diaHoy: {
    borderColor: C.coral,
    borderWidth: 2,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nombreDia: {
    ...T.secundario,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  nombreDiaHoy: {
    color: C.coralTexto,
  },
  tipo: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  chulo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chuloTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  reto: {
    ...T.subtitulo,
    marginTop: S.sm,
  },
  mensaje: {
    ...T.secundario,
    marginTop: S.sm,
  },
  pie: {
    ...T.secundario,
    fontSize: 13,
    color: C.coralTexto,
    fontWeight: '700',
    marginTop: S.md,
  },
  enlaceMovimientos: {
    alignSelf: 'flex-start',
    paddingVertical: S.xs,
  },
  presionado: {
    opacity: 0.75,
  },
});

export default function Semana({ navigation }) {
  const est = useEstilos(crear);
  const { C, T } = useTema();
  const { perfil, plan: planUsuario, diasCompletados, hoy: fechaHoy } = useUsuario();

  // La fecha viene del contexto y no de un `new Date()` propio.
  //
  // Con `useMemo(..., [])` quedaba congelada en el momento de montar, y esta
  // pantalla es una pestaña: no se desmonta mientras la app viva. Quien cruzaba
  // la medianoche con la app abierta marcaba su día en Hoy y aquí seguía
  // resaltado el día anterior, sin chulos y con el contador de la semana
  // pasada. Parecía que se había borrado el avance.
  const hoy = useMemo(() => nombreDia(fechaHoy), [fechaHoy]);
  const fechas = useMemo(() => fechasDeLaSemana(fechaHoy), [fechaHoy]);

  const TIPO = useMemo(() => tiposDe(C), [C]);

  // Mientras la IA no haya entregado un plan, se muestra el de arranque.
  const plan = planUsuario ?? planDemo;

  // Un día queda marcado por su FECHA real, no por su nombre: así el chulo
  // del lunes pasado no se queda pegado el lunes siguiente.
  const hechos = useMemo(() => new Set(diasCompletados), [diasCompletados]);
  const cuantosHechos = plan.dias.filter((d) => hechos.has(fechas[d.dia])).length;

  return (
    <Pantalla>
      <Aparece orden={0}>
        <View style={est.encabezado}>
          <Etiqueta>semana {plan.semana}</Etiqueta>
          <Text style={T.titulo}>{plan.mensaje_semana}</Text>

          {/* La semana entera de un vistazo. Es lo primero que alguien quiere
              ver al entrar aquí, y antes había que bajar por siete tarjetas
              para reconstruirlo de memoria. */}
          <View style={est.tira}>
            {plan.dias.map((dia) => {
              const esHoy = dia.dia === hoy;
              const hecho = hechos.has(fechas[dia.dia]);

              return (
                <View
                  key={dia.dia}
                  style={[est.ficha, esHoy && est.fichaHoy, hecho && est.fichaHecha]}
                  accessibilityLabel={`${dia.dia}, ${hecho ? 'hecho' : 'pendiente'}`}
                >
                  {hecho && (
                    <LinearGradient
                      colors={DEGRADADOS.logrado}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={est.relleno}
                    />
                  )}
                  <Text
                    style={[
                      est.inicial,
                      esHoy && est.inicialHoy,
                      hecho && est.inicialHecha,
                    ]}
                  >
                    {dia.dia.charAt(0)}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={est.cuenta}>
            {cuantosHechos === 0
              ? 'La semana está abierta.'
              : `${cuantosHechos} de 7 días marcados.`}
          </Text>

          {/* No hay que esperar a que el plan te ponga un movimiento para
              poder mirarlo. */}
          <Pressable
            onPress={() => navigation.navigate('Movimientos')}
            accessibilityRole="button"
            style={est.enlaceMovimientos}
          >
            <Text style={est.pie}>Ver todos los movimientos →</Text>
          </Pressable>
        </View>
      </Aparece>

      {plan.dias.map((dia, i) => {
        const esHoy = dia.dia === hoy;
        const hecho = hechos.has(fechas[dia.dia]);
        const tipo = TIPO[dia.tipo] ?? TIPO.suave;
        const tieneRutina = (dia.ejercicios?.length ?? 0) > 0;

        return (
          <Aparece key={dia.dia} orden={i + 1}>
            <Pressable
              onPress={
                tieneRutina
                  ? () =>
                      navigation.navigate('Rutina', {
                        dia,
                        lugar: perfil.lugar,
                        // Mirar la rutina del viernes desde el martes no puede
                        // marcar el martes.
                        esDeHoy: esHoy,
                      })
                  : undefined
              }
              accessibilityRole={tieneRutina ? 'button' : undefined}
              style={({ pressed }) => pressed && tieneRutina && est.presionado}
            >
              <Tarjeta style={[est.dia, esHoy && est.diaHoy]}>
                <View style={[est.veta, { backgroundColor: tipo.veta }]} />

                <View style={est.fila}>
                  <Text style={[est.nombreDia, esHoy && est.nombreDiaHoy]}>{dia.dia}</Text>
                  {hecho ? (
                    <View style={est.chulo}>
                      <LinearGradient
                        colors={DEGRADADOS.logrado}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={est.relleno}
                      />
                      <Text style={est.chuloTexto}>✓</Text>
                    </View>
                  ) : (
                    <Text style={[est.tipo, { color: tipo.color }]}>{tipo.texto}</Text>
                  )}
                </View>

                <Text style={est.reto}>{dia.reto}</Text>
                {dia.duracion_min > 0 && (
                  <Text style={T.secundario}>{resumenReto(dia, perfil.lugar)}</Text>
                )}
                <Text style={est.mensaje}>{dia.mensaje}</Text>

                {tieneRutina && (
                  <Text style={est.pie}>
                    ver los {dia.ejercicios.length} ejercicios
                  </Text>
                )}
              </Tarjeta>
            </Pressable>
          </Aparece>
        );
      })}
    </Pantalla>
  );
}
