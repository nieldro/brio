import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { C, S, R, T } from '../theme';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Chispa from '../components/Chispa';
import { useUsuario } from '../state/UsuarioContext';
import { fechasDeLaSemana } from '../services/fecha';

// El mensaje del coach sale del avance real. Nunca reprocha lo que falta.
function mensajeCoach(hechos, nombre) {
  const quien = nombre ? `, ${nombre}` : '';
  if (hechos === 0) return `La semana está abierta${quien}. Un día basta para arrancar.`;
  if (hechos <= 2) return `Ya llevas ${hechos}${quien}. Eso es más que cero, y cuenta.`;
  if (hechos <= 5) return `${hechos} días esta semana${quien}. Vas bien.`;
  return `Semana casi completa${quien}. Esto ya es tuyo.`;
}

export default function Progreso() {
  const { perfil, mejorRacha, diasCompletados } = useUsuario();

  const { hechos, cumplimiento } = useMemo(() => {
    const semana = Object.values(fechasDeLaSemana(new Date()));
    const marcados = new Set(diasCompletados);
    const n = semana.filter((f) => marcados.has(f)).length;
    return { hechos: n, cumplimiento: Math.round((n / 7) * 100) };
  }, [diasCompletados]);

  return (
    <Pantalla>
      <View style={styles.encabezado}>
        <Etiqueta>tu progreso</Etiqueta>
        <Text style={T.titulo}>Lo que ya llevas</Text>
      </View>

      <Tarjeta>
        <Etiqueta>esta semana</Etiqueta>
        <Text style={styles.cifra}>{cumplimiento}%</Text>
        <View style={styles.riel}>
          <View style={[styles.relleno, { width: `${Math.min(cumplimiento, 100)}%` }]} />
        </View>
        <Text style={styles.pie}>{hechos} de 7 días marcados</Text>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>tu mejor racha</Etiqueta>
        <View style={styles.filaRacha}>
          <Chispa size={26} />
          <Text style={styles.cifraRacha}>
            {mejorRacha} {mejorRacha === 1 ? 'día' : 'días'}
          </Text>
        </View>
        <Text style={T.secundario}>
          {mejorRacha === 0
            ? 'Tu primera racha empieza cuando tú quieras.'
            : 'Ya lo lograste una vez. Se puede otra.'}
        </Text>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>brío te dice</Etiqueta>
        <Text style={styles.mensajeCoach}>{mensajeCoach(hechos, perfil.nombre)}</Text>
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
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
    height: 10,
    borderRadius: R.pildora,
    backgroundColor: C.crema,
    overflow: 'hidden',
    marginTop: S.md,
  },
  relleno: {
    height: '100%',
    borderRadius: R.pildora,
    backgroundColor: C.salvia,
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
