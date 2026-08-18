import { View } from 'react-native';

import { useEstilos } from '../state/TemaContext';
import Latido from '../components/Latido';
import { useUsuario } from '../state/UsuarioContext';
import PilaEntrada from './PilaEntrada';
import PilaPrincipal from './Pila';

const crear = ({ C }) => ({
  espera: {
    flex: 1,
    backgroundColor: C.crema,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Único punto que decide qué ve el usuario al abrir la app.
export default function Raiz() {
  const { hidratado, onboardingListo } = useUsuario();
  const est = useEstilos(crear);

  // Mientras se lee el disco. Sin esto, el onboarding parpadea en cada arranque.
  if (!hidratado) {
    return (
      <View style={est.espera}>
        <Latido size={48} />
      </View>
    );
  }

  return onboardingListo ? <PilaPrincipal /> : <PilaEntrada />;
}
