import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';
import Aparece from '../components/Aparece';
import Latido from '../components/Latido';
import PuntoSemaforo from '../components/PuntoSemaforo';

import { buscarProducto } from '../lib/openfoodfacts';
import { normalizarCodigo, codigoValido, leerProducto } from '../services/producto';

// El módulo se pide aquí dentro, no arriba del archivo, por lo mismo que en
// Camara.js: un import nativo en el alcance del archivo se ejecuta al cargar
// la pila entera, y si falla se cae la app sin decir por qué.
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

// Los cuatro formatos que llevan los productos de supermercado. Pedir solo
// estos y no todos los que sabe leer la librería hace dos cosas: el lector va
// más rápido, y un QR pegado en la nevera no dispara una búsqueda absurda.
const CODIGOS = ['ean13', 'ean8', 'upc_a', 'upc_e'];

const crear = ({ C, T, R, S }) => ({
  // --- La cámara ----------------------------------------------------------
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
  marco: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '36%',
    height: 140,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: R.medio,
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

  // --- Sin cámara y sin permiso -------------------------------------------
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.xl,
    gap: S.lg,
    backgroundColor: C.crema,
  },
  disculpa: {
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

  // --- La lectura ---------------------------------------------------------
  contenido: {
    paddingTop: S.lg,
  },
  titulo: {
    ...T.saludo,
    fontSize: 28,
    lineHeight: 36,
  },
  intro: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.sm,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.md,
  },
  nombre: {
    ...T.titulo,
    flex: 1,
  },
  suma: {
    ...T.cuerpo,
    marginTop: S.md,
  },
  mensaje: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.md,
  },
  botones: {
    gap: S.md,
  },
  nota: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
  },
});

const SIN_PRODUCTO = {
  titulo: 'Este todavía no está.',
  cuerpo: 'La base la llenamos entre todos y a veces falta uno. Prueba con otro empaque.',
};

const SIN_RED = {
  titulo: 'No pude consultarlo ahora.',
  cuerpo: 'Puede ser la señal. Inténtalo más tarde y aquí sigo.',
};

// El semáforo de un producto empacado.
//
// Es el mismo trato que el del plato, con otra puerta de entrada: en vez de
// mirar la comida servida, se lee el código del empaque. Y termina en lo
// mismo, que es lo que importa: un color, el nombre y UNA cosa para sumarle.
//
// Lo que NO se enseña, aunque Open Food Facts lo mande entero: calorías,
// gramos de azúcar y la nota de la A a la E. Esas cifras deciden el color
// dentro de services/producto.js y se quedan ahí. La regla 1 manda igual
// sobre un empaque que sobre un plato.
//
// Y el producto no se guarda: se mira y se va, como la foto del plato. Sin
// historial de escaneos no hay lista de "lo malo que comí esta semana", que
// es exactamente el diario que esta app no quiere que nadie lleve.
export default function Escaner({ navigation }) {
  const est = useEstilos(crear);
  const { C } = useTema();

  const { CameraView, Camera, roto } = camara();

  // El lector dispara muchas veces por segundo mientras el código esté a la
  // vista. Sin este cerrojo saldrían diez búsquedas del mismo producto.
  const leyendo = useRef(false);

  // ¿Sigue la pantalla montada? Aquí se espera dos veces —el permiso de
  // cámara y la consulta, que llega a tardar ocho segundos— y en cualquiera
  // de las dos la persona pudo salirse. Sin esta bandera, lo que llega tarde
  // pinta sobre una pantalla que ya no está: el mismo cuidado que Camara.js y
  // lib/pasos.js. Una sola para las dos esperas, porque una sola es la
  // pregunta.
  const vivo = useRef(true);

  const [permiso, setPermiso] = useState(null); // null: sin preguntar
  const [mirando, setMirando] = useState(true); // false: ya hay algo que leer
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [problema, setProblema] = useState(null);

  // Se vuelve a poner en true al montar, no solo en false al salir: en
  // desarrollo el modo estricto monta, desmonta y vuelve a montar, y una
  // bandera que solo baja dejaría la pantalla muda desde el primer segundo.
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  useEffect(() => {
    if (roto) return;

    Camera.requestCameraPermissionsAsync()
      .then((r) => vivo.current && setPermiso(!!r.granted))
      .catch(() => vivo.current && setPermiso(false));
  }, [roto, Camera]);

  const alLeer = useCallback(async ({ data, type }) => {
    if (leyendo.current) return;

    const codigo = normalizarCodigo(data, type);
    // Un código leído a medias no es un error que mostrarle a nadie: se sigue
    // mirando y en un segundo entra bien.
    if (!codigoValido(codigo)) return;

    leyendo.current = true;
    setMirando(false);
    setCargando(true);

    const { estado, cuerpo } = await buscarProducto(codigo);
    if (!vivo.current) return;

    if (estado === 'sin-red') setProblema(SIN_RED);
    else {
      const leido = leerProducto(cuerpo);
      if (leido.hayProducto) setResultado(leido);
      else setProblema(SIN_PRODUCTO);
    }

    setCargando(false);
  }, []);

  const otro = () => {
    setResultado(null);
    setProblema(null);
    setMirando(true);
    leyendo.current = false;
  };

  if (roto || permiso === false) {
    return (
      <View style={est.centro}>
        <Text style={est.disculpa}>
          {roto
            ? 'La cámara no está disponible en esta versión de la app.'
            : 'Sin permiso de cámara no puedo leer el código. Lo puedes cambiar en los ajustes del teléfono cuando quieras.'}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={est.boton}
        >
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

  if (mirando) {
    return (
      <View style={est.todo}>
        <CameraView
          style={est.vista}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: CODIGOS }}
          onBarcodeScanned={alLeer}
        />

        <View style={est.capa} pointerEvents="none">
          <View style={est.marco} />
          <Text style={est.instruccion}>
            Apunta al código de barras del empaque. Yo hago el resto.
          </Text>
        </View>

        <View style={est.barra}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={est.chip}
          >
            <Text style={est.chipTexto}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pantalla contentStyle={est.contenido}>
      <Aparece orden={0}>
        <View>
          <Text style={est.titulo}>Mírame el empaque</Text>
          <Text style={est.intro}>
            No leo calorías ni notas. Miro qué tan cargado viene y te digo una cosa para
            sumarle.
          </Text>
        </View>
      </Aparece>

      {cargando && <Latido />}

      {!cargando && !!resultado && (
        <Aparece orden={1}>
          <Tarjeta>
            <Etiqueta>el empaque</Etiqueta>
            <View style={est.fila}>
              {/* Sin datos no hay punto. Un color a ojo sobre un producto del
                  que no se sabe nada es peor que no decir nada. */}
              {!!resultado.color && <PuntoSemaforo color={resultado.color} size={14} />}
              <Text style={est.nombre}>{resultado.nombre}</Text>
            </View>

            <Text style={est.suma}>{resultado.suma}</Text>
            <Text style={est.mensaje}>{resultado.mensaje}</Text>
          </Tarjeta>
        </Aparece>
      )}

      {!cargando && !!problema && (
        <Aparece orden={1}>
          <Tarjeta>
            <Etiqueta>brío te dice</Etiqueta>
            <Text style={est.suma}>{problema.titulo}</Text>
            <Text style={est.mensaje}>{problema.cuerpo}</Text>
          </Tarjeta>
        </Aparece>
      )}

      {/* La salida no se esconde nunca, tampoco mientras se consulta. La
          espera llega a ocho segundos con mala señal, y una pantalla que solo
          late y no deja salir se siente colgada: justo lo que ESPERA_MS
          quería evitar. Lo único que espera su turno es mirar otro empaque,
          porque ese sí necesita que la consulta termine. */}
      <View style={est.botones}>
        {!cargando && <Boton onPress={otro}>Mirar otro empaque</Boton>}
        <Boton variante="suave" onPress={() => navigation.goBack()}>
          Volver
        </Boton>
      </View>

      <Text style={est.nota}>
        Esto no se guarda en ninguna parte. Se mira y se va.
      </Text>
    </Pantalla>
  );
}
