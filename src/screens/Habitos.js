import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { useEstilos } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Casilla from '../components/Casilla';
import Aparece from '../components/Aparece';
import {
  MAXIMO,
  catalogoDeHabitos,
  habitosElegidos,
  alternarElegido,
  estaHecho,
  avanceDeHoy,
  constancia,
  textoDeConstancia,
  frasePorAvance,
} from '../services/habitos';

const crear = ({ C, T, R, S }) => ({
  contenido: {
    paddingTop: S.lg,
  },
  titulo: {
    ...T.saludo,
    fontSize: 28,
    lineHeight: 36,
  },
  frase: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.sm,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },
  centro: {
    flex: 1,
  },
  texto: {
    ...T.subtitulo,
  },
  textoHecho: {
    color: C.gris,
  },
  constancia: {
    ...T.secundario,
    fontSize: 13,
    marginTop: 2,
  },
  tarjetaHecha: {
    opacity: 0.75,
  },
  vacio: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.md,
  },
  zona: {
    ...T.etiqueta,
    color: C.gris,
    marginTop: S.lg,
    marginBottom: S.sm,
  },
  opcion: {
    borderRadius: R.medio,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingVertical: S.md,
    paddingHorizontal: S.lg,
    marginBottom: S.sm,
  },
  opcionElegida: {
    borderColor: C.coral,
    backgroundColor: C.coralSuave,
  },
  opcionTexto: {
    ...T.cuerpo,
    color: C.cafe,
  },
  opcionApagada: {
    opacity: 0.45,
  },
  cambiar: {
    alignItems: 'center',
    paddingVertical: S.md,
  },
  cambiarTexto: {
    ...T.secundario,
    color: C.coralTexto,
    fontWeight: '700',
  },
  nota: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
  },
});

// Los hábitos: hasta tres cosas pequeñas que sostienen el resto.
//
// Sin racha por hábito, a propósito. Tres contadores más que pueden ponerse
// en cero el mismo día es exactamente lo que hace irse a quien ya abandonó
// otras apps. Lo que se muestra es cuántas veces se hizo en las últimas dos
// semanas: un número que sube y que fallar un día no toca.
export default function Habitos() {
  const est = useEstilos(crear);
  const { hoy, habitos, habitosHechos, elegirHabitos, marcarHabito } = useUsuario();

  const [eligiendo, setEligiendo] = useState(false);

  const mios = useMemo(() => habitosElegidos(habitos), [habitos]);
  const avance = useMemo(() => avanceDeHoy(habitos, habitosHechos, hoy), [habitos, habitosHechos, hoy]);
  const catalogo = useMemo(() => catalogoDeHabitos(), []);

  const mostrarElector = eligiendo || mios.length === 0;

  return (
    <Pantalla contentStyle={est.contenido}>
      <Aparece orden={0}>
        <View>
          <Text style={est.titulo}>Tus hábitos</Text>
          <Text style={est.frase}>{frasePorAvance(avance)}</Text>
        </View>
      </Aparece>

      {mios.map((h, i) => {
        const hecho = estaHecho(habitosHechos, h.clave, hoy);
        const veces = constancia(habitosHechos, h.clave, 14, hoy);

        return (
          <Aparece key={h.clave} orden={i + 1}>
            <Pressable
              onPress={() => marcarHabito(h.clave)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hecho }}
              accessibilityLabel={`${h.texto}, ${hecho ? 'hecho' : 'sin hacer'}`}
            >
              <Tarjeta style={hecho && est.tarjetaHecha}>
                <View style={est.fila}>
                  <Casilla marcada={hecho} size={32} />
                  <View style={est.centro}>
                    <Text style={[est.texto, hecho && est.textoHecho]}>{h.texto}</Text>
                    <Text style={est.constancia}>{textoDeConstancia(veces)}</Text>
                  </View>
                </View>
              </Tarjeta>
            </Pressable>
          </Aparece>
        );
      })}

      {mios.length > 0 && (
        <Pressable
          onPress={() => setEligiendo((v) => !v)}
          accessibilityRole="button"
          style={est.cambiar}
        >
          <Text style={est.cambiarTexto}>
            {eligiendo ? 'Listo' : 'Cambiar mis hábitos'}
          </Text>
        </Pressable>
      )}

      {mostrarElector && (
        <Aparece orden={mios.length + 1}>
          <Tarjeta>
            <Etiqueta>elige hasta {MAXIMO}</Etiqueta>
            <Text style={est.vacio}>
              {habitos.length >= MAXIMO
                ? 'Ya llevas tres. Suelta uno si quieres cambiarlo.'
                : 'Pocos y pequeños. Uno solo ya es suficiente para empezar.'}
            </Text>

            {catalogo.map((z) => (
              <View key={z.clave}>
                <Text style={est.zona}>{z.titulo}</Text>
                {z.habitos.map((h) => {
                  const elegido = habitos.includes(h.clave);
                  const lleno = habitos.length >= MAXIMO && !elegido;

                  return (
                    <Pressable
                      key={h.clave}
                      onPress={() => elegirHabitos(alternarElegido(habitos, h.clave))}
                      disabled={lleno}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: elegido, disabled: lleno }}
                      style={[
                        est.opcion,
                        elegido && est.opcionElegida,
                        lleno && est.opcionApagada,
                      ]}
                    >
                      <Text style={est.opcionTexto}>{h.texto}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </Tarjeta>
        </Aparece>
      )}

      <Text style={est.nota}>
        Aquí no hay rachas. Si un día no se pudo, mañana sigue estando el mismo hábito.
      </Text>
    </Pantalla>
  );
}
