import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';
import Aparece from '../components/Aparece';
import PuntoSemaforo from '../components/PuntoSemaforo';
import { planDemo } from '../data/planDemo';
import { diaDelPlan } from '../services/plan';
import { mesaDelDia, porMomento, fraseDelDia } from '../services/mesa';

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
    alignItems: 'flex-start',
    gap: S.md,
    marginTop: S.md,
  },
  texto: {
    ...T.cuerpo,
    flex: 1,
  },
  momento: {
    ...T.etiqueta,
    color: C.gris,
    marginTop: S.md,
  },
  idea: {
    ...T.subtitulo,
    marginTop: S.xs,
  },
  nota: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
  },
});

// La mesa: qué se le puede SUMAR hoy a lo que ya comes.
//
// Aquí no se cuenta nada. No hay calorías, no hay porciones, no hay registro
// de comidas y no se marca si cumpliste. Contar comidas es el primer paso
// hacia contar calorías, y la regla 1 dice que ahí no vamos.
//
// Lo único que hay son ideas de suma, una por momento del día, y la cámara
// para mirar un plato concreto.
export default function Mesa({ navigation }) {
  const est = useEstilos(crear);
  const { T } = useTema();
  const { hoy, plan } = useUsuario();

  const [abierto, setAbierto] = useState(null);

  const dia = useMemo(() => diaDelPlan(plan ?? planDemo, hoy), [plan, hoy]);
  const mesa = useMemo(() => mesaDelDia(hoy), [hoy]);
  const frase = useMemo(() => fraseDelDia(hoy), [hoy]);
  const todas = useMemo(() => porMomento(), []);

  return (
    <Pantalla contentStyle={est.contenido}>
      <Aparece orden={0}>
        <View>
          <Text style={est.titulo}>Tu mesa</Text>
          <Text style={est.frase}>{frase}</Text>
        </View>
      </Aparece>

      {/* El tip del día viene del plan, así que sigue el objetivo de la
          persona. Los de abajo son la biblioteca fija. */}
      <Aparece orden={1}>
        <Tarjeta>
          <Etiqueta>hoy</Etiqueta>
          <View style={est.fila}>
            <PuntoSemaforo color={dia.comida_color} size={14} />
            <Text style={est.texto}>{dia.comida_tip}</Text>
          </View>
        </Tarjeta>
      </Aparece>

      <Aparece orden={2}>
        <Tarjeta>
          <Etiqueta>para sumar hoy</Etiqueta>
          {mesa.map((m) => (
            <View key={m.clave}>
              <Text style={est.momento}>{m.titulo}</Text>
              <View style={est.fila}>
                <PuntoSemaforo color={m.idea.color} size={12} />
                <Text style={est.texto}>{m.idea.texto}</Text>
              </View>
            </View>
          ))}
        </Tarjeta>
      </Aparece>

      <Aparece orden={3}>
        <Boton onPress={() => navigation.navigate('Plato')}>Mírame el plato</Boton>
      </Aparece>

      {/* La biblioteca entera, por si la del día no encaja con lo que hay
          hoy en la cocina. Se despliega, no se impone. */}
      {todas.map((m, i) => (
        <Aparece key={m.clave} orden={4 + i}>
          <Tarjeta>
            <Pressable
              onPress={() => setAbierto(abierto === m.clave ? null : m.clave)}
              accessibilityRole="button"
              accessibilityState={{ expanded: abierto === m.clave }}
            >
              <Etiqueta>{m.titulo}</Etiqueta>
              <Text style={est.idea}>
                {abierto === m.clave ? 'cerrar' : `${m.ideas.length} ideas más`}
              </Text>
            </Pressable>

            {abierto === m.clave &&
              m.ideas.map((idea) => (
                <View key={idea.texto} style={est.fila}>
                  <PuntoSemaforo color={idea.color} size={12} />
                  <Text style={est.texto}>{idea.texto}</Text>
                </View>
              ))}
          </Tarjeta>
        </Aparece>
      ))}

      <Text style={est.nota}>
        Aquí no se cuentan calorías ni porciones, y nunca se va a hacer. Comer bien no es comer
        poco.
      </Text>
    </Pantalla>
  );
}
