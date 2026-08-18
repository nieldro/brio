import { View } from 'react-native';
import { useTema } from '../state/TemaContext';

// El semáforo informa, nunca castiga. Verde suma, ámbar modera, rojo avisa.
export default function PuntoSemaforo({ color = 'verde', size = 10 }) {
  const { SEMAFORO } = useTema();

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
