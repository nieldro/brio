import { useMemo, useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos } from '../state/TemaContext';
import { DEGRADADOS } from '../theme';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Casilla from '../components/Casilla';
import Aparece from '../components/Aparece';
import { guiaDe, busquedaDeVideo } from '../services/guias';
import { resumenReto, porBloques, avanceDeRutina, claveEjercicio } from '../services/plan';

const crear = ({ C, T, R, S }) => ({
  contenido: {
    paddingTop: S.lg,
  },
  encabezado: {
    gap: S.xs,
  },
  titulo: {
    ...T.saludo,
    fontSize: 28,
    lineHeight: 36,
  },
  resumen: {
    ...T.secundario,
  },
  marcador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: S.md,
  },
  cuenta: {
    ...T.subtitulo,
    color: C.salviaTexto,
  },
  riel: {
    height: 8,
    borderRadius: R.pildora,
    backgroundColor: C.crema,
    overflow: 'hidden',
    marginTop: S.sm,
  },
  relleno: {
    height: '100%',
    borderRadius: R.pildora,
  },
  tituloBloque: {
    ...T.etiqueta,
    color: C.gris,
    marginTop: S.sm,
    marginBottom: -S.sm,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },
  centro: {
    flex: 1,
  },
  nombre: {
    ...T.subtitulo,
  },
  nombreHecho: {
    textDecorationLine: 'line-through',
    color: C.gris,
  },
  detalle: {
    ...T.secundario,
    marginTop: 2,
  },
  comoSeHace: {
    ...T.secundario,
    fontSize: 13,
    color: C.coralTexto,
    fontWeight: '700',
  },
  guia: {
    marginTop: S.lg,
    marginLeft: 42,
    gap: S.md,
  },
  bloque: {
    gap: S.xs,
  },
  subtitulo: {
    ...T.etiqueta,
    color: C.gris,
  },
  paso: {
    flexDirection: 'row',
    gap: S.sm,
  },
  pasoNumero: {
    ...T.secundario,
    color: C.coralTexto,
    width: 14,
  },
  texto: {
    ...T.cuerpo,
    flex: 1,
  },
  cuidado: {
    ...T.cuerpo,
    color: C.gris,
  },
  facil: {
    ...T.cuerpo,
    color: C.salviaTexto,
  },
  tarjetaHecha: {
    opacity: 0.72,
  },
  cierre: {
    ...T.secundario,
    textAlign: 'center',
    marginTop: S.lg,
  },
  legal: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
    marginTop: S.md,
  },
});

// La rutina del día, para tenerla abierta MIENTRAS se entrena.
//
// Es una lista para ir tachando. Eso cambia lo que la pantalla hace: deja de
// ser algo que se lee al principio y pasa a ser algo que se usa durante. Ver
// la lista vaciarse es lo que sostiene a alguien en el ejercicio cuatro.
//
// Lo tachado vive solo aquí, en memoria, y no cuenta para la racha. El día se
// marca con un botón, como siempre: si tachar ejercicios empezara a decidir si
// el día vale, dejar uno a medias se volvería una falta, y eso es justo lo que
// el producto no hace.
export default function Rutina({ route }) {
  const est = useEstilos(crear);
  const dia = route?.params?.dia ?? {};
  const lugar = route?.params?.lugar;

  // Se intenta con la app de YouTube antes que con el navegador: es donde la
  // persona ya tiene su sesión y su idioma.
  const verVideo = async (guia) => {
    const url = busquedaDeVideo(guia);
    try {
      await Linking.openURL(url);
    } catch {
      await openBrowserAsync(url);
    }
  };

  const [hechos, setHechos] = useState({});
  const [abierto, setAbierto] = useState(-1);

  const bloques = useMemo(() => porBloques(dia), [dia]);
  const avance = useMemo(() => avanceDeRutina(dia, hechos), [dia, hechos]);

  const alternar = (clave) => setHechos((h) => ({ ...h, [clave]: !h[clave] }));

  return (
    <Pantalla contentStyle={est.contenido}>
      <Aparece orden={0}>
        <View style={est.encabezado}>
          <Etiqueta>{dia.dia}</Etiqueta>
          <Text style={est.titulo}>{dia.reto}</Text>
          <Text style={est.resumen}>{resumenReto(dia, lugar)}</Text>
        </View>
      </Aparece>

      {avance.total > 0 && (
        <Aparece orden={1}>
          <Tarjeta>
            <Etiqueta>tu avance de hoy</Etiqueta>
            <View style={est.marcador}>
              <Text style={est.cuenta}>
                {avance.hechos} de {avance.total}
              </Text>
              <Text style={est.resumen}>
                {avance.completa ? 'Rutina completa.' : 'Ve tachando lo que hagas.'}
              </Text>
            </View>
            <View style={est.riel}>
              <View style={[est.relleno, { width: `${avance.fraccion * 100}%` }]}>
                <LinearGradient
                  colors={DEGRADADOS.logrado}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={est.relleno}
                />
              </View>
            </View>
          </Tarjeta>
        </Aparece>
      )}

      {bloques.map((bloque, b) => (
        <View key={bloque.clave} style={est.encabezado}>
          <Text style={est.tituloBloque}>{bloque.titulo}</Text>

          {bloque.ejercicios.map((e) => {
            const clave = claveEjercicio(dia, e, e.n - 1);
            const hecho = !!hechos[clave];
            const g = guiaDe(e);
            const estaAbierto = abierto === e.n;

            return (
              <Aparece key={`${e.nombre}-${e.n}`} orden={2 + b}>
                <Tarjeta style={hecho && est.tarjetaHecha}>
                  <View style={est.fila}>
                    <Pressable
                      onPress={() => alternar(clave)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: hecho }}
                      accessibilityLabel={`${e.nombre}, ${hecho ? 'hecho' : 'sin hacer'}`}
                      hitSlop={10}
                    >
                      <Casilla marcada={hecho} />
                    </Pressable>

                    <Pressable
                      style={est.centro}
                      onPress={() => alternar(clave)}
                      accessibilityRole="button"
                    >
                      <Text style={[est.nombre, hecho && est.nombreHecho]}>{e.nombre}</Text>
                      <Text style={est.detalle}>{e.detalle}</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setAbierto(estaAbierto ? -1 : e.n)}
                      accessibilityRole="button"
                      accessibilityLabel={`Cómo se hace: ${e.nombre}`}
                      accessibilityState={{ expanded: estaAbierto }}
                      hitSlop={10}
                    >
                      <Text style={est.comoSeHace}>{estaAbierto ? 'cerrar' : 'cómo'}</Text>
                    </Pressable>
                  </View>

                  {estaAbierto && (
                    <View style={est.guia}>
                      <View style={est.bloque}>
                        <Text style={est.subtitulo}>cómo se hace</Text>
                        {g.como.map((paso, n) => (
                          <View key={paso} style={est.paso}>
                            <Text style={est.pasoNumero}>{n + 1}</Text>
                            <Text style={est.texto}>{paso}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={est.bloque}>
                        <Text style={est.subtitulo}>en qué fijarte</Text>
                        <Text style={est.cuidado}>{g.cuidado}</Text>
                        {!!g.respira && <Text style={est.cuidado}>{g.respira}</Text>}
                      </View>

                      <View style={est.bloque}>
                        <Text style={est.subtitulo}>si hoy no puedes</Text>
                        <Text style={est.facil}>{g.masFacil}</Text>
                      </View>

                      {/* Hay movimientos que se entienden al verlos, y este es
                          el momento en que hace falta: con la rutina abierta y
                          el ejercicio delante. */}
                      <Pressable
                        onPress={() => verVideo(g)}
                        accessibilityRole="button"
                        hitSlop={8}
                      >
                        <Text style={est.comoSeHace}>▸ verlo en video</Text>
                      </Pressable>
                    </View>
                  )}
                </Tarjeta>
              </Aparece>
            );
          })}
        </View>
      ))}

      <Text style={est.cierre}>{dia.mensaje}</Text>

      <Text style={est.legal}>
        Brío acompaña, no diagnostica. Ante dolor, lesión o enfermedad, consulta a un profesional.
      </Text>
    </Pantalla>
  );
}
