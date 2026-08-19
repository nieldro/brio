import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import Etiqueta from '../components/Etiqueta';

import { listarFotos } from '../lib/album';
import {
  seleccionarCuadros,
  textoDeLaPelicula,
  duracionSegundos,
  MS_POR_CUADRO,
  MINIMO_CUADROS,
} from '../services/album';
import { fechaLargaDeClave } from '../services/fecha';

const crear = ({ C, T, R, S }) => ({
  todo: {
    flex: 1,
    backgroundColor: C.crema,
    padding: S.xl,
    gap: S.lg,
    justifyContent: 'center',
  },
  marco: {
    flex: 1,
    borderRadius: R.grande,
    overflow: 'hidden',
    backgroundColor: C.blanco,
    borderWidth: 1,
    borderColor: C.borde,
  },
  cuadro: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fecha: {
    ...T.secundario,
    textAlign: 'center',
  },
  riel: {
    height: 6,
    borderRadius: R.pildora,
    backgroundColor: C.borde,
    overflow: 'hidden',
  },
  avance: {
    height: '100%',
    borderRadius: R.pildora,
    backgroundColor: C.coral,
  },
  controles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: S.md,
  },
  chip: {
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderRadius: R.pildora,
    borderWidth: 1,
    borderColor: C.borde,
    backgroundColor: C.blanco,
  },
  chipTexto: {
    ...T.cuerpo,
    fontWeight: '700',
  },
  cierre: {
    gap: S.sm,
    alignItems: 'center',
  },
  frase: {
    ...T.titulo,
    textAlign: 'center',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.lg,
  },
  vacio: {
    ...T.cuerpo,
    color: C.gris,
    textAlign: 'center',
  },
});

// La película: todas tus fotos, una detrás de otra.
//
// Se reproduce dentro de la app y no se exporta como archivo de video. Los
// codificadores de video no existen en Expo Go y los que hay fuera son de
// pago o están descontinuados; hacerlo en un servidor costaría dinero, y la
// regla del proyecto es capa gratuita permanente. Exportar el mp4 queda para
// cuando la app tenga compilación propia. Aquí no se promete lo que no hay:
// no hay botón de compartir.
export default function Pelicula() {
  const est = useEstilos(crear);
  const { C } = useTema();
  const { userId } = useUsuario();

  const [fotos, setFotos] = useState(null); // null mientras se lee la carpeta
  const [i, setI] = useState(0);
  const [corriendo, setCorriendo] = useState(true);
  const reloj = useRef(null);

  useEffect(() => {
    let vivo = true;
    listarFotos(userId).then((lista) => vivo && setFotos(lista));
    return () => {
      vivo = false;
    };
  }, [userId]);

  const cuadros = useMemo(() => seleccionarCuadros(fotos ?? []), [fotos]);
  const listo = i >= cuadros.length - 1;

  useEffect(() => {
    if (!corriendo || cuadros.length < MINIMO_CUADROS) return undefined;

    reloj.current = setInterval(() => {
      setI((n) => Math.min(n + 1, cuadros.length - 1));
    }, MS_POR_CUADRO);

    return () => clearInterval(reloj.current);
  }, [corriendo, cuadros.length]);

  // Parar es un efecto aparte y no va dentro del setI: React puede llamar
  // dos veces la función que actualiza el estado, y meterle un efecto dentro
  // hace que a veces se salte un cuadro.
  useEffect(() => {
    if (cuadros.length && i >= cuadros.length - 1) setCorriendo(false);
  }, [i, cuadros.length]);

  const reiniciar = useCallback(() => {
    setI(0);
    setCorriendo(true);
  }, []);

  if (fotos === null) {
    return (
      <View style={[est.todo, est.centro]}>
        <ActivityIndicator color={C.coral} />
      </View>
    );
  }

  if (cuadros.length < MINIMO_CUADROS) {
    return (
      <View style={[est.todo, est.centro]}>
        <Text style={est.vacio}>
          Todavía no hay suficientes fotos para armar la película. Con cuatro ya se ve el
          movimiento.
        </Text>
      </View>
    );
  }

  const actual = cuadros[i];
  const siguiente = cuadros[i + 1];

  return (
    <View style={est.todo}>
      <View style={est.marco}>
        {/* El siguiente cuadro va debajo para que el sistema lo decodifique
            antes de que le toque. Sin esto, la película parpadea en blanco
            entre foto y foto. */}
        {!!siguiente && (
          <Image source={{ uri: siguiente.uri }} style={est.cuadro} resizeMode="cover" />
        )}
        <Image source={{ uri: actual.uri }} style={est.cuadro} resizeMode="cover" />
      </View>

      <Text style={est.fecha}>{fechaLargaDeClave(actual.clave)}</Text>

      <View style={est.riel}>
        <View style={[est.avance, { width: `${((i + 1) / cuadros.length) * 100}%` }]} />
      </View>

      {listo ? (
        <View style={est.cierre}>
          <Etiqueta>tu película</Etiqueta>
          <Text style={est.frase}>{textoDeLaPelicula(cuadros)}</Text>
          <Text style={est.fecha}>
            {cuadros.length} fotos, {duracionSegundos(cuadros)} segundos.
          </Text>
        </View>
      ) : null}

      <View style={est.controles}>
        <Pressable onPress={reiniciar} accessibilityRole="button" style={est.chip}>
          <Text style={est.chipTexto}>Verla otra vez</Text>
        </Pressable>
        {!listo && (
          <Pressable
            onPress={() => setCorriendo((v) => !v)}
            accessibilityRole="button"
            style={est.chip}
          >
            <Text style={est.chipTexto}>{corriendo ? 'Pausa' : 'Seguir'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
