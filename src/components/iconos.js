import { View } from 'react-native';
import Chispa from './Chispa';

// Íconos propios, dibujados con Views. Cero librerías de íconos.
// Todos reciben { color, size } y ocupan la misma caja.

const caja = (size) => ({
  width: size,
  height: size,
  alignItems: 'center',
  justifyContent: 'center',
});

export function IconoHoy({ color, size = 22 }) {
  return (
    <View style={caja(size)}>
      <Chispa size={size} color={color} />
    </View>
  );
}

export function IconoSemana({ color, size = 22 }) {
  const barra = { width: size * 0.18, borderRadius: size * 0.09, backgroundColor: color };
  return (
    <View style={[caja(size), { flexDirection: 'row', gap: size * 0.12 }]}>
      <View style={[barra, { height: size * 0.5 }]} />
      <View style={[barra, { height: size * 0.78 }]} />
      <View style={[barra, { height: size * 0.5 }]} />
    </View>
  );
}

export function IconoChat({ color, size = 22 }) {
  return (
    <View style={caja(size)}>
      <View
        style={{
          width: size * 0.86,
          height: size * 0.68,
          borderRadius: size * 0.24,
          borderWidth: size * 0.11,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: size * 0.04,
          backgroundColor: color,
          marginTop: -size * 0.04,
          marginLeft: -size * 0.3,
        }}
      />
    </View>
  );
}

export function IconoProgreso({ color, size = 22 }) {
  const barra = { width: size * 0.18, borderRadius: size * 0.09, backgroundColor: color };
  return (
    <View style={[caja(size), { flexDirection: 'row', alignItems: 'flex-end', gap: size * 0.12 }]}>
      <View style={[barra, { height: size * 0.38 }]} />
      <View style={[barra, { height: size * 0.62 }]} />
      <View style={[barra, { height: size * 0.88 }]} />
    </View>
  );
}
