import AsyncStorage from '@react-native-async-storage/async-storage';

// Único punto que habla con el disco del teléfono.
// En la fase 4 este archivo pasa a ser la caché local de Supabase:
// misma firma, otro origen. Nadie más importa AsyncStorage.

const CLAVE = 'brio:estado:v1';

export async function cargarEstado() {
  try {
    const crudo = await AsyncStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    // Disco corrupto o lleno: arrancamos limpios antes que romper la app.
    return null;
  }
}

export async function guardarEstado(estado) {
  try {
    await AsyncStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // Perder un guardado no puede tumbar la pantalla.
  }
}

export async function borrarEstado() {
  try {
    await AsyncStorage.removeItem(CLAVE);
  } catch {}
}
