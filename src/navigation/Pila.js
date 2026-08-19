import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTema } from '../state/TemaContext';
import Tabs from './Tabs';
import Perfil from '../screens/Perfil';
import Ajustes from '../screens/Ajustes';
import Diario from '../screens/Diario';
import Cuenta from '../screens/Cuenta';
import GuiaEjercicio from '../screens/Guia';
import Rutina from '../screens/Rutina';
import Plato from '../screens/Plato';
import Mesa from '../screens/Mesa';
import Habitos from '../screens/Habitos';
import Logros from '../screens/Logros';
import Movimientos from '../screens/Movimientos';
import Album from '../screens/Album';
import Camara from '../screens/Camara';
import Pelicula from '../screens/Pelicula';
import Escaner from '../screens/Escaner';
import Dinero from '../screens/Dinero';
import Ahorro from '../screens/Ahorro';
import Pareja from '../screens/Pareja';

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
      <Pila.Screen name="Ajustes" component={Ajustes} options={{ title: 'Ajustes' }} />
      <Pila.Screen name="Diario" component={Diario} options={{ title: 'Tu diario' }} />
      <Pila.Screen
        name="Cuenta"
        component={Cuenta}
        options={{ title: 'Tu cuenta', presentation: 'modal' }}
      />
      <Pila.Screen name="Guia" component={GuiaEjercicio} options={{ title: 'Cómo se hace' }} />
      <Pila.Screen name="Rutina" component={Rutina} options={{ title: 'Rutina de hoy' }} />
      <Pila.Screen name="Mesa" component={Mesa} options={{ title: 'Tu mesa' }} />
      <Pila.Screen name="Habitos" component={Habitos} options={{ title: 'Tus hábitos' }} />
      <Pila.Screen name="Logros" component={Logros} options={{ title: 'Lo que construiste' }} />
      <Pila.Screen
        name="Movimientos"
        component={Movimientos}
        options={{ title: 'Movimientos' }}
      />
      <Pila.Screen name="Plato" component={Plato} options={{ title: 'Tu plato' }} />
      <Pila.Screen name="Album" component={Album} options={{ title: 'Tu álbum' }} />
      <Pila.Screen name="Pelicula" component={Pelicula} options={{ title: 'Tu película' }} />
      {/* Sin encabezado: la cámara es la pantalla entera, y una barra encima
          le quitaría espacio justo al encuadre que se está pidiendo cuidar. */}
      <Pila.Screen name="Camara" component={Camara} options={{ headerShown: false }} />

      {/* Paquete 1.4.2 de la EDT. Igual que la cámara del álbum: sin barra,
          porque lo que hay que apuntar es un código pequeño. */}
      <Pila.Screen name="Escaner" component={Escaner} options={{ headerShown: false }} />

      {/* Paquete 1.7. Van en la pila y no en una pestaña: las cuatro pestañas
          son lo diario, y el dinero no puede competir con el reto de hoy. */}
      <Pila.Screen name="Dinero" component={Dinero} options={{ title: 'Tu dinero' }} />
      <Pila.Screen name="Ahorro" component={Ahorro} options={{ title: 'Tu ahorro' }} />

      {/* Paquete 1.3.4. */}
      <Pila.Screen name="Pareja" component={Pareja} options={{ title: 'De a dos' }} />
    </Pila.Navigator>
  );
}
