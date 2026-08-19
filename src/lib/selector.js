// Cámara y galería del sistema para la foto del plato.
//
// Para el plato se usa el selector del sistema y no una cámara propia: no
// hace falta encuadre ni guía, y así la persona puede mandar una foto que ya
// tenía. La cámara propia con guía se usa solo en el álbum, donde alinear
// una foto con la anterior sí cambia el resultado.
//
// Módulo pedido dentro de la función, por lo mismo de siempre en Expo Go.

const picker = () => require('expo-image-picker');

const IMAGENES = ['images'];

// Devuelve { uri } o null si la persona canceló o dijo que no al permiso.
export async function tomarFoto() {
  try {
    const IP = picker();
    const permiso = await IP.requestCameraPermissionsAsync();
    if (!permiso.granted) return null;

    const r = await IP.launchCameraAsync({ mediaTypes: IMAGENES, quality: 0.7 });
    return r.canceled ? null : { uri: r.assets[0].uri };
  } catch {
    return null;
  }
}

export async function elegirFoto() {
  try {
    const IP = picker();
    const permiso = await IP.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return null;

    const r = await IP.launchImageLibraryAsync({ mediaTypes: IMAGENES, quality: 0.7 });
    return r.canceled ? null : { uri: r.assets[0].uri };
  } catch {
    return null;
  }
}
