import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEstilos } from '../../state/TemaContext';
import Boton from '../../components/Boton';

const crear = ({ C, T, R, S }) => ({
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
  encabezado,
  children,
}) {
  const insets = useSafeAreaInsets();
  const est = useEstilos(crear);

  return (
    <KeyboardAvoidingView
      style={est.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[est.barra, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={onAtras}
          disabled={!onAtras}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Atrás"
          style={est.atras}
        >
          <Text style={[est.atrasTexto, !onAtras && est.atrasOculto]}>‹</Text>
        </Pressable>

        <View style={est.puntos}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[est.punto, i <= paso && est.puntoActivo]} />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={est.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Va ANTES del título: en el primer paso ahí entra la marca, y lo
            primero que alguien ve de una app debería ser de quién es. */}
        {encabezado}
        {!!titulo && <Text style={est.titulo}>{titulo}</Text>}
        {!!sub && <Text style={est.sub}>{sub}</Text>}
        {children}
        {!!pie && <Text style={est.pie}>{pie}</Text>}
      </ScrollView>

      {!!boton && (
        <View style={[est.zonaBoton, { paddingBottom: insets.bottom + 16 }]}>
          <Boton onPress={onBoton} disabled={!botonActivo} style={!botonActivo && est.apagado}>
            {boton}
          </Boton>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
