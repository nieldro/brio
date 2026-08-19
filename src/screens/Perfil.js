import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import { useUsuario } from '../state/UsuarioContext';

// Se guardan sin tilde y en minúscula, que es como las lee el servidor.
// La etiqueta es lo que ve la persona.
const ZONAS = [
  { clave: 'piernas', etiqueta: 'Piernas' },
  { clave: 'gluteos', etiqueta: 'Glúteos' },
  { clave: 'pecho', etiqueta: 'Pecho' },
  { clave: 'espalda', etiqueta: 'Espalda' },
  { clave: 'brazos', etiqueta: 'Brazos' },
  { clave: 'hombros', etiqueta: 'Hombros' },
  { clave: 'centro', etiqueta: 'Abdomen' },
];

const OBJETIVOS = ['Perder peso', 'Ganar músculo', 'Sentirme mejor', 'Crear el hábito'];
const LUGARES = ['En casa', 'En el gym', 'Mezclado'];
const TIEMPOS = [20, 30, 45, 60, 90, 120];

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
  const { C } = useTema();
  const { perfil, actualizarPerfil } = useUsuario();

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

      {/* Elegir zonas filtra SOLO los ejercicios de fuerza. El calentamiento,
          el cardio y el cierre siguen igual: un plan de "solo brazos" que
          además no calienta ni estira no es personalización, es un plan malo. */}
      <Tarjeta>
        <Etiqueta>qué quieres trabajar</Etiqueta>
        <Text style={est.campo}>Puedes elegir varias, o ninguna</Text>

        <View style={est.chips}>
          {ZONAS.map((z) => {
            const elegida = (borrador.zonas ?? []).includes(z.clave);
            return (
              <Pressable
                key={z.clave}
                onPress={() =>
                  cambiar(
                    'zonas',
                    elegida
                      ? (borrador.zonas ?? []).filter((c) => c !== z.clave)
                      : [...(borrador.zonas ?? []), z.clave],
                  )
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: elegida }}
                style={[est.chip, elegida && est.chipElegido]}
              >
                <Text style={[est.chipTexto, elegida && est.chipTextoElegido]}>
                  {z.etiqueta}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={est.pie}>
          {(borrador.zonas ?? []).length === 0
            ? 'Sin elegir nada, trabajamos el cuerpo entero.'
            : 'Aun así, una vez por semana movemos todo: entrenar una sola zona desequilibra.'}
        </Text>
      </Tarjeta>

      {!!aviso && <Text style={est.aviso}>{aviso}</Text>}

      <Boton onPress={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </Boton>

      {/* La cuenta, la apariencia, los recordatorios y el borrado viven en
          Ajustes. Aquí solo están TUS DATOS, los que arman el plan: tenerlo
          todo junto hacía una pantalla donde el color de fondo y tu peso
          estaban en la misma lista. */}
      <Pressable
        onPress={() => navigation.navigate('Ajustes')}
        accessibilityRole="button"
        style={est.salir}
      >
        <Text style={est.salirTexto}>Ajustes de la app</Text>
      </Pressable>

      <Text style={est.legal}>
        Brío acompaña, no diagnostica. Ante dolor, lesión o enfermedad, consulta a un profesional.
      </Text>
    </Pantalla>
  );
}
