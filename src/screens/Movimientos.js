import { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Aparece from '../components/Aparece';
import FiguraEjercicio, { useRelojDeFiguras } from '../components/FiguraEjercicio';
import { guiaDe, normalizar } from '../services/guias';
import { EJERCICIOS, ZONAS } from '../../azure-functions/src/lib/catalogo';

const LUGARES = [
  { clave: 'todos', titulo: 'Todo' },
  { clave: 'casa', titulo: 'En casa' },
  { clave: 'gym', titulo: 'En el gym' },
];

const NOMBRE_ZONA = {
  piernas: 'Piernas',
  gluteos: 'Glúteos',
  pecho: 'Pecho',
  espalda: 'Espalda',
  brazos: 'Brazos',
  hombros: 'Hombros',
  centro: 'Abdomen',
};

const crear = ({ C, T, R, S }) => ({
  contenido: {
    paddingTop: S.lg,
  },
  titulo: {
    ...T.saludo,
    fontSize: 28,
    lineHeight: 36,
  },
  sub: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.sm,
  },
  buscador: {
    ...T.cuerpo,
    backgroundColor: C.blanco,
    borderRadius: R.medio,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    marginTop: S.md,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    marginTop: S.md,
  },
  chip: {
    borderRadius: R.pildora,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
  },
  chipElegido: {
    borderColor: C.coral,
    backgroundColor: C.coralSuave,
  },
  chipTexto: {
    ...T.secundario,
    fontSize: 13,
    fontWeight: '700',
    color: C.gris,
  },
  chipTextoElegido: {
    color: C.coralTexto,
  },
  cuenta: {
    ...T.secundario,
    marginTop: S.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },
  escenario: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.crema,
    borderRadius: R.chico,
  },
  centro: {
    flex: 1,
  },
  nombre: {
    ...T.subtitulo,
  },
  zonas: {
    ...T.secundario,
    fontSize: 13,
    marginTop: 2,
  },
  ver: {
    ...T.secundario,
    fontSize: 13,
    color: C.coralTexto,
    fontWeight: '700',
    marginTop: S.xs,
  },
  vacio: {
    ...T.cuerpo,
    color: C.gris,
    textAlign: 'center',
    marginTop: S.xl,
  },
  tarjeta: {
    padding: S.md,
  },
});

// Todos los movimientos que Brío sabe enseñar.
//
// No hace falta esperar a que el plan te lo ponga para poder mirarlo. Quien
// quiere saber qué es una sentadilla búlgara antes de que le toque, o quien
// quiere ver qué hay para espalda, entra aquí.
//
// Sale del MISMO catálogo que usa el servidor para armar los planes, así que
// lo que se ve aquí es exactamente lo que te puede tocar. No es un folleto.
export default function Movimientos({ navigation }) {
  const est = useEstilos(crear);
  const { C } = useTema();
  const reloj = useRelojDeFiguras('lento');

  const [busqueda, setBusqueda] = useState('');
  const [lugar, setLugar] = useState('todos');
  const [zona, setZona] = useState(null);

  const lista = useMemo(() => {
    const texto = normalizar(busqueda);

    return EJERCICIOS.filter((e) => {
      if (lugar !== 'todos' && e.lugar !== 'ambos' && e.lugar !== lugar) return false;
      if (zona && !e.zonas.includes(zona)) return false;
      if (texto && !normalizar(e.nombre).includes(texto)) return false;
      return true;
    });
  }, [busqueda, lugar, zona]);

  return (
    <Pantalla contentStyle={est.contenido}>
      <Aparece orden={0}>
        <View>
          <Text style={est.titulo}>Todos los movimientos</Text>
          <Text style={est.sub}>
            Los {EJERCICIOS.length} que sé enseñar. Cada uno con su guía y su animación.
          </Text>

          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar un movimiento"
            placeholderTextColor={C.apagado}
            style={est.buscador}
            autoCorrect={false}
          />

          <View style={est.filtros}>
            {LUGARES.map((l) => (
              <Pressable
                key={l.clave}
                onPress={() => setLugar(l.clave)}
                accessibilityRole="radio"
                accessibilityState={{ selected: lugar === l.clave }}
                style={[est.chip, lugar === l.clave && est.chipElegido]}
              >
                <Text style={[est.chipTexto, lugar === l.clave && est.chipTextoElegido]}>
                  {l.titulo}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={est.filtros}>
            {ZONAS.map((z) => (
              <Pressable
                key={z}
                onPress={() => setZona(zona === z ? null : z)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: zona === z }}
                style={[est.chip, zona === z && est.chipElegido]}
              >
                <Text style={[est.chipTexto, zona === z && est.chipTextoElegido]}>
                  {NOMBRE_ZONA[z] ?? z}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={est.cuenta}>
            {lista.length === EJERCICIOS.length
              ? `${lista.length} movimientos`
              : `${lista.length} de ${EJERCICIOS.length}`}
          </Text>
        </View>
      </Aparece>

      {lista.map((e, i) => {
        const g = guiaDe({ nombre: e.nombre });

        return (
          <Aparece key={e.nombre} orden={Math.min(i, 6)}>
            <Pressable
              onPress={() => navigation.navigate('Guia', { ejercicio: { nombre: e.nombre } })}
              accessibilityRole="button"
              accessibilityLabel={`Ver cómo se hace ${e.nombre}`}
            >
              <Tarjeta style={est.tarjeta}>
                <View style={est.fila}>
                  <View style={est.escenario}>
                    <FiguraEjercicio postura={g.figura} size={76} reloj={reloj} />
                  </View>

                  <View style={est.centro}>
                    <Text style={est.nombre}>{e.nombre}</Text>
                    <Text style={est.zonas}>
                      {e.zonas.length
                        ? e.zonas.map((z) => NOMBRE_ZONA[z] ?? z).join(' · ')
                        : 'Todo el cuerpo'}
                    </Text>
                    <Text style={est.ver}>cómo se hace</Text>
                  </View>
                </View>
              </Tarjeta>
            </Pressable>
          </Aparece>
        );
      })}

      {lista.length === 0 && (
        <Text style={est.vacio}>
          Nada con eso. Prueba con otra palabra o quita algún filtro.
        </Text>
      )}
    </Pantalla>
  );
}
