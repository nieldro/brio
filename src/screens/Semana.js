import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { C, S, R, T } from '../theme';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import { useUsuario } from '../state/UsuarioContext';
import { planDemo } from '../data/planDemo';
import { nombreDia, fechasDeLaSemana } from '../services/fecha';
import { resumenReto } from '../services/plan';

const TIPO = {
  entrenamiento: { texto: 'entrenamiento', color: C.coral },
  suave: { texto: 'suave', color: C.salvia },
  descanso: { texto: 'descanso', color: C.gris },
};

export default function Semana() {
  const hoy = useMemo(() => nombreDia(new Date()), []);
  const fechas = useMemo(() => fechasDeLaSemana(new Date()), []);
  const { perfil, plan: planUsuario, diasCompletados } = useUsuario();

  // Mientras la IA no haya entregado un plan, se muestra el de arranque.
  const plan = planUsuario ?? planDemo;

  // Un día queda marcado por su FECHA real, no por su nombre: así el chulo
  // del lunes pasado no se queda pegado el lunes siguiente.
  const hechos = useMemo(() => new Set(diasCompletados), [diasCompletados]);

  return (
    <Pantalla>
      <View style={styles.encabezado}>
        <Etiqueta>semana {plan.semana}</Etiqueta>
        <Text style={T.titulo}>{plan.mensaje_semana}</Text>
      </View>

      {plan.dias.map((dia) => {
        const esHoy = dia.dia === hoy;
        const hecho = hechos.has(fechas[dia.dia]);
        const tipo = TIPO[dia.tipo] ?? TIPO.suave;

        return (
          <Tarjeta key={dia.dia} style={[styles.dia, esHoy && styles.diaHoy]}>
            <View style={styles.fila}>
              <Text style={[styles.nombreDia, esHoy && styles.nombreDiaHoy]}>{dia.dia}</Text>
              {hecho ? (
                <View style={styles.chulo}>
                  <Text style={styles.chuloTexto}>✓</Text>
                </View>
              ) : (
                <Text style={[styles.tipo, { color: tipo.color }]}>{tipo.texto}</Text>
              )}
            </View>

            <Text style={styles.reto}>{dia.reto}</Text>
            {dia.duracion_min > 0 && (
              <Text style={T.secundario}>{resumenReto(dia, perfil.lugar)}</Text>
            )}
            <Text style={styles.mensaje}>{dia.mensaje}</Text>
          </Tarjeta>
        );
      })}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
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
    color: C.coral,
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
    backgroundColor: C.salvia,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chuloTexto: {
    color: C.blanco,
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
