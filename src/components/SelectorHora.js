import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { C, S, R, T } from '../theme';

// Selector de hora propio. Cero librerías de fecha.
// Lo usan el paso 9 del onboarding y la pantalla Perfil.

const HORAS = Array.from({ length: 18 }, (_, i) => i + 5); // 5:00 a 22:00
const MINUTOS = ['00', '15', '30', '45'];

export default function SelectorHora({ valor, onChange }) {
  const [horaActual = '', minutoActual = ''] = (valor || '').split(':');

  const elegir = (h, m) => onChange(`${String(h).padStart(2, '0')}:${m}`);

  return (
    <View style={styles.lista}>
      <Text style={styles.etiqueta}>Hora</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fila}
      >
        {HORAS.map((h) => {
          const texto = String(h).padStart(2, '0');
          const elegida = texto === horaActual;
          return (
            <Pressable
              key={h}
              onPress={() => elegir(h, minutoActual || '00')}
              style={[styles.chip, elegida && styles.chipElegido]}
            >
              <Text style={[styles.chipTexto, elegida && styles.chipTextoElegido]}>{texto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.etiqueta}>Minutos</Text>
      <View style={styles.fila}>
        {MINUTOS.map((m) => {
          const elegido = m === minutoActual;
          return (
            <Pressable
              key={m}
              onPress={() => elegir(horaActual || '07', m)}
              style={[styles.chip, elegido && styles.chipElegido]}
            >
              <Text style={[styles.chipTexto, elegido && styles.chipTextoElegido]}>{m}</Text>
            </Pressable>
          );
        })}
      </View>

      {!!valor && <Text style={styles.elegida}>Te escribo a las {valor}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: S.md,
    marginTop: S.lg,
  },
  etiqueta: {
    ...T.etiqueta,
    color: C.gris,
    marginTop: S.sm,
  },
  fila: {
    flexDirection: 'row',
    gap: S.sm,
    paddingVertical: S.xs,
  },
  chip: {
    backgroundColor: C.blanco,
    borderRadius: R.pildora,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingVertical: S.md,
    paddingHorizontal: S.lg,
    minWidth: 58,
    alignItems: 'center',
  },
  chipElegido: {
    borderColor: C.coral,
    backgroundColor: C.coral,
  },
  chipTexto: {
    ...T.cuerpo,
    fontWeight: '700',
  },
  chipTextoElegido: {
    color: C.blanco,
  },
  elegida: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.sm,
  },
});
