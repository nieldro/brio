import { useContext } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderHeightContext } from '@react-navigation/elements';
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
//
// Pero eso vale SOLO donde la pantalla llega hasta arriba del todo: las cuatro
// pestañas. Las que se abren sobre la pila ya traen encabezado, y el encabezado
// se dibuja debajo de la barra de estado y se come el inset él mismo. Ahí la
// visera no protege nada: se queda flotando bajo el encabezado tapando los
// primeros píxeles del contenido. Y como es del color del fondo, no se ve la
// banda, solo se ve el texto cortado por la mitad.
//
// La altura del encabezado distingue los dos casos sin adivinar: la navegación
// la reporta real cuando hay encabezado y 0 cuando no.
export default function Pantalla({ children, contentStyle }) {
  const insets = useSafeAreaInsets();
  const est = useEstilos(crear);

  const alturaEncabezado = useContext(HeaderHeightContext) ?? 0;
  const arriba = alturaEncabezado > 0 ? 0 : insets.top;

  return (
    <View style={est.pantalla}>
      {arriba > 0 && <View pointerEvents="none" style={[est.visera, { height: arriba }]} />}

      <ScrollView
        contentContainerStyle={[est.contenido, { paddingTop: arriba + 24 }, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {children}
      </ScrollView>
    </View>
  );
}
