import { View, Text, StyleSheet } from 'react-native';

import { C, S, R, T } from '../theme';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Chispa from '../components/Chispa';
import { useUsuario } from '../state/UsuarioContext';
import { interpolar } from '../services/texto';
import { planDemo, progresoDemo, completadosDemo } from '../data/planDemo';

export default function Progreso() {
  const { perfil, mejorRacha } = useUsuario();
  const { cumplimiento, mensaje_coach } = progresoDemo;

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
        <Text style={styles.pie}>
          {completadosDemo.length} de {planDemo.dias.length} días marcados
        </Text>
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

      <Tarjeta style={styles.tarjetaCoach}>
        <Etiqueta>brío te dice</Etiqueta>
        <Text style={styles.mensajeCoach}>{interpolar(mensaje_coach, perfil)}</Text>
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
  tarjetaCoach: {
    backgroundColor: C.blanco,
  },
  mensajeCoach: {
    ...T.cuerpo,
    marginTop: S.md,
  },
});
