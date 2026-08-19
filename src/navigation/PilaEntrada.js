import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTema } from '../state/TemaContext';
import Bienvenida from '../screens/Bienvenida';
import Onboarding from '../screens/onboarding/Onboarding';
import Cuenta from '../screens/Cuenta';

const Pila = createNativeStackNavigator();

// Pila de quien todavía no tiene perfil.
//
// Bienvenida va primero para que entrar con una cuenta que ya existe sea una
// de las tres opciones de la primera pantalla. Antes lo primero era el paso 1
// del onboarding y volver a entrar era un enlace pequeño que nadie encontraba.
export default function PilaEntrada() {
  const { C, T } = useTema();

  return (
    <Pila.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.crema },
        headerShadowVisible: false,
        headerTintColor: C.coralTexto,
        headerTitleStyle: { ...T.subtitulo, fontSize: 18 },
        contentStyle: { backgroundColor: C.crema },
      }}
    >
      <Pila.Screen name="Bienvenida" component={Bienvenida} options={{ headerShown: false }} />
      <Pila.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
      <Pila.Screen
        name="Cuenta"
        component={Cuenta}
        options={{ title: 'Tu cuenta', presentation: 'modal' }}
      />
    </Pila.Navigator>
  );
}
