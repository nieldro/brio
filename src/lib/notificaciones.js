import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { PALETAS } from '../theme';

// El canal de Android se configura una vez, fuera de React: no tiene acceso al
// tema activo. El coral es el mismo en las dos paletas, así que da igual cuál.
const CORAL = PALETAS.claro.coral;

// Único punto que habla con Expo Push. Devuelve el token o null.
// Nunca lanza: negarse a recibir recordatorios no puede romper el onboarding.
//
// OJO: `expo-notifications` se carga PEREZOSAMENTE, a propósito.
// En Expo Go para Android, el simple `import` lanza:
//   "Android Push notifications ... was removed from Expo Go with SDK 53"
// Es un error a nivel de módulo, sin capturar, y tumbaba la app entera antes
// de renderizar: la pantalla se quedaba en el splash sin mostrar nada.
// Cargándolo solo cuando el usuario pide el permiso, la app corre completa en
// Expo Go y los recordatorios funcionan en el development build.

let modulo;

// En Expo Go para Android, cargar el módulo lanza SIEMPRE. El try lo atrapa,
// pero el error igual sale por consola y en desarrollo aparece como una
// alerta roja encima de la app: parece que algo se rompió cuando no es así.
//
// Se pregunta antes en qué binario estamos y ni se intenta. En Expo Go se
// sabe de antemano que no hay push; en un build propio se carga normal.
const enExpoGo = () =>
  Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient';

function cargarModulo() {
  if (modulo !== undefined) return modulo;

  if (enExpoGo()) {
    modulo = null;
    return modulo;
  }

  try {
    // eslint-disable-next-line global-require
    modulo = require('expo-notifications');
    configurar(modulo);
  } catch {
    modulo = null;
  }
  return modulo;
}

// ¿Este binario puede recibir push? Falso en Expo Go para Android.
// La UI lo usa para explicar el porqué en vez de culpar al usuario.
export function hayModuloPush() {
  return cargarModulo() !== null;
}

function configurar(Notifications) {
  // Con la app abierta, el recordatorio se ve pero no interrumpe.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function canalAndroid(Notifications) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('brio', {
    name: 'Recordatorios de Brío',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: CORAL,
    sound: null,
  });
}

export async function pedirPermisoYToken() {
  const Notifications = cargarModulo();
  if (!Notifications) return null;

  try {
    // El emulador no entrega push. No tiene sentido pedir permiso ahí.
    if (!Device.isDevice) return null;

    await canalAndroid(Notifications);

    const { status: actual } = await Notifications.getPermissionsAsync();
    let status = actual;

    if (status !== 'granted') {
      const pedido = await Notifications.requestPermissionsAsync();
      status = pedido.status;
    }

    if (status !== 'granted') return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    return data ?? null;
  } catch {
    // Sin token la app funciona igual, solo sin recordatorios.
    return null;
  }
}
