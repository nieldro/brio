import { View, Text } from 'react-native';
import { useEstilos, useTema } from '../state/TemaContext';
import Logo from './Logo';

// La marca completa: isotipo, wordmark y lema.
//
// El isotipo es vector (Logo.js), así que se ve nítido a cualquier tamaño.
// El wordmark va en el navy de la paleta y el lema en tres colores medidos,
// no en el degradado del logo: sobre texto de 14 px ese degradado no llega
// al contraste mínimo, y el lema está para leerse.
const crear = ({ C, S }) => ({
  bloque: {
    alignItems: 'center',
    gap: S.md,
  },
  palabra: {
    fontWeight: '800',
    color: C.cafe,
    letterSpacing: 2,
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

export default function Marca({ size = 40, conLema = false, conLogo = true, style }) {
  const est = useEstilos(crear);
  const { C } = useTema();

  return (
    <View style={[est.bloque, style]} accessibilityRole="image" accessibilityLabel="Brío">
      {conLogo && <Logo size={size * 2.4} />}

      <Text style={[est.palabra, { fontSize: size, lineHeight: size * 1.12 }]}>BRÍO</Text>

      {conLema && (
        <View style={est.lema}>
          <Text style={[est.trozo, { color: C.salviaTexto }]}>Tu ritmo. </Text>
          <Text style={[est.trozo, { color: C.gris }]}>Tu proceso. </Text>
          <Text style={[est.trozo, { color: C.coralTexto }]}>Siempre adelante.</Text>
        </View>
      )}
    </View>
  );
}
