import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { S } from '../theme';
import { useTema } from '../state/TemaContext';
import { IconoHoy, IconoSemana, IconoChat, IconoProgreso } from '../components/iconos';
import Hoy from '../screens/Hoy';
import Semana from '../screens/Semana';
import Chat from '../screens/Chat';
import Progreso from '../screens/Progreso';

const Tab = createBottomTabNavigator();

const PESTANAS = [
  { nombre: 'Hoy', componente: Hoy, Icono: IconoHoy },
  { nombre: 'Semana', componente: Semana, Icono: IconoSemana },
  { nombre: 'Chat', componente: Chat, Icono: IconoChat },
  { nombre: 'Progreso', componente: Progreso, Icono: IconoProgreso },
];

const ALTO_BARRA = 62;

export default function Tabs() {
  const { C } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.coralTexto,
        tabBarInactiveTintColor: C.apagado,
        // Con el teclado abierto la barra estorba: tapa el campo de escribir
        // del chat justo cuando la persona está escribiendo.
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: C.blanco,
          borderTopColor: C.borde,
          borderTopWidth: 1,
          // El alto se calcula con la barra de gestos del teléfono. Antes era
          // un número fijo y en los teléfonos con gestos quedaba un hueco
          // muerto debajo de las pestañas.
          height: ALTO_BARRA + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: S.sm,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {PESTANAS.map(({ nombre, componente, Icono }) => (
        <Tab.Screen
          key={nombre}
          name={nombre}
          component={componente}
          options={{
            tabBarIcon: ({ color }) => <Icono color={color} size={22} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
