import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos } from '../state/TemaContext';
import { DEGRADADOS } from '../theme';
import Casilla from './Casilla';

const crear = ({ C, T, R, S }) => ({
  sello: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderRadius: R.medio,
    borderWidth: 1.5,
    borderColor: C.salvia,
    backgroundColor: C.blanco,
    paddingVertical: S.lg,
    paddingHorizontal: S.lg,
  },
  texto: {
    ...T.subtitulo,
    color: C.salviaTexto,
    flex: 1,
  },
  cinta: {
    height: 5,
    borderTopLeftRadius: R.medio,
    borderTopRightRadius: R.medio,
  },
});

// El día ya está marcado.
//
// Antes esto era el mismo botón con otro color, y ahí estaba el problema:
// seguía teniendo forma de botón, así que la gente lo tocaba esperando algo y
// no pasaba nada. Un día no se puede marcar dos veces.
//
// Ahora es un sello: se lee como un estado conseguido, no como algo por hacer.
// No se puede tocar porque no hay nada que tocar.
export default function SelloHecho({ texto }) {
  const est = useEstilos(crear);

  return (
    <View accessibilityRole="text" accessibilityLabel={texto}>
      <LinearGradient
        colors={DEGRADADOS.logrado}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={est.cinta}
      />
      <View style={est.sello}>
        <Casilla marcada size={26} />
        <Text style={est.texto}>{texto}</Text>
      </View>
    </View>
  );
}
