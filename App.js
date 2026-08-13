import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { C } from './src/theme';
import { UsuarioProvider } from './src/state/UsuarioContext';
import { CelebracionProvider } from './src/state/CelebracionContext';
import Raiz from './src/navigation/Raiz';

// El tema de navegación se alimenta del theme de Brío: nada de blanco de fábrica.
const temaBrio = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: C.crema,
    card: C.blanco,
    border: C.borde,
    primary: C.coral,
    text: C.cafe,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <UsuarioProvider>
        <NavigationContainer theme={temaBrio}>
          <CelebracionProvider>
            <StatusBar style="dark" />
            <Raiz />
          </CelebracionProvider>
        </NavigationContainer>
      </UsuarioProvider>
    </SafeAreaProvider>
  );
}
