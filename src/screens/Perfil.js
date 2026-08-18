import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';

import { useEstilos, useTema, PREFERENCIAS, NOMBRES_PREFERENCIA } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import SelectorHora from '../components/SelectorHora';
import { useUsuario } from '../state/UsuarioContext';
import { pedirPermisoYToken, hayModuloPush } from '../lib/notificaciones';

const OBJETIVOS = ['Perder peso', 'Ganar músculo', 'Sentirme mejor', 'Crear el hábito'];
const LUGARES = ['En casa', 'En el gym', 'Mezclado'];
const TIEMPOS = [10, 20, 30, 45];

const NUMEROS = [
  { clave: 'edad', etiqueta: 'Edad', sufijo: 'años' },
  { clave: 'estatura', etiqueta: 'Estatura', sufijo: 'cm' },
  { clave: 'peso', etiqueta: 'Peso', sufijo: 'kg' },
];

const crear = ({ C, T, R, S, RELLENO }) => ({
  contenido: {
    paddingTop: S.lg,
  },
  campo: {
    ...T.subtitulo,
    fontSize: 16,
    marginTop: S.lg,
    marginBottom: S.sm,
  },
  entrada: {
    ...T.cuerpo,
    backgroundColor: C.crema,
    borderRadius: R.chico,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
  },
  filaNumero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.crema,
    borderRadius: R.chico,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    marginTop: S.md,
  },
  etiquetaNumero: {
    ...T.cuerpo,
    flex: 1,
  },
  entradaNumero: {
    ...T.cuerpo,
    fontWeight: '700',
    minWidth: 54,
    textAlign: 'right',
    paddingVertical: S.sm,
  },
  sufijo: {
    ...T.secundario,
    width: 34,
  },
  nota: {
    ...T.secundario,
    marginTop: S.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
  },
  chip: {
    backgroundColor: C.crema,
    borderRadius: R.pildora,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingVertical: S.sm + 2,
    paddingHorizontal: S.lg,
  },
  chipElegido: {
    borderColor: RELLENO.coral,
    backgroundColor: RELLENO.coral,
  },
  chipTexto: {
    ...T.secundario,
    color: C.cafe,
    fontWeight: '600',
  },
  chipTextoElegido: {
    color: '#FFFFFF',
  },
  pie: {
    ...T.secundario,
    marginTop: S.lg,
  },
  activar: {
    marginTop: S.lg,
  },
  aviso: {
    ...T.cuerpo,
    // El salvia de marca sobre crema daba 2,25:1: ilegible para mucha gente.
    color: C.salviaTexto,
    textAlign: 'center',
  },
  salir: {
    alignItems: 'center',
    paddingVertical: S.md,
  },
  salirTexto: {
    ...T.cuerpo,
    color: C.gris,
    fontWeight: '600',
  },
  legal: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
    marginTop: S.sm,
  },
});

function Opciones({ valores, valor, onElegir, etiquetaDe = (v) => String(v), est }) {
  return (
    <View style={est.chips}>
      {valores.map((v) => {
        const elegido = v === valor;
        return (
          <Pressable
            key={String(v)}
            onPress={() => onElegir(v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: elegido }}
            style={[est.chip, elegido && est.chipElegido]}
          >
            <Text style={[est.chipTexto, elegido && est.chipTextoElegido]}>{etiquetaDe(v)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Perfil({ navigation }) {
  const est = useEstilos(crear);
  const { C, preferencia, cambiarPreferencia } = useTema();
  const { perfil, actualizarPerfil, reiniciar, sesion, correo } = useUsuario();

  const [borrador, setBorrador] = useState({
    ...perfil,
    edad: perfil.edad != null ? String(perfil.edad) : '',
    estatura: perfil.estatura != null ? String(perfil.estatura) : '',
    peso: perfil.peso != null ? String(perfil.peso) : '',
  });
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cambiar = (clave, valor) => setBorrador((b) => ({ ...b, [clave]: valor }));

  const guardar = async () => {
    setGuardando(true);
    await actualizarPerfil({
      ...borrador,
      edad: borrador.edad ? Number(borrador.edad) : null,
      estatura: borrador.estatura ? Number(borrador.estatura) : null,
      peso: borrador.peso ? Number(borrador.peso) : null,
    });
    setGuardando(false);
    setAviso('Listo, ya lo tengo.');
    setTimeout(() => setAviso(null), 2500);
  };

  const activarRecordatorios = async () => {
    // En Expo Go para Android no existe el módulo de push. Se dice claro,
    // en vez de dejar al usuario buscando un permiso que no va a encontrar.
    if (!hayModuloPush()) {
      setAviso('Los recordatorios llegan en la app instalada, no en Expo Go.');
      setTimeout(() => setAviso(null), 4000);
      return;
    }

    const token = await pedirPermisoYToken();
    if (!token) {
      setAviso('No se pudo activar. Revisa los permisos del teléfono.');
      setTimeout(() => setAviso(null), 3000);
      return;
    }

    // Se guarda YA, no solo en el borrador. Antes decía "activados" y el
    // token moría al salir de Perfil sin tocar "Guardar cambios": el usuario
    // creía tener recordatorios y no le llegaba ninguno.
    cambiar('push_token', token);
    await actualizarPerfil({ push_token: token });

    setAviso('Recordatorios activados.');
    setTimeout(() => setAviso(null), 3000);
  };

  // No hace falta navegar: al reiniciar, `onboardingListo` vuelve a false
  // y Raiz cambia el árbol entero al onboarding.
  const cerrarSesion = () => reiniciar();

  // Sin cuenta no hay a dónde volver: esto borra todo de verdad. Se ofrece
  // igual, porque esconderlo deja a la persona sin salida, pero con el
  // nombre correcto y una confirmación que dice qué se pierde.
  const empezarDeCero = () => {
    Alert.alert(
      'Empezar de cero',
      'Se borra tu racha, tu plan y tu diario. Como no tienes cuenta, esto no se puede deshacer.',
      [
        { text: 'Mejor no', style: 'cancel' },
        { text: 'Borrar todo', style: 'destructive', onPress: () => reiniciar() },
      ],
    );
  };

  return (
    <Pantalla contentStyle={est.contenido}>
      <Tarjeta>
        <Etiqueta>tus datos</Etiqueta>

        <Text style={est.campo}>¿Cómo te llamo?</Text>
        <TextInput
          value={borrador.nombre}
          onChangeText={(t) => cambiar('nombre', t)}
          placeholder="Tu nombre"
          placeholderTextColor={C.apagado}
          style={est.entrada}
          autoCapitalize="words"
        />

        {NUMEROS.map((n) => (
          <View key={n.clave} style={est.filaNumero}>
            <Text style={est.etiquetaNumero}>{n.etiqueta}</Text>
            <TextInput
              value={borrador[n.clave]}
              onChangeText={(t) => cambiar(n.clave, t.replace(/[^0-9]/g, ''))}
              placeholder="—"
              placeholderTextColor={C.apagado}
              keyboardType="number-pad"
              maxLength={3}
              style={est.entradaNumero}
            />
            <Text style={est.sufijo}>{n.sufijo}</Text>
          </View>
        ))}

        <Text style={est.nota}>Este número no te define. Solo me calibra.</Text>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>tu plan</Etiqueta>

        <Text style={est.campo}>¿Qué buscas?</Text>
        <Opciones
          valores={OBJETIVOS}
          valor={borrador.objetivo}
          onElegir={(v) => cambiar('objetivo', v)}
          est={est}
        />

        <Text style={est.campo}>¿Dónde entrenas?</Text>
        <Opciones
          valores={LUGARES}
          valor={borrador.lugar}
          onElegir={(v) => cambiar('lugar', v)}
          est={est}
        />

        <Text style={est.campo}>¿Cuánto tiempo tienes al día?</Text>
        <Opciones
          valores={TIEMPOS}
          valor={borrador.tiempo_min}
          onElegir={(v) => cambiar('tiempo_min', v)}
          etiquetaDe={(v) => `${v} min`}
          est={est}
        />

        <Text style={est.pie}>Los cambios entran en el plan de la próxima semana.</Text>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>tu cuenta</Etiqueta>
        {sesion === 'concuenta' ? (
          <>
            <Text style={est.campo}>{correo}</Text>
            <Text style={est.pie}>
              Tu progreso está guardado. Entra con este correo en cualquier teléfono.
            </Text>
          </>
        ) : (
          <>
            <Text style={est.campo}>Todavía sin cuenta</Text>
            <Text style={est.pie}>
              Hoy tu racha vive solo en este teléfono. Con una cuenta te sigue a donde vayas.
            </Text>
            <Boton
              variante="suave"
              onPress={() => navigation.navigate('Cuenta', { modo: 'crear' })}
              style={est.activar}
            >
              Guardar mi cuenta
            </Boton>
          </>
        )}
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>cómo se ve</Etiqueta>
        <Text style={est.campo}>Apariencia</Text>
        <Opciones
          valores={PREFERENCIAS}
          valor={preferencia}
          onElegir={cambiarPreferencia}
          etiquetaDe={(p) => NOMBRES_PREFERENCIA[p]}
          est={est}
        />
        <Text style={est.pie}>El cambio se ve de inmediato y se recuerda.</Text>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>tu recordatorio</Etiqueta>
        <SelectorHora
          valor={borrador.hora_recordatorio}
          onChange={(v) => cambiar('hora_recordatorio', v)}
        />

        {!borrador.push_token && (
          <Boton variante="suave" onPress={activarRecordatorios} style={est.activar}>
            Activar recordatorios
          </Boton>
        )}
      </Tarjeta>

      {!!aviso && <Text style={est.aviso}>{aviso}</Text>}

      <Boton onPress={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </Boton>

      {/* Con cuenta es reversible y se llama cerrar sesión. Sin cuenta es
          irreversible, así que se llama por su nombre y pide confirmación. */}
      {sesion === 'concuenta' ? (
        <Pressable onPress={cerrarSesion} accessibilityRole="button" style={est.salir}>
          <Text style={est.salirTexto}>Cerrar sesión</Text>
        </Pressable>
      ) : (
        <Pressable onPress={empezarDeCero} accessibilityRole="button" style={est.salir}>
          <Text style={est.salirTexto}>Empezar de cero</Text>
        </Pressable>
      )}

      <Text style={est.legal}>
        Brío acompaña, no diagnostica. Ante dolor, lesión o enfermedad, consulta a un profesional.
      </Text>
    </Pantalla>
  );
}
