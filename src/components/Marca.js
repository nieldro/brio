import { View, Text } from 'react-native';
import { useEstilos, useTema } from '../state/TemaContext';
import Chispa from './Chispa';

// El logo de Brío dentro de la app.
//
// Está dibujado con tipografía y no con una imagen a propósito, por ahora:
// una imagen se ve borrosa si no viene en la resolución exacta de cada
// pantalla, y el archivo del logo todavía no está en `assets/`. Cuando esté,
// este componente es el único sitio donde hay que cambiarlo.
//
// El degradado del logo original no se reproduce, y eso también es a
// propósito: el documento pide cero neón sobre pantallas de texto. La marca
// aquí es el wordmark y la chispa, que es justo lo que sobrevive en pequeño.
const crear = ({ C, S }) => ({
  bloque: {
    alignItems: 'center',
    gap: S.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  palabra: {
    fontWeight: '800',
    color: C.cafe,
    letterSpacing: 2,
  },
  chispa: {
    marginLeft: 3,
  },
  lema: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  trozo: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default function Marca({ size = 40, conLema = false, chispa = true, style }) {
  const est = useEstilos(crear);
  const { C } = useTema();

  return (
    <View style={[est.bloque, style]} accessibilityRole="image" accessibilityLabel="Brío">
      <View style={est.fila}>
        <Text style={[est.palabra, { fontSize: size, lineHeight: size * 1.12 }]}>BRÍO</Text>
        {chispa && <Chispa size={size * 0.42} style={est.chispa} />}
      </View>

      {conLema && (
        <View style={est.lema}>
          {/* Los tres colores del lema salen de la paleta medida, no del
              degradado del logo: sobre texto de 14 px ese degradado no llega
              al contraste mínimo. */}
          <Text style={[est.trozo, { color: C.salviaTexto }]}>Tu ritmo. </Text>
          <Text style={[est.trozo, { color: C.gris }]}>Tu proceso. </Text>
          <Text style={[est.trozo, { color: C.coralTexto }]}>Siempre adelante.</Text>
        </View>
      )}
    </View>
  );
}
