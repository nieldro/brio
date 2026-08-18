import { useMemo } from 'react';
import { View, Text } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import { useUsuario } from '../state/UsuarioContext';
import { planDemo } from '../data/planDemo';
import { nombreDia, fechasDeLaSemana } from '../services/fecha';
import { resumenReto } from '../services/plan';

// El tipo del día es texto de 12px: usa el coral de texto, no el de marca.
const tiposDe = (C) => ({
  entrenamiento: { texto: 'entrenamiento', color: C.coralTexto },
  suave: { texto: 'suave', color: C.salvia },
  descanso: { texto: 'descanso', color: C.gris },
});

const crear = ({ C, T, S, RELLENO }) => ({
  encabezado: {
    gap: S.sm,
    marginBottom: S.sm,
  },
  dia: {
    paddingVertical: S.lg,
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
    backgroundColor: RELLENO.salvia,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chuloTexto: {
    // Va encima del relleno salvia, no de la superficie del tema.
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
});

export default function Semana() {
  const hoy = useMemo(() => nombreDia(new Date()), []);
  const fechas = useMemo(() => fechasDeLaSemana(new Date()), []);

  const est = useEstilos(crear);
  const { C, T } = useTema();
  const { perfil, plan: planUsuario, diasCompletados } = useUsuario();

  const TIPO = useMemo(() => tiposDe(C), [C]);

  // Mientras la IA no haya entregado un plan, se muestra el de arranque.
  const plan = planUsuario ?? planDemo;

  // Un día queda marcado por su FECHA real, no por su nombre: así el chulo
  // del lunes pasado no se queda pegado el lunes siguiente.
  const hechos = useMemo(() => new Set(diasCompletados), [diasCompletados]);

  return (
    <Pantalla>
      <View style={est.encabezado}>
        <Etiqueta>semana {plan.semana}</Etiqueta>
        <Text style={T.titulo}>{plan.mensaje_semana}</Text>
      </View>

      {plan.dias.map((dia) => {
        const esHoy = dia.dia === hoy;
        const hecho = hechos.has(fechas[dia.dia]);
        const tipo = TIPO[dia.tipo] ?? TIPO.suave;

        return (
          <Tarjeta key={dia.dia} style={[est.dia, esHoy && est.diaHoy]}>
            <View style={est.fila}>
              <Text style={[est.nombreDia, esHoy && est.nombreDiaHoy]}>{dia.dia}</Text>
              {hecho ? (
                <View style={est.chulo}>
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
          </Tarjeta>
        );
      })}
    </Pantalla>
  );
}
