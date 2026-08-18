import { View, Text, Pressable, ScrollView } from 'react-native';
import { useEstilos } from '../state/TemaContext';

// Selector de hora propio. Cero librerías de fecha.
// Lo usan el paso 9 del onboarding y la pantalla Perfil.

const HORAS = Array.from({ length: 18 }, (_, i) => i + 5); // 5:00 a 22:00
const MINUTOS = ['00', '15', '30', '45'];

const crear = ({ C, T, R, S, RELLENO }) => ({
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
    borderColor: RELLENO.coral,
    backgroundColor: RELLENO.coral,
  },
  chipTexto: {
    ...T.cuerpo,
    fontWeight: '700',
  },
  chipTextoElegido: {
    color: '#FFFFFF',
  },
  elegida: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.sm,
  },
});

export default function SelectorHora({ valor, onChange }) {
  const est = useEstilos(crear);
  const [horaActual = '', minutoActual = ''] = (valor || '').split(':');

  const elegir = (h, m) => onChange(`${String(h).padStart(2, '0')}:${m}`);

  return (
    <View style={est.lista}>
      <Text style={est.etiqueta}>Hora</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={est.fila}>
        {HORAS.map((h) => {
          const texto = String(h).padStart(2, '0');
          const elegida = texto === horaActual;
          return (
            <Pressable
              key={h}
              onPress={() => elegir(h, minutoActual || '00')}
              style={[est.chip, elegida && est.chipElegido]}
            >
              <Text style={[est.chipTexto, elegida && est.chipTextoElegido]}>{texto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={est.etiqueta}>Minutos</Text>
      <View style={est.fila}>
        {MINUTOS.map((m) => {
          const elegido = m === minutoActual;
          return (
            <Pressable
              key={m}
              onPress={() => elegir(horaActual || '07', m)}
              style={[est.chip, elegido && est.chipElegido]}
            >
              <Text style={[est.chipTexto, elegido && est.chipTextoElegido]}>{m}</Text>
            </Pressable>
          );
        })}
      </View>

      {!!valor && <Text style={est.elegida}>Te escribo a las {valor}</Text>}
    </View>
  );
}
