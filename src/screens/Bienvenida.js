import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEstilos } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import Marca from '../components/Marca';
import Boton from '../components/Boton';
import Aparece from '../components/Aparece';
import { entrarConGoogle, hayCuentas } from '../lib/auth';

const crear = ({ C, T, S }) => ({
  pantalla: {
    flex: 1,
    backgroundColor: C.crema,
    paddingHorizontal: S.xl,
    justifyContent: 'space-between',
  },
  arriba: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.lg,
  },
  frase: {
    ...T.cuerpo,
    color: C.gris,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 27,
    maxWidth: 300,
  },
  acciones: {
    gap: S.md,
  },
  aviso: {
    ...T.secundario,
    color: C.rojoTexto,
    textAlign: 'center',
  },
  enlace: {
    alignItems: 'center',
    paddingVertical: S.md,
  },
  enlaceTexto: {
    ...T.cuerpo,
    color: C.coralTexto,
    fontWeight: '700',
  },
  nota: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: S.sm,
  },
});

// La primera pantalla de Brío.
//
// Antes lo primero era el paso 1 del onboarding, y entrar con una cuenta que
// ya existía era un enlace pequeño debajo del botón. Quien cerraba sesión no
// encontraba por dónde volver y terminaba rehaciendo el onboarding entero.
//
// Aquí las tres puertas se ven a la vez. Y la de arriba sigue siendo empezar
// sin cuenta, porque la regla del producto no cambió: la cuenta sirve para no
// perder la racha al cambiar de teléfono, nunca es un muro para arrancar.
export default function Bienvenida({ navigation }) {
  const est = useEstilos(crear);
  const insets = useSafeAreaInsets();
  const { refrescarSesion } = useUsuario();

  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);

  const conGoogle = async () => {
    setOcupado(true);
    setError(null);

    // Aquí nadie ha construido nada todavía: no hay racha que proteger.
    const r = await entrarConGoogle({ hayDatosQuePerder: false });

    setOcupado(false);
    if (r.cancelado) return; // cerrar el navegador a medias no es un error
    if (!r.ok) {
      setError(r.error);
      return;
    }
    await refrescarSesion();
  };

  return (
    <View style={[est.pantalla, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 }]}>
      <Aparece orden={0} style={est.arriba}>
        <Marca size={46} conLema />
        <Text style={est.frase}>No vengo a exigirte. Vengo a acompañarte.</Text>
      </Aparece>

      <Aparece orden={2} style={est.acciones}>
        {!!error && <Text style={est.aviso}>{error}</Text>}

        <Boton onPress={() => navigation.navigate('Onboarding')} disabled={ocupado}>
          Empezar ahora
        </Boton>

        {hayCuentas() && (
          <>
            <Boton variante="suave" onPress={conGoogle} disabled={ocupado}>
              {ocupado ? 'Un momento…' : 'Continuar con Google'}
            </Boton>

            <Pressable
              onPress={() => navigation.navigate('Cuenta', { modo: 'entrar' })}
              accessibilityRole="button"
              style={est.enlace}
            >
              <Text style={est.enlaceTexto}>Ya tengo cuenta</Text>
            </Pressable>
          </>
        )}

        <Text style={est.nota}>
          Puedes empezar sin cuenta. Sirve para que tu racha te siga si cambias de teléfono.
        </Text>
      </Aparece>
    </View>
  );
}
