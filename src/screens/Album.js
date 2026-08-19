import { useMemo } from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';

import { useEstilos } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import { useAlbum } from '../state/useAlbum';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';

import { borrarAlbum } from '../lib/album';
import { textoDelAlbum } from '../services/album';

const crear = ({ C, T, R, S }) => ({
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
  cuadricula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    marginTop: S.md,
  },
  miniatura: {
    width: '31.5%',
    aspectRatio: 3 / 4,
    borderRadius: R.chico,
    backgroundColor: C.crema,
  },
  botones: {
    gap: S.md,
  },
  borrar: {
    alignItems: 'center',
    paddingVertical: S.md,
  },
  borrarTexto: {
    ...T.secundario,
    color: C.gris,
    fontWeight: '600',
  },
  nota: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
  },
});

// Tu álbum: una foto al día y, a los seis meses, la película.
//
// Lo que esta pantalla NO tiene, y es la decisión de diseño más importante
// del archivo: no hay comparación lado a lado, ni "antes y después", ni un
// porcentaje de cambio. El documento dice que el público es vulnerable y que
// el diseño debe evitar la obsesión; mirarse contra uno mismo todos los días
// es exactamente el bucle que hay que evitar. El movimiento se ve entero, en
// la película, y de tarde en tarde.
export default function Album({ navigation }) {
  const est = useEstilos(crear);
  const { userId } = useUsuario();

  // Al volver de la cámara hay una foto nueva: el hook relee la carpeta.
  const { fotos, estado, setFotos } = useAlbum();

  const recientes = useMemo(() => [...fotos].reverse().slice(0, 12), [fotos]);

  const irACamara = () =>
    navigation.navigate('Camara', { anterior: estado.ultima?.uri ?? null });

  const confirmarBorrado = () => {
    Alert.alert(
      'Borrar tus fotos',
      'Se borran las de este teléfono y no hay copia en ningún otro lado. Esto no se puede deshacer.',
      [
        { text: 'Mejor no', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await borrarAlbum(userId);
            setFotos([]);
          },
        },
      ],
    );
  };

  return (
    <Pantalla contentStyle={est.contenido}>
      <View>
        <Text style={est.titulo}>Tu álbum</Text>
        <Text style={est.intro}>{textoDelAlbum(estado)}</Text>
      </View>

      {estado.total > 0 && (
        <Tarjeta>
          <Etiqueta>tus últimas</Etiqueta>
          <View style={est.cuadricula}>
            {recientes.map((f) => (
              <Image key={f.clave} source={{ uri: f.uri }} style={est.miniatura} />
            ))}
          </View>
        </Tarjeta>
      )}

      <View style={est.botones}>
        <Boton onPress={irACamara} variante={estado.tieneHoy ? 'suave' : 'coral'}>
          {estado.tieneHoy ? 'Repetir la de hoy' : 'Tomar la de hoy'}
        </Boton>

        {estado.puedeVerPelicula && (
          <Boton variante="suave" onPress={() => navigation.navigate('Pelicula')}>
            Ver tu película
          </Boton>
        )}
      </View>

      {estado.total > 0 && (
        <Pressable onPress={confirmarBorrado} accessibilityRole="button" style={est.borrar}>
          <Text style={est.borrarTexto}>Borrar mis fotos</Text>
        </Pressable>
      )}

      <Text style={est.nota}>
        Estas fotos viven solo en tu teléfono. No se suben a ningún servidor, no entran en tu
        galería y yo tampoco las veo.
      </Text>
    </Pantalla>
  );
}
