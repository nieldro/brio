import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTema } from '../state/TemaContext';
import Tabs from './Tabs';
import Perfil from '../screens/Perfil';
import Diario from '../screens/Diario';
import Cuenta from '../screens/Cuenta';
import GuiaEjercicio from '../screens/Guia';

const Pila = createNativeStackNavigator();

// Las 4 pestañas son la app. Perfil y Diario se abren encima, a un toque,
// y se cierran volviendo. No son pestañas: no compiten con lo diario.
export default function PilaPrincipal() {
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
      <Pila.Screen name="Pestañas" component={Tabs} options={{ headerShown: false }} />
      <Pila.Screen name="Perfil" component={Perfil} options={{ title: 'Tu perfil' }} />
      <Pila.Screen name="Diario" component={Diario} options={{ title: 'Tu diario' }} />
      <Pila.Screen
        name="Cuenta"
        component={Cuenta}
        options={{ title: 'Tu cuenta', presentation: 'modal' }}
      />
      <Pila.Screen name="Guia" component={GuiaEjercicio} options={{ title: 'Cómo se hace' }} />
    </Pila.Navigator>
  );
}
