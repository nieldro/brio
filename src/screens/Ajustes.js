import { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';

import { useEstilos, useTema, PREFERENCIAS, NOMBRES_PREFERENCIA } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import { useAlbum } from '../state/useAlbum';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';
import Marca from '../components/Marca';
import Aparece from '../components/Aparece';
import Interruptor from '../components/Interruptor';
import SelectorHora from '../components/SelectorHora';
import { borrarAlbum } from '../lib/album';
import { hayModuloPush, pedirPermisoYToken } from '../lib/notificaciones';
import { planDemo } from '../data/planDemo';
import { diaDelPlan } from '../services/plan';
// El MISMO módulo que usa el Timer del servidor para escribir el aviso. Se
// importa en vez de copiarse: dos versiones del mismo texto se separan, y
// entonces la vista previa miente sobre lo que de verdad va a llegar.
import { textoRecordatorio } from '../../azure-functions/src/lib/recordatorio';

const crear = ({ C, T, R, S }) => ({
  contenido: {
    paddingTop: S.lg,
  },
  titulo: {
    ...T.saludo,
    fontSize: 28,
    lineHeight: 36,
  },
  campo: {
    ...T.subtitulo,
    marginTop: S.md,
  },
  pie: {
    ...T.secundario,
    marginTop: S.sm,
  },
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    marginTop: S.md,
  },
  opcion: {
    borderRadius: R.pildora,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingVertical: S.sm + 2,
    paddingHorizontal: S.lg,
  },
  opcionElegida: {
    borderColor: C.coral,
    backgroundColor: C.coralSuave,
  },
  opcionTexto: {
    ...T.secundario,
    fontWeight: '700',
    color: C.gris,
  },
  opcionTextoElegida: {
    color: C.coralTexto,
  },
  accion: {
    marginTop: S.lg,
  },
  previa: {
    backgroundColor: C.crema,
    borderRadius: R.chico,
    borderLeftWidth: 4,
    borderLeftColor: C.coral,
    padding: S.md,
    marginTop: S.sm,
    gap: 2,
  },
  previaTitulo: {
    ...T.subtitulo,
    fontSize: 15,
  },
  previaCuerpo: {
    ...T.secundario,
  },
  peligro: {
    alignItems: 'center',
    paddingVertical: S.md,
  },
  peligroTexto: {
    ...T.secundario,
    color: C.rojoTexto,
    fontWeight: '700',
  },
  aviso: {
    ...T.secundario,
    textAlign: 'center',
  },
  cierre: {
    alignItems: 'center',
    gap: S.sm,
    marginTop: S.xl,
  },
  version: {
    ...T.secundario,
    fontSize: 13,
  },
});

function Opciones({ valores, valor, onElegir, etiquetaDe, est }) {
  return (
    <View style={est.fila}>
      {valores.map((v) => {
        const elegida = v === valor;
        return (
          <Pressable
            key={String(v)}
            onPress={() => onElegir(v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: elegida }}
            style={[est.opcion, elegida && est.opcionElegida]}
          >
            <Text style={[est.opcionTexto, elegida && est.opcionTextoElegida]}>
              {etiquetaDe ? etiquetaDe(v) : v}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Ajustes: cómo se ve, cuándo te hablo, y qué pasa con tus datos.
//
// Vive aparte de Perfil a propósito. Perfil son TUS DATOS, los que arman el
// plan. Esto son las decisiones sobre la app. Mezclarlos hacía una pantalla
// larguísima donde el color de fondo y tu peso vivían en la misma lista.
export default function Ajustes({ navigation }) {
  const est = useEstilos(crear);
  const { preferencia, cambiarPreferencia } = useTema();
  const {
    perfil,
    actualizarPerfil,
    sesion,
    correo,
    userId,
    reiniciar,
    plan,
    hoy,
    completadoHoy,
    nutricionDetallada,
    verNutricionDetallada,
  } = useUsuario();
  const { estado: album, setFotos } = useAlbum();

  const [aviso, setAviso] = useState(null);

  // El aviso que el servidor mandaría ahora mismo, con los datos de hoy.
  const aviso_previa = useMemo(
    () =>
      textoRecordatorio({
        nombre: perfil.nombre,
        dia: diaDelPlan(plan ?? planDemo, hoy),
        completadoHoy,
      }),
    [perfil.nombre, plan, hoy, completadoHoy],
  );

  const decir = (texto, ms = 3000) => {
    setAviso(texto);
    setTimeout(() => setAviso(null), ms);
  };

  const cambiarHora = (hora) => actualizarPerfil({ hora_recordatorio: hora });

  const activarRecordatorios = async () => {
    if (!hayModuloPush()) {
      decir('Los recordatorios llegan en la app instalada, no en Expo Go.', 4000);
      return;
    }
    const token = await pedirPermisoYToken();
    if (!token) {
      decir('No se pudo activar. Revisa los permisos del teléfono.');
      return;
    }
    await actualizarPerfil({ push_token: token });
    decir('Recordatorios activados.');
  };

  const borrarFotos = () => {
    Alert.alert(
      'Borrar tus fotos',
      'Se borran las de este teléfono y no hay copia en ningún otro lado. Esto no se puede deshacer.',
      [
        { text: 'Mejor no', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await borrarAlbum(userId);
            setFotos([]);
            decir('Listo, ya no están.');
          },
        },
      ],
    );
  };

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
      <Aparece orden={0}>
        <Text style={est.titulo}>Ajustes</Text>
      </Aparece>

      <Aparece orden={1}>
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
      </Aparece>

      <Aparece orden={2}>
        <Tarjeta>
          <Etiqueta>cuándo te hablo</Etiqueta>
          <Text style={est.campo}>Tu hora</Text>
          <SelectorHora valor={perfil.hora_recordatorio} onChange={cambiarHora} />
          <Text style={est.pie}>Máximo dos mensajes al día. Nunca a otra hora.</Text>

          {!perfil.push_token && (
            <Boton variante="suave" onPress={activarRecordatorios} style={est.accion}>
              Activar recordatorios
            </Boton>
          )}

          {/* Lo que de verdad va a llegar, escrito por el mismo código del
              servidor. Sin esto no había forma de comprobar el recordatorio
              hasta tener la app instalada, y quedaba como un entregable a
              ciegas. */}
          <Text style={est.campo}>Así se va a ver</Text>
          {aviso_previa ? (
            <View style={est.previa}>
              <Text style={est.previaTitulo}>{aviso_previa.titulo}</Text>
              <Text style={est.previaCuerpo}>{aviso_previa.cuerpo}</Text>
            </View>
          ) : (
            <Text style={est.pie}>
              Hoy no te voy a escribir: ya marcaste tu día. Un recordatorio de más molesta más de
              lo que ayuda.
            </Text>
          )}

          {!hayModuloPush() && (
            <Text style={est.pie}>
              En Expo Go no llegan notificaciones. Llegan en la app instalada, a la hora que
              elegiste.
            </Text>
          )}
        </Tarjeta>
      </Aparece>

      {/* Apagado por defecto y encendido a mano, nunca al revés. Quien viene
          de contar calorías y lo dejó no tiene que volver a verlas por haber
          abierto la cámara. */}
      <Aparece orden={3}>
        <Tarjeta>
          <Etiqueta>al mirar un plato</Etiqueta>
          <Interruptor
            titulo="Estimación de energía"
            sub="Con niveles de proteína, grasas y fibra"
            valor={nutricionDetallada}
            onCambiar={verNutricionDetallada}
          />
          <Text style={est.pie}>
            {nutricionDetallada
              ? 'Sale como rango, porque de una foto no salen cifras exactas. No se guarda ni se suma en ningún lado: no es una métrica de Brío.'
              : 'Verás el semáforo y una cosa para sumarle. Sin números.'}
          </Text>
        </Tarjeta>
      </Aparece>

      <Aparece orden={4}>
        <Tarjeta>
          <Etiqueta>tu cuenta</Etiqueta>
          {sesion === 'concuenta' ? (
            <>
              <Text style={est.campo}>{correo}</Text>
              <Text style={est.pie}>
                Tu progreso está guardado. Entra con este correo en cualquier teléfono.
              </Text>
              <Boton variante="suave" onPress={() => reiniciar()} style={est.accion}>
                Cerrar sesión
              </Boton>
            </>
          ) : (
            <>
              <Text style={est.campo}>Todavía sin cuenta</Text>
              <Text style={est.pie}>
                Hoy tu racha vive solo en este teléfono. Con una cuenta te sigue a donde vayas.
              </Text>
              <Boton
                onPress={() => navigation.navigate('Cuenta', { modo: 'crear' })}
                style={est.accion}
              >
                Guardar mi cuenta
              </Boton>
            </>
          )}
        </Tarjeta>
      </Aparece>

      <Aparece orden={5}>
        <Tarjeta>
          <Etiqueta>tus datos</Etiqueta>
          <Text style={est.campo}>
            {album.total === 0
              ? 'No tienes fotos guardadas'
              : `${album.total} ${album.total === 1 ? 'foto guardada' : 'fotos guardadas'}`}
          </Text>
          <Text style={est.pie}>
            Tus fotos viven solo en este teléfono. No se suben a ningún servidor y yo no las veo.
          </Text>

          {album.total > 0 && (
            <Pressable onPress={borrarFotos} accessibilityRole="button" style={est.peligro}>
              <Text style={est.peligroTexto}>Borrar mis fotos</Text>
            </Pressable>
          )}

          {sesion !== 'concuenta' && (
            <Pressable onPress={empezarDeCero} accessibilityRole="button" style={est.peligro}>
              <Text style={est.peligroTexto}>Empezar de cero</Text>
            </Pressable>
          )}
        </Tarjeta>
      </Aparece>

      {!!aviso && <Text style={est.aviso}>{aviso}</Text>}

      <View style={est.cierre}>
        <Marca size={22} conLogo={false} />
        <Text style={est.version}>Brío 1.0</Text>
      </View>
    </Pantalla>
  );
}
