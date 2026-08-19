import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos } from '../state/TemaContext';
import { DEGRADADOS } from '../theme';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';
import Casilla from '../components/Casilla';
import SelloHecho from '../components/SelloHecho';
import FiguraEjercicio, { useRelojDeFiguras } from '../components/FiguraEjercicio';
import Aparece from '../components/Aparece';
import { useMarcarDia } from '../state/useMarcarDia';
import { useCelebracion } from '../state/CelebracionContext';
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
    gap: S.sm,
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
  enlaceGuia: {
    marginTop: S.md,
    marginLeft: 42,
  },
  guia: {
    marginTop: S.md,
    marginLeft: 42,
    gap: S.md,
  },
  escenario: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.crema,
    borderRadius: R.chico,
    paddingHorizontal: S.xs,
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
  pieBoton: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
    marginTop: S.sm,
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
export default function Rutina({ route, navigation }) {
  const est = useEstilos(crear);
  const dia = route?.params?.dia ?? {};
  const lugar = route?.params?.lugar;

  // Solo se puede cerrar el día de HOY. Mirar la rutina del viernes desde el
  // martes no puede marcar el martes.
  const esDeHoy = route?.params?.esDeHoy !== false;
  const { marcar, completadoHoy, texto } = useMarcarDia();
  const { celebrar } = useCelebracion();

  const cerrarDia = () => {
    if (marcar(dia.reto)) navigation.goBack();
  };

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

  // Todas las figuras de la rutina se mueven con el mismo reloj.
  const reloj = useRelojDeFiguras('lento');

  const bloques = useMemo(() => porBloques(dia), [dia]);
  const avance = useMemo(() => avanceDeRutina(dia, hechos), [dia, hechos]);

  const alternar = (clave) => setHechos((h) => ({ ...h, [clave]: !h[clave] }));

  // Tachar el último ejercicio SIEMPRE produce algo. Este era el hueco que se
  // sentía roto: la persona terminaba su rutina entera y la app no decía nada,
  // porque el botón de abajo ya estaba en "hecho" desde antes.
  //
  // Si el día todavía no estaba cerrado, se cierra. Si ya lo estaba, se
  // celebra la rutina igual: terminarla completa es un logro por su cuenta, y
  // Brío celebra lo pequeño de inmediato.
  const yaCelebrado = useRef(false);

  useEffect(() => {
    if (!esDeHoy || !avance.completa || yaCelebrado.current) return;
    yaCelebrado.current = true;

    if (!marcar(dia.reto)) {
      celebrar({ titulo: 'Rutina completa.', sub: 'Los hiciste todos. Eso ya es tuyo.' });
    }
  }, [esDeHoy, avance.completa, marcar, celebrar, dia.reto]);

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

                    {/* El movimiento va aquí, siempre a la vista. Escondido
                        detrás de un botón no lo encontraba nadie, y ver la
                        forma es justo lo que hace falta antes de empezar. */}
                    <View style={est.escenario}>
                      <FiguraEjercicio postura={g.figura} size={82} reloj={reloj} />
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setAbierto(estaAbierto ? -1 : e.n)}
                    accessibilityRole="button"
                    accessibilityLabel={`Cómo se hace: ${e.nombre}`}
                    accessibilityState={{ expanded: estaAbierto }}
                    hitSlop={8}
                    style={est.enlaceGuia}
                  >
                    <Text style={est.comoSeHace}>
                      {estaAbierto ? 'cerrar la guía' : 'cómo se hace'}
                    </Text>
                  </Pressable>

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

      {/* El día se cierra desde aquí. Antes había que tachar los cinco
          ejercicios, volver atrás y buscar el botón en otra pantalla: quien
          acababa de entrenar se quedaba sin dónde decir que ya. */}
      {esDeHoy && (
        <Aparece orden={9}>
          {completadoHoy ? (
            <SelloHecho texto={texto} />
          ) : (
            <>
              <Boton onPress={cerrarDia}>{texto}</Boton>
              {avance.total > 0 && (
                <Text style={est.pieBoton}>
                  Puedes marcarlo aunque no hayas hecho todo.
                </Text>
              )}
            </>
          )}
        </Aparece>
      )}

      <Text style={est.legal}>
        Brío acompaña, no diagnostica. Ante dolor, lesión o enfermedad, consulta a un profesional.
      </Text>
    </Pantalla>
  );
}
