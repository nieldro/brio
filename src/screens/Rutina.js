import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { useEstilos } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import { guiaDe } from '../services/guias';
import { resumenReto, porBloques } from '../services/plan';

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
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },
  numero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.crema,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: {
    ...T.secundario,
    fontWeight: '700',
    color: C.coralTexto,
  },
  nombre: {
    ...T.subtitulo,
    flex: 1,
  },
  flecha: {
    ...T.secundario,
    color: C.coralTexto,
    fontWeight: '700',
  },
  detalle: {
    ...T.secundario,
    marginTop: S.sm,
    marginLeft: 40,
  },
  guia: {
    marginTop: S.lg,
    marginLeft: 40,
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
  tituloBloque: {
    ...T.etiqueta,
    color: C.gris,
    marginTop: S.sm,
    marginBottom: -S.sm,
  },
});

// La rutina completa del día, en orden, con la guía de cada movimiento a un
// toque. Está pensada para tenerla abierta MIENTRAS se entrena: por eso los
// ejercicios se despliegan en su sitio en vez de mandarte a otra pantalla y
// hacerte perder dónde ibas.
export default function Rutina({ route }) {
  const est = useEstilos(crear);
  const dia = route?.params?.dia ?? {};
  const lugar = route?.params?.lugar;
  // Se abre el primero: quien entra aquí casi siempre va a empezar por ahí,
  // y así ve de una que cada ejercicio trae su guía dentro.
  const [abierto, setAbierto] = useState(1);

  const bloques = porBloques(dia);

  return (
    <Pantalla contentStyle={est.contenido}>
      <View style={est.encabezado}>
        <Etiqueta>{dia.dia}</Etiqueta>
        <Text style={est.titulo}>{dia.reto}</Text>
        <Text style={est.resumen}>{resumenReto(dia, lugar)}</Text>
      </View>

      {bloques.map((bloque) => (
        <View key={bloque.clave} style={est.encabezado}>
          <Text style={est.tituloBloque}>{bloque.titulo}</Text>

          {bloque.ejercicios.map((e) => {
            const g = guiaDe(e);
            const estaAbierto = abierto === e.n;

            return (
              <Tarjeta key={`${e.nombre}-${e.n}`}>
                <Pressable
                  onPress={() => setAbierto(estaAbierto ? -1 : e.n)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: estaAbierto }}
                >
                  <View style={est.fila}>
                    <View style={est.numero}>
                      <Text style={est.numeroTexto}>{e.n}</Text>
                    </View>
                    <Text style={est.nombre}>{e.nombre}</Text>
                    <Text style={est.flecha}>{estaAbierto ? '−' : '+'}</Text>
                  </View>
                  <Text style={est.detalle}>{e.detalle}</Text>
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
                  </View>
                )}
              </Tarjeta>
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
