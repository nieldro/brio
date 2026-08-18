import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTema } from '../state/TemaContext';
import Onboarding from '../screens/onboarding/Onboarding';
import Cuenta from '../screens/Cuenta';

const Pila = createNativeStackNavigator();

// Pila de quien todavía no tiene perfil. Existe solo para que el paso 1 pueda
// abrir "Ya tengo cuenta" sin obligar a nadie a registrarse para empezar.
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
      <Pila.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
      <Pila.Screen
        name="Cuenta"
        component={Cuenta}
        options={{ title: 'Tu cuenta', presentation: 'modal' }}
      />
    </Pila.Navigator>
  );
}
