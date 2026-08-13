import { useUsuario } from '../state/UsuarioContext';
import Onboarding from '../screens/onboarding/Onboarding';
import Tabs from './Tabs';

// Único punto que decide qué ve el usuario al abrir la app.
export default function Raiz() {
  const { onboardingListo } = useUsuario();
  return onboardingListo ? <Tabs /> : <Onboarding />;
}
