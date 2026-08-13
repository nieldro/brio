import { View, Text, StyleSheet } from 'react-native';
import { C, R, S } from '../theme';
import Chispa from './Chispa';

// Píldora de racha. Muestra días seguidos, nunca días perdidos.
export default function PildoraRacha({ dias = 0 }) {
  return (
    <View style={styles.pildora}>
      <Chispa size={13} />
      <Text style={styles.texto}>
        {dias} {dias === 1 ? 'día' : 'días'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
