import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { C } from '../theme';

// Único punto que habla con Expo Push. Devuelve el token o null.
// Nunca lanza: negarse a recibir recordatorios no puede romper el onboarding.

// Con la app abierta, el recordatorio se ve pero no interrumpe.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function canalAndroid() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('brio', {
    name: 'Recordatorios de Brío',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: C.coral,
    sound: null,
  });
}

export async function pedirPermisoYToken() {
  try {
    // El emulador no entrega push. No tiene sentido pedir permiso ahí.
    if (!Device.isDevice) return null;

    await canalAndroid();

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
