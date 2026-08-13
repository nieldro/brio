import { View, StyleSheet } from 'react-native';

import { C } from '../theme';
import Latido from '../components/Latido';
import { useUsuario } from '../state/UsuarioContext';
import Onboarding from '../screens/onboarding/Onboarding';
import Tabs from './Tabs';

// Único punto que decide qué ve el usuario al abrir la app.
export default function Raiz() {
  const { hidratado, onboardingListo } = useUsuario();

  // Mientras se lee el disco. Sin esto, el onboarding parpadea en cada arranque.
  if (!hidratado) {
    return (
      <View style={styles.espera}>
        <Latido size={48} />
      </View>
    );
  }

  return onboardingListo ? <Tabs /> : <Onboarding />;
}

const styles = StyleSheet.create({
  espera: {
    flex: 1,
    backgroundColor: C.crema,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
