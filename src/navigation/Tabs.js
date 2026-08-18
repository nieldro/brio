import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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

export default function Tabs() {
  const { C } = useTema();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.coralTexto,
        tabBarInactiveTintColor: C.apagado,
        tabBarStyle: {
          backgroundColor: C.blanco,
          borderTopColor: C.borde,
          borderTopWidth: 1,
          height: 64 + S.xl,
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
