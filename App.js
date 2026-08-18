import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TemaProvider, useTema } from './src/state/TemaContext';
import { UsuarioProvider } from './src/state/UsuarioContext';
import { CelebracionProvider } from './src/state/CelebracionContext';
import Raiz from './src/navigation/Raiz';

// El tema de navegación se alimenta del tema de Brío: nada de blanco de fábrica
// en claro, ni del negro puro de fábrica en oscuro.
function Navegacion() {
  const { C, esOscuro } = useTema();

  const base = esOscuro ? DarkTheme : DefaultTheme;
  const tema = {
    ...base,
    dark: esOscuro,
    colors: {
      ...base.colors,
      background: C.crema,
      card: C.blanco,
      border: C.borde,
      primary: C.coral,
      text: C.cafe,
      notification: C.coral,
    },
  };

  return (
    <NavigationContainer theme={tema}>
      <CelebracionProvider>
        {/* En oscuro los iconos de la barra van claros, y al revés. */}
        <StatusBar style={esOscuro ? 'light' : 'dark'} backgroundColor={C.crema} />
        <Raiz />
      </CelebracionProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TemaProvider>
        <UsuarioProvider>
          <Navegacion />
        </UsuarioProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
}
