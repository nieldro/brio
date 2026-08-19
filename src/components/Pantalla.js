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
  visera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: C.crema,
    zIndex: 2,
  },
});

// Contenedor común de todas las pantallas: fondo del tema, aire arriba y abajo,
// respeto por el notch y por la barra de pestañas.
//
// La visera es una banda opaca del alto de la barra de estado, pegada arriba.
// Android dibuja la app de borde a borde, así que al desplazar, el texto pasaba
// por detrás del reloj y de la batería: se veía como si la pantalla estuviera
// rota. Ahora el contenido desaparece limpio detrás de la banda.
export default function Pantalla({ children, contentStyle }) {
  const insets = useSafeAreaInsets();
  const est = useEstilos(crear);

  return (
    <View style={est.pantalla}>
      <View pointerEvents="none" style={[est.visera, { height: insets.top }]} />

      <ScrollView
        contentContainerStyle={[est.contenido, { paddingTop: insets.top + 24 }, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {children}
      </ScrollView>
    </View>
  );
}
