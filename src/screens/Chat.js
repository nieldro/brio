import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEstilos, useTema } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import { useTeclado } from '../state/useTeclado';
import BotonVoz from '../components/BotonVoz';
import { preguntarCoach, hayApi } from '../lib/api';
import { leerMensajes } from '../lib/repositorio';
import { mensajesDemo, CHIPS } from '../data/chatDemo';

// Si el coach no contesta, Brío responde igual. Sin culpa y sin pantalla rota.
const SIN_CONEXION = 'No pude conectarme ahora mismo. Escríbeme en un rato y seguimos.';

let contador = 0;
const nuevoId = (rol) => `${rol}-${(contador += 1)}`;

const crear = ({ C, T, R, S, RELLENO }) => ({
  pantalla: {
    flex: 1,
    backgroundColor: C.crema,
  },
  visera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: C.crema,
    zIndex: 2,
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
    backgroundColor: RELLENO.coral,
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
    // Va encima del relleno coral, no de una superficie del tema.
    color: '#FFFFFF',
  },
  textoBrio: {
    ...T.cuerpo,
  },
  escribiendo: {
    ...T.secundario,
    fontStyle: 'italic',
  },
  vozBurbuja: {
    marginTop: S.md,
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
    backgroundColor: RELLENO.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarApagado: {
    backgroundColor: C.apagado,
  },
  enviarTexto: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});

export default function Chat() {
  const insets = useSafeAreaInsets();
  const scroll = useRef(null);
  const est = useEstilos(crear);
  const { C, S } = useTema();
  const { userId, enNube } = useUsuario();
  const altoTeclado = useTeclado();

  // Con el teclado abierto, la barra de pestañas se esconde sola (Tabs.js), así
  // que el hueco de abajo pasa a ser el del teclado y no el de los gestos.
  const espacioAbajo = altoTeclado > 0 ? altoTeclado : insets.bottom;

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

  // Al abrirse el teclado, el hilo se va al final: si no, la última respuesta
  // de Brío queda escondida detrás del teclado justo cuando se va a leer.
  useEffect(() => {
    if (altoTeclado > 0) {
      const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [altoTeclado]);

  return (
    <View style={est.pantalla}>
      <View pointerEvents="none" style={[est.visera, { height: insets.top }]} />

      <ScrollView
        ref={scroll}
        contentContainerStyle={[est.hilo, { paddingTop: insets.top + S.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {mensajes.map((m, i) => {
          // Solo la última respuesta de Brío se puede escuchar. Un botón en
          // cada burbuja llenaría el hilo de botones, y lo que alguien quiere
          // oír es lo que le acaban de decir.
          const esUltimaDeBrio = m.rol === 'brio' && i === mensajes.length - 1;

          return (
            <View
              key={m.id}
              style={[est.burbuja, m.rol === 'user' ? est.deUsuario : est.deBrio]}
            >
              <Text style={m.rol === 'user' ? est.textoUsuario : est.textoBrio}>{m.texto}</Text>
              {esUltimaDeBrio && !esperando && (
                <View style={est.vozBurbuja}>
                  <BotonVoz texto={m.texto} etiqueta="Escuchar" />
                </View>
              )}
            </View>
          );
        })}

        {esperando && (
          <View style={[est.burbuja, est.deBrio]}>
            <Text style={est.escribiendo}>Brío está escribiendo…</Text>
          </View>
        )}
      </ScrollView>

      <View style={[est.zonaBaja, { paddingBottom: S.md + espacioAbajo }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={est.chips}
        >
          {CHIPS.map((chip) => (
            <Pressable
              key={chip.texto}
              onPress={() => enviar(chip.texto, chip.respuesta)}
              disabled={esperando}
              accessibilityRole="button"
              style={({ pressed }) => [est.chip, (pressed || esperando) && est.chipApagado]}
            >
              <Text style={est.chipTexto}>{chip.texto}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={est.barraEscritura}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Escríbele a Brío"
            placeholderTextColor={C.apagado}
            style={est.entrada}
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
              est.enviar,
              (!texto.trim() || esperando) && est.enviarApagado,
              pressed && est.chipApagado,
            ]}
          >
            <Text style={est.enviarTexto}>↑</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
