import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, S, R, T } from '../../theme';
import Boton from '../../components/Boton';

// Marco común de todos los pasos: una pregunta por pantalla, mucho aire,
// avance visible arriba y la acción siempre abajo, al alcance del pulgar.
export default function Marco({
  titulo,
  sub,
  pie,
  paso,
  total,
  onAtras,
  boton,
  onBoton,
  botonActivo = true,
  children,
}) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.barra, { paddingTop: insets.top + S.md }]}>
        <Pressable
          onPress={onAtras}
          disabled={!onAtras}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Atrás"
          style={styles.atras}
        >
          <Text style={[styles.atrasTexto, !onAtras && styles.atrasOculto]}>‹</Text>
        </Pressable>

        <View style={styles.puntos}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[styles.punto, i <= paso && styles.puntoActivo]} />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!!titulo && <Text style={styles.titulo}>{titulo}</Text>}
        {!!sub && <Text style={styles.sub}>{sub}</Text>}
        {children}
        {!!pie && <Text style={styles.pie}>{pie}</Text>}
      </ScrollView>

      {!!boton && (
        <View style={[styles.zonaBoton, { paddingBottom: insets.bottom + S.lg }]}>
          <Boton onPress={onBoton} disabled={!botonActivo} style={!botonActivo && styles.apagado}>
            {boton}
          </Boton>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: C.crema,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: S.xl,
    paddingBottom: S.md,
  },
  atras: {
    width: 24,
    alignItems: 'flex-start',
  },
  atrasTexto: {
    fontSize: 30,
    lineHeight: 32,
    color: C.gris,
  },
  atrasOculto: {
    opacity: 0,
  },
  puntos: {
    flex: 1,
    flexDirection: 'row',
    gap: S.xs + 2,
    alignItems: 'center',
  },
  punto: {
    flex: 1,
    height: 3,
    borderRadius: R.pildora,
    backgroundColor: C.borde,
  },
  puntoActivo: {
    backgroundColor: C.coral,
  },
  contenido: {
    paddingHorizontal: S.xl,
    paddingTop: S.xxl,
    paddingBottom: S.xl,
    gap: S.md,
  },
  titulo: {
    ...T.saludo,
    fontSize: 32,
    lineHeight: 42,
  },
  sub: {
    ...T.cuerpo,
    color: C.gris,
  },
  pie: {
    ...T.secundario,
    marginTop: S.md,
  },
  zonaBoton: {
    paddingHorizontal: S.xl,
    paddingTop: S.md,
  },
  apagado: {
    opacity: 0.4,
  },
});
