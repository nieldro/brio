import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S } from '../theme';

// Contenedor común de todas las pantallas: fondo crema, aire arriba y abajo,
// respeto por el notch y por la barra de pestañas.
export default function Pantalla({ children, contentStyle }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          { paddingTop: insets.top + S.xl },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
