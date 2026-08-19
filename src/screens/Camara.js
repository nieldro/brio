import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import { guardarFoto } from '../lib/album';

// El módulo se pide aquí dentro, no arriba del archivo. Un import de módulo
// nativo en el alcance del archivo se ejecuta al cargar la pila entera, y si
// el módulo falla se cae la app completa sin decir por qué.
let MODULO;
function camara() {
  if (!MODULO) {
    try {
      MODULO = require('expo-camera');
    } catch {
      MODULO = { roto: true };
    }
  }
  return MODULO;
}

const crear = ({ C, T, R, S }) => ({
  todo: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  vista: {
    flex: 1,
  },
  capa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fantasma: {
    opacity: 0.28,
  },
  guiaHombros: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    top: '32%',
  },
  guiaCintura: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    top: '78%',
  },
  guiaCentro: {
    position: 'absolute',
    top: '25%',
    bottom: '15%',
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  instruccion: {
    position: 'absolute',
    top: S.xxxl,
    left: S.xl,
    right: S.xl,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  barra: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: S.xxl,
    alignItems: 'center',
    gap: S.lg,
  },
  disparo: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disparoDentro: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.coral,
  },
  secundarios: {
    flexDirection: 'row',
    gap: S.xl,
  },
  chip: {
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    borderRadius: R.pildora,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  chipTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.xl,
    gap: S.lg,
    backgroundColor: C.crema,
  },
  aviso: {
    ...T.cuerpo,
    textAlign: 'center',
  },
  boton: {
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderRadius: R.medio,
    backgroundColor: C.coral,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

// La foto del día.
//
// Cámara propia y no la del sistema por una sola razón: el fantasma. Encima
// del visor va la foto anterior al 28 % de opacidad, y con eso la persona se
// para donde estaba ayer. Sin esa referencia, seis meses de fotos sueltas dan
// una película que salta y no se entiende; con ella, se ve el movimiento.
//
// Las líneas marcan hombros y cintura porque el encuadre es de cintura para
// arriba, y porque tener una marca fija es lo que hace comparable el conjunto.
export default function Camara({ navigation, route }) {
  const est = useEstilos(crear);
  const { C } = useTema();
  const { userId, hoy } = useUsuario();

  const { CameraView, Camera, roto } = camara();
  const anterior = route?.params?.anterior ?? null;

  const vista = useRef(null);
  const [permiso, setPermiso] = useState(null); // null: sin preguntar
  const [conFantasma, setConFantasma] = useState(true);
  const [frontal, setFrontal] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (roto) return;
    let vivo = true;
    Camera.requestCameraPermissionsAsync()
      .then((r) => vivo && setPermiso(!!r.granted))
      .catch(() => vivo && setPermiso(false));
    return () => {
      vivo = false;
    };
  }, [roto, Camera]);

  const disparar = async () => {
    if (guardando || !vista.current) return;
    setGuardando(true);
    try {
      const foto = await vista.current.takePictureAsync({ quality: 0.7 });
      await guardarFoto(userId, foto.uri, hoy);
      navigation.goBack();
    } catch {
      // Sin espacio en disco o cámara ocupada: se sale sin drama y la
      // persona lo vuelve a intentar. Nunca un error técnico en la cara.
      navigation.goBack();
    }
  };

  if (roto || permiso === false) {
    return (
      <View style={est.centro}>
        <Text style={est.aviso}>
          {roto
            ? 'La cámara no está disponible en esta versión de la app.'
            : 'Sin permiso de cámara no puedo tomar la foto. Lo puedes cambiar en los ajustes del teléfono cuando quieras.'}
        </Text>
        <Pressable onPress={() => navigation.goBack()} style={est.boton}>
          <Text style={est.botonTexto}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (permiso === null) {
    return (
      <View style={est.centro}>
        <ActivityIndicator color={C.coral} />
      </View>
    );
  }

  return (
    <View style={est.todo}>
      <CameraView ref={vista} style={est.vista} facing={frontal ? 'front' : 'back'} />

      {!!anterior && conFantasma && (
        <Image source={{ uri: anterior }} style={[est.capa, est.fantasma]} resizeMode="cover" />
      )}

      <View style={est.capa} pointerEvents="none">
        <View style={est.guiaHombros} />
        <View style={est.guiaCintura} />
        <View style={est.guiaCentro} />
        <Text style={est.instruccion}>
          {anterior && conFantasma
            ? 'Ponte donde estabas la vez pasada. Hombros en la línea de arriba.'
            : 'De la cintura para arriba. Hombros en la línea de arriba.'}
        </Text>
      </View>

      <View style={est.barra}>
        <View style={est.secundarios}>
          {!!anterior && (
            <Pressable
              onPress={() => setConFantasma((v) => !v)}
              accessibilityRole="button"
              style={est.chip}
            >
              <Text style={est.chipTexto}>{conFantasma ? 'Quitar guía' : 'Poner guía'}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => setFrontal((v) => !v)}
            accessibilityRole="button"
            style={est.chip}
          >
            <Text style={est.chipTexto}>Girar</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={disparar}
          disabled={guardando}
          accessibilityRole="button"
          accessibilityLabel="Tomar la foto de hoy"
          style={est.disparo}
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={est.disparoDentro} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
