import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEstilos } from '../state/TemaContext';

const crear = ({ C, S }) => ({
  pantalla: {
    flex: 1,
    backgroundColor: C.crema,
  },
  contenido: {
    paddingHorizontal: S.xl,
    paddingBottom: S.xxl,
    gap: S.lg,
  },
});

// Contenedor común de todas las pantallas: fondo del tema, aire arriba y abajo,
// respeto por el notch y por la barra de pestañas.
export default function Pantalla({ children, contentStyle }) {
  const insets = useSafeAreaInsets();
  const est = useEstilos(crear);

  return (
    <View style={est.pantalla}>
      <ScrollView
        contentContainerStyle={[est.contenido, { paddingTop: insets.top + 24 }, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}
