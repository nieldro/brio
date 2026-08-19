import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useEstilos, useTema } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import { useAlbum } from '../state/useAlbum';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Chispa from '../components/Chispa';
import Aparece from '../components/Aparece';
import { DEGRADADOS } from '../theme';
import { porGrupo, cuantasGanadas, INSIGNIAS, textoDelResumen } from '../services/insignias';
import { totales, semanasEnteras } from '../services/recorrido';
import { contarRegresos, contarRegresosLargos } from '../services/regresos';

const crear = ({ C, T, R, S }) => ({
  contenido: {
    paddingTop: S.lg,
  },
  titulo: {
    ...T.saludo,
    fontSize: 28,
    lineHeight: 36,
  },
  resumen: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.sm,
  },
  grupo: {
    ...T.etiqueta,
    color: C.gris,
    marginTop: S.lg,
    marginBottom: -S.sm,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.lg,
  },
  medalla: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: C.crema,
    borderWidth: 1.5,
    borderColor: C.borde,
  },
  medallaGanada: {
    borderColor: 'transparent',
  },
  relleno: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centro: {
    flex: 1,
  },
  nombre: {
    ...T.subtitulo,
    fontSize: 16,
  },
  nombrePendiente: {
    color: C.gris,
  },
  texto: {
    ...T.secundario,
    marginTop: 2,
  },
  riel: {
    height: 6,
    borderRadius: R.pildora,
    backgroundColor: C.crema,
    overflow: 'hidden',
    marginTop: S.sm,
  },
  avance: {
    height: '100%',
    borderRadius: R.pildora,
    backgroundColor: C.borde,
  },
  cuenta: {
    ...T.secundario,
    fontSize: 12,
    marginTop: S.xs,
  },
  nota: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
  },
});

// Lo que ya construiste.
//
// La idea sale de Headspace, que celebra hitos ADEMÁS de constancia. Eso es
// lo que sostiene a alguien cuando la semana se le rompe: aunque hoy falles,
// lo que ya hiciste sigue aquí y nadie te lo quita.
//
// Lo que NO se copió de esas apps: el ranking, la liga y la comparación con
// otros. A quien ya abandonó cinco apps, verse último en una tabla lo saca
// para siempre. Aquí solo te comparas contigo.
//
// Y las que faltan se muestran con su avance, no con un candado. El candado
// dice "no puedes". El avance dice "vas por aquí".
export default function Logros() {
  const est = useEstilos(crear);
  const { C, T } = useTema();
  const { diasCompletados, habitosHechos, diario, mejorRacha, rutinasCompletas } = useUsuario();
  const { estado: album } = useAlbum();

  const datos = useMemo(() => {
    const t = totales({ diasCompletados, habitosHechos, diario });
    return {
      dias: t.dias,
      semanas: t.semanas,
      semanasEnteras: semanasEnteras(diasCompletados),
      rutinas: rutinasCompletas ?? 0,
      habitos: t.habitos,
      lineas: t.lineas,
      regresos: contarRegresos(diasCompletados),
      regresosLargos: contarRegresosLargos(diasCompletados),
      mejorRacha,
      fotos: album.total,
    };
  }, [diasCompletados, habitosHechos, diario, mejorRacha, rutinasCompletas, album.total]);

  const grupos = useMemo(() => porGrupo(datos), [datos]);
  const ganadas = useMemo(() => cuantasGanadas(datos), [datos]);

  return (
    <Pantalla contentStyle={est.contenido}>
      <Aparece orden={0}>
        <View>
          <Text style={est.titulo}>Lo que ya construiste</Text>
          <Text style={est.resumen}>{textoDelResumen(ganadas, INSIGNIAS.length)}</Text>
        </View>
      </Aparece>

      {grupos.map((g, i) => (
        <View key={g.clave}>
          <Text style={est.grupo}>{g.titulo}</Text>

          {g.insignias.map((ins) => (
            <Aparece key={ins.clave} orden={i + 1}>
              <Tarjeta>
                <View style={est.fila}>
                  <View style={[est.medalla, ins.ganada && est.medallaGanada]}>
                    {ins.ganada && (
                      <LinearGradient
                        colors={DEGRADADOS.llama}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={est.relleno}
                      />
                    )}
                    <Chispa size={20} color={ins.ganada ? '#FFFFFF' : C.apagado} />
                  </View>

                  <View style={est.centro}>
                    <Text style={[est.nombre, !ins.ganada && est.nombrePendiente]}>
                      {ins.titulo}
                    </Text>
                    <Text style={est.texto}>{ins.texto}</Text>

                    {/* Las que faltan muestran cuánto llevas, no un candado. */}
                    {!ins.ganada && ins.meta > 1 && (
                      <>
                        <View style={est.riel}>
                          <View style={[est.avance, { width: `${ins.fraccion * 100}%` }]} />
                        </View>
                        <Text style={est.cuenta}>
                          {ins.valor} de {ins.meta}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </Tarjeta>
            </Aparece>
          ))}
        </View>
      ))}

      <Text style={est.nota}>
        Ninguna de estas se pierde. Una racha se puede romper; esto ya lo hiciste.
      </Text>
    </Pantalla>
  );
}
