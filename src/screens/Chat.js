import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, S, R, T } from '../theme';
import { useUsuario } from '../state/UsuarioContext';
import { preguntarCoach, hayApi } from '../lib/api';
import { leerMensajes } from '../lib/repositorio';
import { mensajesDemo, CHIPS } from '../data/chatDemo';

// Si el coach no contesta, Brío responde igual. Sin culpa y sin pantalla rota.
const SIN_CONEXION = 'No pude conectarme ahora mismo. Escríbeme en un rato y seguimos.';

let contador = 0;
const nuevoId = (rol) => `${rol}-${(contador += 1)}`;

export default function Chat() {
  const insets = useSafeAreaInsets();
  const scroll = useRef(null);
  const { userId, enNube } = useUsuario();

  const [mensajes, setMensajes] = useState(mensajesDemo);
  const [texto, setTexto] = useState('');
  const [esperando, setEsperando] = useState(false);

  // Historial real cuando hay nube; si no, la conversación de arranque.
  useEffect(() => {
    if (!enNube || !userId) return;
    let vivo = true;
    leerMensajes(userId).then((guardados) => {
      if (vivo && guardados?.length) setMensajes(guardados);
    });
    return () => {
      vivo = false;
    };
  }, [enNube, userId]);

  const enviar = async (contenido, respuestaLocal) => {
    const limpio = contenido.trim();
    if (!limpio || esperando) return;

    setMensajes((prev) => [...prev, { id: nuevoId('u'), rol: 'user', texto: limpio }]);
    setTexto('');
    setEsperando(true);

    let respuesta = null;
    if (hayApi) respuesta = (await preguntarCoach(limpio))?.texto ?? null;

    setMensajes((prev) => [
      ...prev,
      { id: nuevoId('b'), rol: 'brio', texto: respuesta ?? respuestaLocal ?? SIN_CONEXION },
    ]);
    setEsperando(false);
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
        keyboardShouldPersistTaps="handled"
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

        {esperando && (
          <View style={[styles.burbuja, styles.deBrio]}>
            <Text style={styles.escribiendo}>Brío está escribiendo…</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.zonaBaja, { paddingBottom: S.md + insets.bottom / 2 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}
        >
          {CHIPS.map((chip) => (
            <Pressable
              key={chip.texto}
              onPress={() => enviar(chip.texto, chip.respuesta)}
              disabled={esperando}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.chip,
                (pressed || esperando) && styles.chipApagado,
              ]}
            >
              <Text style={styles.chipTexto}>{chip.texto}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.barraEscritura}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Escríbele a Brío"
            placeholderTextColor={C.apagado}
            style={styles.entrada}
            multiline
            maxLength={1000}
            onSubmitEditing={() => enviar(texto)}
          />
          <Pressable
            onPress={() => enviar(texto)}
            disabled={!texto.trim() || esperando}
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            style={({ pressed }) => [
              styles.enviar,
              (!texto.trim() || esperando) && styles.enviarApagado,
              pressed && styles.chipApagado,
            ]}
          >
            <Text style={styles.enviarTexto}>↑</Text>
          </Pressable>
        </View>
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
  escribiendo: {
    ...T.secundario,
    fontStyle: 'italic',
  },
  zonaBaja: {
    borderTopWidth: 1,
    borderTopColor: C.borde,
    backgroundColor: C.crema,
    paddingTop: S.md,
    gap: S.md,
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
  chipApagado: {
    opacity: 0.6,
  },
  chipTexto: {
    ...T.secundario,
    color: C.cafe,
    fontWeight: '600',
  },
  barraEscritura: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: S.sm,
    paddingHorizontal: S.xl,
  },
  entrada: {
    ...T.cuerpo,
    flex: 1,
    backgroundColor: C.blanco,
    borderRadius: R.grande,
    borderWidth: 1,
    borderColor: C.borde,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    maxHeight: 120,
  },
  enviar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarApagado: {
    backgroundColor: C.apagado,
  },
  enviarTexto: {
    color: C.blanco,
    fontSize: 20,
    fontWeight: '700',
  },
});
