import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

import { C, S, R, T } from '../theme';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import SelectorHora from '../components/SelectorHora';
import { useUsuario } from '../state/UsuarioContext';
import { pedirPermisoYToken } from '../lib/notificaciones';

const OBJETIVOS = ['Perder peso', 'Ganar músculo', 'Sentirme mejor', 'Crear el hábito'];
const LUGARES = ['En casa', 'En el gym', 'Mezclado'];
const TIEMPOS = [10, 20, 30, 45];

const NUMEROS = [
  { clave: 'edad', etiqueta: 'Edad', sufijo: 'años' },
  { clave: 'estatura', etiqueta: 'Estatura', sufijo: 'cm' },
  { clave: 'peso', etiqueta: 'Peso', sufijo: 'kg' },
];

function Opciones({ valores, valor, onElegir, etiquetaDe = (v) => String(v) }) {
  return (
    <View style={styles.chips}>
      {valores.map((v) => {
        const elegido = v === valor;
        return (
          <Pressable
            key={String(v)}
            onPress={() => onElegir(v)}
            style={[styles.chip, elegido && styles.chipElegido]}
          >
            <Text style={[styles.chipTexto, elegido && styles.chipTextoElegido]}>
              {etiquetaDe(v)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Perfil() {
  const { perfil, actualizarPerfil, reiniciar } = useUsuario();

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
    const token = await pedirPermisoYToken();
    if (token) {
      cambiar('push_token', token);
      setAviso('Recordatorios activados.');
    } else {
      setAviso('No se pudo activar. Revisa los permisos del teléfono.');
    }
    setTimeout(() => setAviso(null), 3000);
  };

  // No hace falta navegar: al reiniciar, `onboardingListo` vuelve a false
  // y Raiz cambia el árbol entero al onboarding.
  const cerrarSesion = () => reiniciar();

  return (
    <Pantalla contentStyle={styles.contenido}>
      <Tarjeta>
        <Etiqueta>tus datos</Etiqueta>

        <Text style={styles.campo}>¿Cómo te llamo?</Text>
        <TextInput
          value={borrador.nombre}
          onChangeText={(t) => cambiar('nombre', t)}
          placeholder="Tu nombre"
          placeholderTextColor={C.apagado}
          style={styles.entrada}
          autoCapitalize="words"
        />

        {NUMEROS.map((n) => (
          <View key={n.clave} style={styles.filaNumero}>
            <Text style={styles.etiquetaNumero}>{n.etiqueta}</Text>
            <TextInput
              value={borrador[n.clave]}
              onChangeText={(t) => cambiar(n.clave, t.replace(/[^0-9]/g, ''))}
              placeholder="—"
              placeholderTextColor={C.apagado}
              keyboardType="number-pad"
              maxLength={3}
              style={styles.entradaNumero}
            />
            <Text style={styles.sufijo}>{n.sufijo}</Text>
          </View>
        ))}

        <Text style={styles.nota}>Este número no te define. Solo me calibra.</Text>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>tu plan</Etiqueta>

        <Text style={styles.campo}>¿Qué buscas?</Text>
        <Opciones
          valores={OBJETIVOS}
          valor={borrador.objetivo}
          onElegir={(v) => cambiar('objetivo', v)}
        />

        <Text style={styles.campo}>¿Dónde entrenas?</Text>
        <Opciones valores={LUGARES} valor={borrador.lugar} onElegir={(v) => cambiar('lugar', v)} />

        <Text style={styles.campo}>¿Cuánto tiempo tienes al día?</Text>
        <Opciones
          valores={TIEMPOS}
          valor={borrador.tiempo_min}
          onElegir={(v) => cambiar('tiempo_min', v)}
          etiquetaDe={(v) => `${v} min`}
        />

        <Text style={styles.pie}>Los cambios entran en el plan de la próxima semana.</Text>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>tu recordatorio</Etiqueta>
        <SelectorHora
          valor={borrador.hora_recordatorio}
          onChange={(v) => cambiar('hora_recordatorio', v)}
        />

        {!borrador.push_token && (
          <Boton variante="suave" onPress={activarRecordatorios} style={styles.activar}>
            Activar recordatorios
          </Boton>
        )}
      </Tarjeta>

      {!!aviso && <Text style={styles.aviso}>{aviso}</Text>}

      <Boton onPress={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </Boton>

      <Pressable onPress={cerrarSesion} accessibilityRole="button" style={styles.salir}>
        <Text style={styles.salirTexto}>Cerrar sesión</Text>
      </Pressable>

      <Text style={styles.legal}>
        Brío acompaña, no diagnostica. Ante dolor, lesión o enfermedad, consulta a un profesional.
      </Text>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
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
    borderColor: C.coral,
    backgroundColor: C.coral,
  },
  chipTexto: {
    ...T.secundario,
    color: C.cafe,
    fontWeight: '600',
  },
  chipTextoElegido: {
    color: C.blanco,
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
    color: C.salvia,
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
