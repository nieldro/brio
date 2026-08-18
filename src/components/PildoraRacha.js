import { View, Text } from 'react-native';
import { useEstilos } from '../state/TemaContext';
import Chispa from './Chispa';

const crear = ({ C, R, S }) => ({
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs + 2,
    backgroundColor: C.blanco,
    borderRadius: R.pildora,
    borderWidth: 1,
    borderColor: C.borde,
    paddingVertical: S.sm - 1,
    paddingHorizontal: S.md,
  },
  texto: {
    fontSize: 14,
    fontWeight: '700',
    color: C.cafe,
  },
});

// Píldora de racha. Muestra días seguidos, nunca días perdidos.
export default function PildoraRacha({ dias = 0 }) {
  const est = useEstilos(crear);

  return (
    <View style={est.pildora}>
      <Chispa size={13} />
      <Text style={est.texto}>
        {dias} {dias === 1 ? 'día' : 'días'}
      </Text>
    </View>
  );
}
