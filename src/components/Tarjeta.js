import { View } from 'react-native';
import { useEstilos } from '../state/TemaContext';

// La fábrica va a nivel de módulo: si cambiara de identidad en cada render,
// el memo de useEstilos no serviría de nada.
const crear = ({ C, R, S, SOMBRA }) => ({
  tarjeta: {
    backgroundColor: C.blanco,
    borderRadius: R.grande,
    borderWidth: 1,
    borderColor: C.borde,
    padding: S.xl,
    ...SOMBRA,
  },
});

// Tarjeta base. Toda superficie de contenido de Brío pasa por aquí.
export default function Tarjeta({ children, style }) {
  const est = useEstilos(crear);
  return <View style={[est.tarjeta, style]}>{children}</View>;
}
