import { View } from 'react-native';
import { SEMAFORO } from '../theme';

// El semáforo informa, nunca castiga. Verde suma, ámbar modera, rojo avisa.
export default function PuntoSemaforo({ color = 'verde', size = 10 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: SEMAFORO[color] ?? SEMAFORO.verde,
      }}
    />
  );
}
