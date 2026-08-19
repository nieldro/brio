import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEstilos, useTema } from '../state/TemaContext';
import Boton from '../components/Boton';
import { useUsuario } from '../state/UsuarioContext';
import {
  crearCuenta,
  entrar,
  recuperarClave,
  entrarConGoogle,
  confirmarCorreo,
  reenviarCodigo,
  LARGO_CODIGO,
} from '../lib/auth';
import {
  revisarCorreo,
  revisarClave,
  revisarConfirmacion,
  listoParaEntrar,
  listoParaCrear,
} from '../services/credenciales';

const crear = ({ C, T, R, S }) => ({
  pantalla: {
    flex: 1,
    backgroundColor: C.crema,
  },
  contenido: {
    paddingHorizontal: S.xl,
    paddingBottom: S.xxl,
    gap: S.md,
  },
  titulo: {
    ...T.saludo,
    fontSize: 30,
    lineHeight: 40,
  },
  sub: {
    ...T.cuerpo,
    color: C.gris,
    marginBottom: S.md,
  },
  campo: {
    ...T.secundario,
    fontWeight: '600',
    marginTop: S.md,
    marginBottom: S.xs,
  },
  entrada: {
    ...T.cuerpo,
    backgroundColor: C.blanco,
    borderRadius: R.medio,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingHorizontal: S.lg,
    paddingVertical: S.lg,
  },
  entradaMal: {
    borderColor: C.rojo,
  },
  codigo: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
  },
  ayuda: {
    ...T.secundario,
    // El rojo del semáforo sirve para un punto, no para texto: daba 3,1:1.
    color: C.rojoTexto,
    marginTop: S.xs,
  },
  aviso: {
    ...T.cuerpo,
    backgroundColor: C.blanco,
    borderRadius: R.medio,
    borderWidth: 1,
    borderColor: C.borde,
    padding: S.lg,
    marginTop: S.md,
  },
  avisoBien: {
    borderColor: C.salvia,
  },
  accion: {
    marginTop: S.xl,
  },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginVertical: S.lg,
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: C.borde,
  },
  oTexto: {
    ...T.secundario,
  },
  enlace: {
    alignItems: 'center',
    paddingVertical: S.md,
  },
  enlaceTexto: {
    ...T.cuerpo,
    color: C.coralTexto,
    fontWeight: '600',
  },
  nota: {
    ...T.secundario,
    marginTop: S.lg,
    textAlign: 'center',
  },
});

// Una sola pantalla con dos modos. La cuenta nunca es obligatoria: sirve para
// no perder la racha al cambiar de teléfono.
export default function Cuenta({ route, navigation }) {
  const modoInicial = route?.params?.modo === 'entrar' ? 'entrar' : 'crear';

  const est = useEstilos(crear);
  const { C } = useTema();
  const insets = useSafeAreaInsets();
  const { puedeGuardarCuenta, refrescarSesion, onboardingListo, diasCompletados } = useUsuario();

  // Entrar con Google crea un usuario nuevo si Supabase no puede enlazarlo al
  // que ya existe. Saber si hay algo construido decide si eso se permite o si
  // se le ofrece el correo, que sí conserva la racha.
  const hayDatosQuePerder = onboardingListo || diasCompletados.length > 0;

  const [modo, setModo] = useState(modoInicial);
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [tocado, setTocado] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);
  const [logrado, setLogrado] = useState(null);

  // Cuando Supabase pide confirmar el correo, la pantalla cambia entera: ya
  // no se está creando una cuenta, se está esperando un código.
  const [esperandoCodigo, setEsperandoCodigo] = useState(false);
  const [codigo, setCodigo] = useState('');

  const creando = modo === 'crear';

  // Los avisos solo aparecen después de que el usuario tocó el campo:
  // regañar mientras alguien escribe su correo es hostil.
  const malCorreo = tocado.correo ? revisarCorreo(correo) : null;
  const malClave = tocado.clave ? revisarClave(clave) : null;
  const malConfirmacion =
    creando && tocado.confirmacion ? revisarConfirmacion(clave, confirmacion) : null;

  const puedeSeguir = creando
    ? listoParaCrear({ correo, clave, confirmacion })
    : listoParaEntrar({ correo, clave });

  const cambiarModo = () => {
    setModo(creando ? 'entrar' : 'crear');
    setError(null);
    setLogrado(null);
    setTocado({});
  };

  const enviar = async () => {
    setOcupado(true);
    setError(null);

    const r = creando ? await crearCuenta(correo, clave) : await entrar(correo, clave);

    if (!r.ok) {
      setError(r.error);
      setOcupado(false);
      return;
    }

    if (r.faltaConfirmar) {
      setEsperandoCodigo(true);
      setLogrado(`Te mandé un código de ${LARGO_CODIGO} números a ${r.correo}.`);
      setOcupado(false);
      return;
    }

    await refrescarSesion();
    setOcupado(false);

    // Al entrar con una cuenta que ya tiene perfil, Raiz cambia el árbol
    // entero y esta pantalla se desmonta sola. Solo se vuelve atrás si
    // seguimos aquí, para no navegar sobre un navegador que ya murió.
    if (navigation.canGoBack()) navigation.goBack();
  };

  const conGoogle = async () => {
    setOcupado(true);
    setError(null);

    const r = await entrarConGoogle({ hayDatosQuePerder });

    setOcupado(false);
    // Cerrar el navegador a medias no es un error: no se dice nada.
    if (r.cancelado) return;
    if (!r.ok) {
      setError(r.error);
      return;
    }

    await refrescarSesion();
    if (navigation.canGoBack()) navigation.goBack();
  };

  const confirmar = async () => {
    setOcupado(true);
    setError(null);

    const r = await confirmarCorreo(correo, codigo);
    setOcupado(false);

    if (!r.ok) {
      setError(r.error);
      return;
    }

    await refrescarSesion();
    if (navigation.canGoBack()) navigation.goBack();
  };

  const otroCodigo = async () => {
    setOcupado(true);
    setError(null);

    const r = await reenviarCodigo(correo);
    setOcupado(false);

    if (r.ok) setLogrado('Listo, te mandé otro. Revisa también la carpeta de spam.');
    else setError(r.error);
  };

  const olvideLaClave = async () => {
    const mal = revisarCorreo(correo);
    if (mal) {
      setTocado((t) => ({ ...t, correo: true }));
      setError('Escribe tu correo y te mando el enlace.');
      return;
    }
    setOcupado(true);
    const r = await recuperarClave(correo);
    setOcupado(false);
    if (r.ok) setLogrado('Te mandé un enlace para cambiar la clave. Revisa tu correo.');
    else setError(r.error);
  };

  return (
    <KeyboardAvoidingView
      style={est.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[est.contenido, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Con el código pendiente, todo lo demás sobra: la persona ya dio
            sus datos y lo único que le falta es escribir seis números. */}
        {esperandoCodigo ? (
          <>
            <Text style={est.titulo}>Revisa tu correo.</Text>
            <Text style={est.sub}>
              Te llegó un código de {LARGO_CODIGO} números a {correo}. Escríbelo aquí y listo.
            </Text>

            <Text style={est.campo}>Tu código</Text>
            <TextInput
              value={codigo}
              onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, LARGO_CODIGO))}
              placeholder="000000"
              placeholderTextColor={C.apagado}
              style={[est.entrada, est.codigo]}
              keyboardType="number-pad"
              maxLength={LARGO_CODIGO}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoFocus
            />

            {!!error && <Text style={est.aviso}>{error}</Text>}
            {!!logrado && <Text style={[est.aviso, est.avisoBien]}>{logrado}</Text>}

            <Boton
              onPress={confirmar}
              disabled={codigo.length !== LARGO_CODIGO || ocupado}
              style={est.accion}
            >
              {ocupado ? 'Un momento…' : 'Confirmar'}
            </Boton>

            <Pressable onPress={otroCodigo} accessibilityRole="button" style={est.enlace}>
              <Text style={est.enlaceTexto}>Mándame otro código</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setEsperandoCodigo(false);
                setCodigo('');
                setError(null);
                setLogrado(null);
              }}
              accessibilityRole="button"
              style={est.enlace}
            >
              <Text style={est.enlaceTexto}>Me equivoqué de correo</Text>
            </Pressable>

            <Text style={est.nota}>
              Si no llega en unos minutos, mira en spam. A veces se demora.
            </Text>
          </>
        ) : (
          <>
        <Text style={est.titulo}>{creando ? 'Guarda tu cuenta.' : 'Bienvenido de vuelta.'}</Text>
        <Text style={est.sub}>
          {creando
            ? puedeGuardarCuenta
              ? 'Así no pierdes tu racha si cambias de teléfono. Todo lo que llevas se queda contigo.'
              : 'Con una cuenta tu progreso te sigue a cualquier teléfono.'
            : 'Entra y recuperas tu racha, tu plan y tu diario.'}
        </Text>

        <Text style={est.campo}>Tu correo</Text>
        <TextInput
          value={correo}
          onChangeText={setCorreo}
          onBlur={() => setTocado((t) => ({ ...t, correo: true }))}
          placeholder="nombre@correo.com"
          placeholderTextColor={C.apagado}
          style={[est.entrada, malCorreo && est.entradaMal]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        {!!malCorreo && <Text style={est.ayuda}>{malCorreo}</Text>}

        <Text style={est.campo}>Tu clave</Text>
        <TextInput
          value={clave}
          onChangeText={setClave}
          onBlur={() => setTocado((t) => ({ ...t, clave: true }))}
          placeholder={creando ? 'Mínimo 8 caracteres' : 'Tu clave'}
          placeholderTextColor={C.apagado}
          style={[est.entrada, malClave && est.entradaMal]}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={creando ? 'new-password' : 'current-password'}
          textContentType={creando ? 'newPassword' : 'password'}
        />
        {!!malClave && <Text style={est.ayuda}>{malClave}</Text>}

        {creando && (
          <>
            <Text style={est.campo}>Repítela</Text>
            <TextInput
              value={confirmacion}
              onChangeText={setConfirmacion}
              onBlur={() => setTocado((t) => ({ ...t, confirmacion: true }))}
              placeholder="La misma clave"
              placeholderTextColor={C.apagado}
              style={[est.entrada, malConfirmacion && est.entradaMal]}
              secureTextEntry
              autoCapitalize="none"
            />
            {!!malConfirmacion && <Text style={est.ayuda}>{malConfirmacion}</Text>}
          </>
        )}

        {!!error && <Text style={est.aviso}>{error}</Text>}
        {!!logrado && <Text style={[est.aviso, est.avisoBien]}>{logrado}</Text>}

        <Boton onPress={enviar} disabled={!puedeSeguir || ocupado} style={est.accion}>
          {ocupado ? 'Un momento…' : creando ? 'Crear mi cuenta' : 'Entrar'}
        </Boton>

        <View style={est.separador}>
          <View style={est.linea} />
          <Text style={est.oTexto}>o</Text>
          <View style={est.linea} />
        </View>

        <Boton variante="suave" onPress={conGoogle} disabled={ocupado}>
          Continuar con Google
        </Boton>

        {!creando && (
          <Pressable onPress={olvideLaClave} accessibilityRole="button" style={est.enlace}>
            <Text style={est.enlaceTexto}>Olvidé mi clave</Text>
          </Pressable>
        )}

        <Pressable onPress={cambiarModo} accessibilityRole="button" style={est.enlace}>
          <Text style={est.enlaceTexto}>
            {creando ? 'Ya tengo cuenta' : 'No tengo cuenta todavía'}
          </Text>
        </Pressable>

        {creando && puedeGuardarCuenta && (
          <Text style={est.nota}>
            No pierdes nada de lo que llevas. Tu racha y tu diario se quedan contigo.
          </Text>
        )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
