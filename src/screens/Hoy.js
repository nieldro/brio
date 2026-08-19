import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Image } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import PildoraRacha from '../components/PildoraRacha';
import PuntoSemaforo from '../components/PuntoSemaforo';
import Chispa from '../components/Chispa';
import Logo from '../components/Logo';
import SelloHecho from '../components/SelloHecho';
import { IconoAjustes } from '../components/iconos';
import Aparece from '../components/Aparece';
import { useUsuario } from '../state/UsuarioContext';
import { useAlbum } from '../state/useAlbum';
import { useMarcarDia } from '../state/useMarcarDia';

import { planDemo } from '../data/planDemo';
import { fechaLarga, franjaDelDia, claveDia } from '../services/fecha';
import { diaDelPlan, esDescanso, versionMinima, asomoDeEjercicios } from '../services/plan';
import { semanasConMovimiento } from '../services/recorrido';
import { nivelDeAcompanamiento, saludoSegunDistancia, porQueHabloMenos } from '../services/acompanamiento';
import { textoDelAlbum } from '../services/album';
import { avanceDeHoy, frasePorAvance } from '../services/habitos';
import { recordatorioDePorque, toca } from '../services/porque';

const SALUDOS = {
  manana: 'Buenos días',
  tarde: 'Buenas tardes',
  noche: 'Buenas noches',
};

const crear = ({ C, T, R, S }) => ({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.sm,
  },
  fecha: {
    ...T.secundario,
    textTransform: 'lowercase',
    flex: 1,
  },
  acciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.blanco,
    borderWidth: 1,
    borderColor: C.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: {
    ...T.subtitulo,
    fontSize: 15,
    color: C.gris,
  },
  presionado: {
    opacity: 0.7,
  },
  filaDiario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verTodo: {
    ...T.secundario,
    color: C.coralTexto,
    fontWeight: '700',
  },
  bloqueSaludo: {
    marginTop: S.sm,
    gap: S.sm,
  },
  frase: {
    ...T.cuerpo,
    color: C.gris,
  },
  explicacion: {
    ...T.secundario,
    fontSize: 13,
    color: C.salviaTexto,
    borderLeftWidth: 3,
    borderLeftColor: C.salvia,
    paddingLeft: S.md,
    marginTop: S.xs,
  },
  porque: {
    ...T.secundario,
    color: C.cafe,
    fontStyle: 'italic',
    borderLeftWidth: 3,
    borderLeftColor: C.coral,
    paddingLeft: S.md,
    marginTop: S.md,
  },
  reto: {
    ...T.titulo,
    marginTop: S.md,
  },
  fichas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    marginTop: S.md,
  },
  ficha: {
    backgroundColor: C.crema,
    borderRadius: R.pildora,
    paddingVertical: S.xs + 2,
    paddingHorizontal: S.md,
  },
  fichaTexto: {
    ...T.secundario,
    fontSize: 13,
    fontWeight: '700',
    color: C.gris,
  },
  ejercicios: {
    marginTop: S.lg,
    gap: S.md,
  },
  ejercicio: {
    backgroundColor: C.crema,
    borderRadius: R.chico,
    padding: S.md,
    gap: 2,
  },
  filaEjercicio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ejercicioNombre: {
    ...T.subtitulo,
    fontSize: 16,
    flex: 1,
  },
  comoSeHace: {
    ...T.secundario,
    fontSize: 13,
    color: C.coralTexto,
    fontWeight: '700',
  },
  masEjercicios: {
    paddingVertical: S.sm,
    alignItems: 'center',
  },
  masEjerciciosTexto: {
    ...T.secundario,
    color: C.coralTexto,
    fontWeight: '700',
  },
  mensaje: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.lg,
  },
  botonListo: {
    marginTop: S.lg,
  },
  noPuedo: {
    alignItems: 'center',
    paddingVertical: S.md,
    marginTop: S.xs,
  },
  noPuedoTexto: {
    ...T.secundario,
    color: C.gris,
    fontWeight: '600',
  },
  filaTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.md,
  },
  tip: {
    flex: 1,
  },
  filaFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.lg,
    marginTop: S.md,
  },
  miniatura: {
    width: 54,
    height: 72,
    borderRadius: R.chico,
    backgroundColor: C.crema,
  },
  huecoFoto: {
    width: 54,
    height: 72,
    borderRadius: R.chico,
    backgroundColor: C.crema,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoFoto: {
    flex: 1,
    gap: 2,
  },
  preguntaFoto: {
    ...T.subtitulo,
  },
  botonFoto: {
    marginTop: S.lg,
  },
  pregunta: {
    ...T.subtitulo,
    marginTop: S.md,
  },
  input: {
    ...T.cuerpo,
    marginTop: S.md,
    backgroundColor: C.crema,
    borderRadius: R.chico,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    minHeight: 52,
    textAlignVertical: 'top',
  },
});

export default function Hoy({ navigation }) {
  const est = useEstilos(crear);
  const { C, T } = useTema();
  const {
    hoy, // viva: cambia sola al cruzar la medianoche
    perfil,
    plan,
    racha,
    rota,
    completadoHoy,
    diario,
    guardarLogro,
    habitos,
    habitosHechos,
    diasCompletados,
    distanciaAvisada,
    avisarDistancia,
    retoEnMinima,
    aliviarReto,
  } = useUsuario();

  // Mientras la IA no haya entregado un plan, se muestra el de arranque.
  const diaCompleto = useMemo(() => diaDelPlan(plan ?? planDemo, hoy), [plan, hoy]);

  // "Hoy no puedo" cambia el reto por su versión de dos minutos. No es un
  // modo aparte: el día se marca igual y cuenta igual.
  //
  // El estado es compartido (UsuarioContext) y no de esta pantalla: el chip
  // "Cambia mi reto" del chat cambia esto mismo, y así lo que Brío dice ahí
  // se ve aquí. Además aguanta cerrar la app y volver.
  const dia = retoEnMinima ? versionMinima(diaCompleto) : diaCompleto;

  // Cerrar el día vive en un solo sitio (state/useMarcarDia.js): Hoy y la
  // rutina lo hacen igual, y ninguna de las dos puede celebrar distinto.
  const { marcar, texto: textoBoton } = useMarcarDia();

  const { estado: album } = useAlbum();

  const avanceHabitos = useMemo(
    () => avanceDeHoy(habitos, habitosHechos, hoy),
    [habitos, habitosHechos, hoy],
  );

  // Brío habla menos a medida que la persona lo necesita menos. El objetivo
  // de una app de hábitos es volverse innecesaria: una que necesita
  // celebrarte cada día no te construye un hábito, te construye dependencia.
  const distancia = useMemo(
    () =>
      nivelDeAcompanamiento(
        { semanas: semanasConMovimiento(diasCompletados), diasCompletados },
        hoy,
      ),
    [diasCompletados, hoy],
  );

  // El cambio se explica UNA vez. Sin explicarlo, la persona sentiría que la
  // app se enfrió con ella, que es justo lo contrario de lo que pasa.
  const explicacion = distancia !== distanciaAvisada ? porQueHabloMenos(distancia) : null;

  useEffect(() => {
    if (explicacion) avisarDistancia(distancia);
  }, [explicacion, distancia, avisarDistancia]);

  // En Hoy caben tres. El resto vive en la rutina, a un toque.
  const asomo = useMemo(() => asomoDeEjercicios(dia), [dia]);

  // Diario se abre ENCIMA de Hoy sin desmontarla. Si el usuario escribe allá,
  // este campo tiene que enterarse: antes seguía vacío y, al perder el foco,
  // guardaba ese vacío y borraba el logro del teléfono y de la nube.
  const logroGuardado = diario[claveDia(hoy)] ?? '';
  const [logro, setLogro] = useState(logroGuardado);

  useEffect(() => setLogro(logroGuardado), [logroGuardado]);

  // Solo se guarda si de verdad cambió. Perder el foco sin tocar nada no
  // puede borrar lo que ya estaba escrito.
  const guardarSiCambio = () => {
    const limpio = logro.trim();
    if (limpio !== logroGuardado) guardarLogro(limpio);
  };

  const marcarListo = () => {
    if (marcar(dia.reto)) aliviarReto(false);
  };

  const saludo = `${SALUDOS[franjaDelDia(hoy)]}, ${perfil.nombre}.`;

  const tocaElPorque = toca(perfil.porque, { rota, completadoHoy });

  return (
    <Pantalla>
      <View style={est.encabezado}>
        {/* La marca acompaña todos los días, no solo el primer arranque. */}
        <Logo size={30} />
        <Text style={est.fecha}>{fechaLarga(hoy)}</Text>

        <View style={est.acciones}>
          <PildoraRacha dias={racha} />
          <Pressable
            onPress={() => navigation.navigate('Ajustes')}
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
            hitSlop={8}
            style={({ pressed }) => [est.avatar, pressed && est.presionado]}
          >
            <IconoAjustes color={C.gris} size={18} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Perfil')}
            accessibilityRole="button"
            accessibilityLabel="Tu perfil"
            hitSlop={8}
            style={({ pressed }) => [est.avatar, pressed && est.presionado]}
          >
            <Text style={est.inicial}>
              {perfil.nombre?.trim()?.charAt(0)?.toUpperCase() || '·'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Aparece orden={0}>
        <View style={est.bloqueSaludo}>
          <Text style={T.saludo}>{saludo}</Text>
          <Text style={est.frase}>
            {saludoSegunDistancia(distancia, { completadoHoy, racha, rota })}
          </Text>
          {!!explicacion && <Text style={est.explicacion}>{explicacion}</Text>}

          {/* Su motivo, solo cuando vuelve después de romper la racha. Ese es
              el día en que se decide si se queda o se va otra vez. Sacarlo
              todos los días lo gastaría hasta volverlo decoración. */}
          {tocaElPorque && (
            <Text style={est.porque}>{recordatorioDePorque(perfil.porque)}</Text>
          )}
        </View>
      </Aparece>

      <Aparece orden={1}>
      <Tarjeta>
        <View style={est.filaDiario}>
          <Etiqueta>
            {retoEnMinima ? 'versión corta' : esDescanso(dia) ? 'hoy descansas' : 'reto de hoy'}
          </Etiqueta>
          {dia.ejercicios.length > 0 && (
            <Pressable
              onPress={() => navigation.navigate('Rutina', { dia, lugar: perfil.lugar })}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={est.verTodo}>ver rutina</Text>
            </Pressable>
          )}
        </View>
        <Text style={est.reto}>{dia.reto}</Text>

        {/* Los datos del día sueltos en una línea de texto se leían como una
            nota al pie. En fichas se ven de un vistazo, que es como se mira
            una pantalla antes de entrenar. */}
        <View style={est.fichas}>
          {dia.duracion_min > 0 && (
            <View style={est.ficha}>
              <Text style={est.fichaTexto}>{dia.duracion_min} min</Text>
            </View>
          )}
          {!!perfil.lugar && (
            <View style={est.ficha}>
              <Text style={est.fichaTexto}>{perfil.lugar}</Text>
            </View>
          )}
          {dia.ejercicios.length > 0 && (
            <View style={est.ficha}>
              <Text style={est.fichaTexto}>
                {dia.ejercicios.length} {dia.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
              </Text>
            </View>
          )}
        </View>

        {asomo.visibles.length > 0 && (
          <View style={est.ejercicios}>
            {asomo.visibles.map((e) => (
              // Tocable: quien nunca entrenó no sabe qué es "flexiones en la
              // pared". Saber cómo se hace es la diferencia entre intentarlo
              // y cerrar la app.
              <Pressable
                key={e.nombre}
                onPress={() => navigation.navigate('Guia', { ejercicio: e })}
                accessibilityRole="button"
                accessibilityLabel={`Cómo se hace: ${e.nombre}`}
                style={({ pressed }) => [est.ejercicio, pressed && est.presionado]}
              >
                <View style={est.filaEjercicio}>
                  <Text style={est.ejercicioNombre}>{e.nombre}</Text>
                  <Text style={est.comoSeHace}>cómo</Text>
                </View>
                <Text style={T.secundario}>{e.detalle}</Text>
              </Pressable>
            ))}

            {asomo.restantes > 0 && (
              <Pressable
                onPress={() => navigation.navigate('Rutina', { dia, lugar: perfil.lugar })}
                accessibilityRole="button"
                style={est.masEjercicios}
              >
                <Text style={est.masEjerciciosTexto}>
                  {asomo.restantes === 1
                    ? 'y uno más en tu rutina'
                    : `y ${asomo.restantes} más en tu rutina`}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={est.mensaje}>{dia.mensaje}</Text>

        <View style={est.botonListo}>
          {completadoHoy ? (
            <SelloHecho texto={textoBoton} />
          ) : (
            <Boton onPress={marcarListo}>{textoBoton}</Boton>
          )}
        </View>

        {/* Lo que hace abandonar no es la falta de ganas: es el todo o nada.
            Este botón le quita a la app el poder de romperle la semana. */}
        {!completadoHoy && !retoEnMinima && dia.ejercicios.length > 0 && (
          <Pressable
            onPress={() => aliviarReto(true)}
            accessibilityRole="button"
            style={est.noPuedo}
          >
            <Text style={est.noPuedoTexto}>Hoy no puedo</Text>
          </Pressable>
        )}

        {!completadoHoy && retoEnMinima && (
          <Pressable
            onPress={() => aliviarReto(false)}
            accessibilityRole="button"
            style={est.noPuedo}
          >
            <Text style={est.noPuedoTexto}>Mejor hago el completo</Text>
          </Pressable>
        )}
      </Tarjeta>
      </Aparece>

      <Aparece orden={2}>
      <Tarjeta>
        <View style={est.filaDiario}>
          <Etiqueta>hoy en la mesa</Etiqueta>
          <Pressable
            onPress={() => navigation.navigate('Mesa')}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={est.verTodo}>ver mi mesa</Text>
          </Pressable>
        </View>
        <View style={est.filaTip}>
          <PuntoSemaforo color={dia.comida_color} />
          <Text style={[T.cuerpo, est.tip]}>{dia.comida_tip}</Text>
        </View>
      </Tarjeta>
      </Aparece>

      {/* Los hábitos son el otro medio nombre de la app y hasta hoy no
          estaban en ningún lado. Van después del reto: primero lo del día,
          después lo pequeño que lo sostiene. */}
      <Aparece orden={3}>
        <Pressable
          onPress={() => navigation.navigate('Habitos')}
          accessibilityRole="button"
          accessibilityLabel="Tus hábitos"
        >
          <Tarjeta>
            <View style={est.filaDiario}>
              <Etiqueta>tus hábitos</Etiqueta>
              <Text style={est.verTodo}>
                {avanceHabitos.total > 0
                  ? `${avanceHabitos.hechos} de ${avanceHabitos.total}`
                  : 'elegir'}
              </Text>
            </View>
            <Text style={est.preguntaFoto}>{frasePorAvance(avanceHabitos)}</Text>
          </Tarjeta>
        </Pressable>
      </Aparece>

      {/* La foto del día. Va abajo, en voz baja y sin contador: el día que
          saltarse una foto cueste algo, esto se vuelve otra báscula. */}
      <Aparece orden={3}>
      <Tarjeta>
        <View style={est.filaDiario}>
          <Etiqueta>tu álbum</Etiqueta>
          <Pressable
            onPress={() => navigation.navigate('Album')}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={est.verTodo}>Ver todo</Text>
          </Pressable>
        </View>

        <View style={est.filaFoto}>
          {album.ultima ? (
            <Image source={{ uri: album.ultima.uri }} style={est.miniatura} />
          ) : (
            <View style={est.huecoFoto}>
              <Chispa size={20} />
            </View>
          )}
          <View style={est.textoFoto}>
            <Text style={est.preguntaFoto}>
              {album.tieneHoy ? 'Ya está la de hoy.' : '¿La foto de hoy?'}
            </Text>
            <Text style={T.secundario}>{textoDelAlbum(album)}</Text>
          </View>
        </View>

        {!album.tieneHoy && (
          <Boton
            variante="suave"
            style={est.botonFoto}
            onPress={() =>
              navigation.navigate('Camara', { anterior: album.ultima?.uri ?? null })
            }
          >
            Tomar la de hoy
          </Boton>
        )}
      </Tarjeta>
      </Aparece>

      <Aparece orden={4}>
      <Tarjeta>
        <View style={est.filaDiario}>
          <Etiqueta>tu diario</Etiqueta>
          <Pressable
            onPress={() => navigation.navigate('Diario')}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={est.verTodo}>Ver todo</Text>
          </Pressable>
        </View>

        <Text style={est.pregunta}>¿Un logro de hoy?</Text>
        <TextInput
          value={logro}
          onChangeText={setLogro}
          onBlur={guardarSiCambio}
          placeholder="Una línea basta"
          placeholderTextColor={C.apagado}
          style={est.input}
          multiline
        />
      </Tarjeta>
      </Aparece>
    </Pantalla>
  );
}
