import { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, S, R, T } from '../theme';
import { mensajesDemo, CHIPS } from '../data/chatDemo';

export default function Chat() {
  const insets = useSafeAreaInsets();
  const scroll = useRef(null);
  const [mensajes, setMensajes] = useState(mensajesDemo);

  // Fase 2: la respuesta sale de un mapa local. En la fase 5 la trae el coach.
  const responder = (chip) => {
    const base = Date.now();
    setMensajes((prev) => [
      ...prev,
      { id: `u${base}`, rol: 'user', texto: chip.texto },
      { id: `b${base}`, rol: 'brio', texto: chip.respuesta },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scroll}
        contentContainerStyle={[styles.hilo, { paddingTop: insets.top + S.xl }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {mensajes.map((m) => (
          <View
            key={m.id}
            style={[styles.burbuja, m.rol === 'user' ? styles.deUsuario : styles.deBrio]}
          >
            <Text style={m.rol === 'user' ? styles.textoUsuario : styles.textoBrio}>
              {m.texto}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.zonaChips}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CHIPS.map((chip) => (
            <Pressable
              key={chip.texto}
              onPress={() => responder(chip)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.chip, pressed && styles.chipPresionado]}
            >
              <Text style={styles.chipTexto}>{chip.texto}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: C.crema,
  },
  hilo: {
    paddingHorizontal: S.xl,
    paddingBottom: S.lg,
    gap: S.md,
  },
  burbuja: {
    maxWidth: '82%',
    borderRadius: R.grande,
    paddingVertical: S.md,
    paddingHorizontal: S.lg,
  },
  deUsuario: {
    alignSelf: 'flex-end',
    backgroundColor: C.coral,
    borderBottomRightRadius: 6,
  },
  deBrio: {
    alignSelf: 'flex-start',
    backgroundColor: C.blanco,
    borderWidth: 1,
    borderColor: C.borde,
    borderBottomLeftRadius: 6,
  },
  textoUsuario: {
    ...T.cuerpo,
    color: C.blanco,
  },
  textoBrio: {
    ...T.cuerpo,
  },
  zonaChips: {
    borderTopWidth: 1,
    borderTopColor: C.borde,
    backgroundColor: C.crema,
    paddingVertical: S.md,
  },
  chips: {
    paddingHorizontal: S.xl,
    gap: S.sm,
  },
  chip: {
    backgroundColor: C.blanco,
    borderRadius: R.pildora,
    borderWidth: 1,
    borderColor: C.borde,
    paddingVertical: S.sm + 2,
    paddingHorizontal: S.lg,
  },
  chipPresionado: {
    opacity: 0.8,
  },
  chipTexto: {
    ...T.secundario,
    color: C.cafe,
    fontWeight: '600',
  },
});
