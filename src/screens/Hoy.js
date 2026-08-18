import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import PildoraRacha from '../components/PildoraRacha';
import PuntoSemaforo from '../components/PuntoSemaforo';
import { useCelebracion } from '../state/CelebracionContext';
import { useUsuario } from '../state/UsuarioContext';

import { planDemo } from '../data/planDemo';
import { fechaLarga, franjaDelDia, claveDia } from '../services/fecha';
import { diaDelPlan, resumenReto, esDescanso, versionMinima } from '../services/plan';
import { textoHecho, fraseDelDia, subCelebracion } from '../services/racha';
import { hoySeriaRegreso, celebrarRegreso, contarRegresos, diasSinVolver } from '../services/regresos';

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
  reto: {
    ...T.titulo,
    marginTop: S.md,
  },
  resumen: {
    ...T.secundario,
    marginTop: S.xs,
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
  const { celebrar } = useCelebracion();
  const {
    hoy, // viva: cambia sola al cruzar la medianoche
    perfil,
    plan,
    racha,
    rota,
    completadoHoy,
    diasCompletados,
    marcarDiaCompletado,
    diario,
    guardarLogro,
  } = useUsuario();

  // Mientras la IA no haya entregado un plan, se muestra el de arranque.
  const diaCompleto = useMemo(() => diaDelPlan(plan ?? planDemo, hoy), [plan, hoy]);

  // "Hoy no puedo" cambia el reto por su versión de dos minutos. No es un
  // modo aparte: el día se marca igual y cuenta igual.
  const [enMinima, setEnMinima] = useState(false);
  const dia = enMinima ? versionMinima(diaCompleto) : diaCompleto;

  const esRegreso = useMemo(
    () => hoySeriaRegreso({ diasCompletados }, hoy),
    [diasCompletados, hoy],
  );

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
    if (completadoHoy) return;

    // Volver se celebra distinto que seguir. Para quien paró, esto es lo
    // difícil, y es justo lo que ninguna app le ha reconocido nunca.
    const felicitacion = esRegreso
      ? celebrarRegreso(contarRegresos(diasCompletados) + 1, diasSinVolver(diasCompletados, hoy))
      : { titulo: 'Hecho.', sub: subCelebracion(racha + 1) };

    marcarDiaCompletado(dia.reto);
    celebrar(felicitacion);
    setEnMinima(false);
  };

  const saludo = `${SALUDOS[franjaDelDia(hoy)]}, ${perfil.nombre}.`;

  return (
    <Pantalla>
      <View style={est.encabezado}>
        <Text style={est.fecha}>{fechaLarga(hoy)}</Text>

        <View style={est.acciones}>
          <PildoraRacha dias={racha} />
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

      <View style={est.bloqueSaludo}>
        <Text style={T.saludo}>{saludo}</Text>
        <Text style={est.frase}>{fraseDelDia({ completadoHoy, racha, rota })}</Text>
      </View>

      <Tarjeta>
        <View style={est.filaDiario}>
          <Etiqueta>
            {enMinima ? 'versión corta' : esDescanso(dia) ? 'hoy descansas' : 'reto de hoy'}
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
        <Text style={est.resumen}>{resumenReto(dia, perfil.lugar)}</Text>

        {dia.ejercicios.length > 0 && (
          <View style={est.ejercicios}>
            {dia.ejercicios.map((e) => (
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
          </View>
        )}

        <Text style={est.mensaje}>{dia.mensaje}</Text>

        <Boton
          variante={completadoHoy ? 'salvia' : 'coral'}
          onPress={marcarListo}
          style={est.botonListo}
        >
          {completadoHoy ? textoHecho(racha) : 'Listo por hoy'}
        </Boton>

        {/* Lo que hace abandonar no es la falta de ganas: es el todo o nada.
            Este botón le quita a la app el poder de romperle la semana. */}
        {!completadoHoy && !enMinima && dia.ejercicios.length > 0 && (
          <Pressable
            onPress={() => setEnMinima(true)}
            accessibilityRole="button"
            style={est.noPuedo}
          >
            <Text style={est.noPuedoTexto}>Hoy no puedo</Text>
          </Pressable>
        )}

        {!completadoHoy && enMinima && (
          <Pressable
            onPress={() => setEnMinima(false)}
            accessibilityRole="button"
            style={est.noPuedo}
          >
            <Text style={est.noPuedoTexto}>Mejor hago el completo</Text>
          </Pressable>
        )}
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>hoy en la mesa</Etiqueta>
        <View style={est.filaTip}>
          <PuntoSemaforo color={dia.comida_color} />
          <Text style={[T.cuerpo, est.tip]}>{dia.comida_tip}</Text>
        </View>
      </Tarjeta>

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
    </Pantalla>
  );
}
