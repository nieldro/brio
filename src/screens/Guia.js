import { View, Text, Linking } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';

import { useEstilos } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';
import { guiaDe, busquedaDeVideo } from '../services/guias';

const crear = ({ C, T, R, S }) => ({
  contenido: {
    paddingTop: S.lg,
  },
  titulo: {
    ...T.saludo,
    fontSize: 28,
    lineHeight: 36,
  },
  detalle: {
    ...T.cuerpo,
    color: C.gris,
    marginBottom: S.sm,
  },
  paso: {
    flexDirection: 'row',
    gap: S.md,
    marginTop: S.md,
  },
  numero: {
    ...T.subtitulo,
    color: C.coralTexto,
    width: 18,
  },
  textoPaso: {
    ...T.cuerpo,
    flex: 1,
  },
  fila: {
    flexDirection: 'row',
    gap: S.md,
    marginTop: S.md,
    alignItems: 'flex-start',
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  puntoAmbar: {
    backgroundColor: C.ambar,
  },
  puntoSalvia: {
    backgroundColor: C.salvia,
  },
  texto: {
    ...T.cuerpo,
    flex: 1,
  },
  aviso: {
    ...T.secundario,
    marginTop: S.md,
  },
  legal: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
    marginTop: S.lg,
  },
  pieVideo: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
    marginTop: -S.sm,
  },
});

// Cómo se hace el movimiento. Las indicaciones salen de una biblioteca
// escrita a mano, no de la IA: una instrucción de técnica inventada puede
// lesionar a alguien.
export default function Guia({ route }) {
  const est = useEstilos(crear);
  const ejercicio = route?.params?.ejercicio ?? {};
  const g = guiaDe(ejercicio);

  // Se intenta primero con la app de YouTube, que es donde la persona ya
  // tiene su sesión y su idioma. Si no está instalada, se abre el navegador.
  const verVideo = async () => {
    const url = busquedaDeVideo(g);
    try {
      await Linking.openURL(url);
    } catch {
      await openBrowserAsync(url);
    }
  };

  return (
    <Pantalla contentStyle={est.contenido}>
      <View>
        <Text style={est.titulo}>{g.nombre}</Text>
        {!!ejercicio.detalle && <Text style={est.detalle}>{ejercicio.detalle}</Text>}
      </View>

      <Tarjeta>
        <Etiqueta>cómo se hace</Etiqueta>
        {g.como.map((paso, i) => (
          <View key={paso} style={est.paso}>
            <Text style={est.numero}>{i + 1}</Text>
            <Text style={est.textoPaso}>{paso}</Text>
          </View>
        ))}
        {g.esGenerica && (
          <Text style={est.aviso}>
            Este movimiento todavía no tiene guía propia. Si tienes dudas, pregúntale a Brío en
            el chat.
          </Text>
        )}
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>en qué fijarte</Etiqueta>
        <View style={est.fila}>
          <View style={[est.punto, est.puntoAmbar]} />
          <Text style={est.texto}>{g.cuidado}</Text>
        </View>
        {!!g.respira && (
          <View style={est.fila}>
            <View style={[est.punto, est.puntoAmbar]} />
            <Text style={est.texto}>{g.respira}</Text>
          </View>
        )}
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>si hoy no puedes</Etiqueta>
        <View style={est.fila}>
          <View style={[est.punto, est.puntoSalvia]} />
          <Text style={est.texto}>{g.masFacil}</Text>
        </View>
      </Tarjeta>

      {/* Leer cómo se hace no siempre alcanza: hay movimientos que se
          entienden al verlos. Va a una búsqueda y no a un video fijo, para
          que nunca sea un enlace muerto ni uno inventado. */}
      <Boton variante="suave" onPress={verVideo}>
        Verlo en video
      </Boton>
      <Text style={est.pieVideo}>Se abre YouTube con la búsqueda del movimiento.</Text>

      <Text style={est.legal}>
        Brío acompaña, no diagnostica. Ante dolor, lesión o enfermedad, consulta a un profesional.
      </Text>
    </Pantalla>
  );
}
