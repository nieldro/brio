import { View } from 'react-native';

import { useEstilos } from '../state/TemaContext';
import Latido from '../components/Latido';
import Marca from '../components/Marca';
import { useUsuario } from '../state/UsuarioContext';
import PilaEntrada from './PilaEntrada';
import PilaPrincipal from './Pila';

const crear = ({ C, S }) => ({
  espera: {
    flex: 1,
    backgroundColor: C.crema,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marca: {
    marginTop: -S.xl,
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
        {/* La chispa late arriba y la marca queda debajo: es lo primero que
            se ve al abrir la app, y hasta ahora ahí no había marca ninguna. */}
        <Latido size={128} marca />
        <Marca size={30} conLema conLogo={false} style={est.marca} />
      </View>
    );
  }

  return onboardingListo ? <PilaPrincipal /> : <PilaEntrada />;
}
