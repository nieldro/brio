// Encoger fotos antes de guardarlas o de mandarlas.
//
// Dos motivos, los dos reales:
//   - Seis meses de fotos a resolución de sensor son cerca de 600 MB en el
//     teléfono de alguien que probablemente no tiene ese espacio.
//   - Una foto de plato sin encoger son 4 MB de base64 subiendo por datos
//     móviles, y la función la rechaza por tamaño.
//
// El módulo se pide dentro de la función, no arriba: un import de módulo
// nativo en el alcance del archivo tumbaba la app entera en Expo Go, sin
// error visible, y encontrarlo costó una tarde.

export const ANCHO_ALBUM = 720;
export const ANCHO_PLATO = 900; // el modelo necesita ver el plato, no el póster

export async function encoger(uri, { ancho = ANCHO_ALBUM, calidad = 0.6, base64 = false } = {}) {
  try {
    const IM = require('expo-image-manipulator');
    const contexto = IM.ImageManipulator.manipulate(uri);
    contexto.resize({ width: ancho });
    const imagen = await contexto.renderAsync();
    const salida = await imagen.saveAsync({
      compress: calidad,
      format: IM.SaveFormat.JPEG,
      base64,
    });
    return { uri: salida.uri, base64: salida.base64 ?? null };
  } catch {
    // Sin el módulo o con un formato raro: se devuelve la original. Para el
    // álbum eso es una foto pesada, que sirve igual; para el plato es un
    // base64 vacío, y la pantalla lo dice en vez de mandar una foto enorme.
    return { uri, base64: null };
  }
}
