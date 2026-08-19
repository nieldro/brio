import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Share } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';
import Aparece from '../components/Aparece';
import {
  MOTIVOS_ENTRADA,
  RETOS_PAREJA,
  avance,
  crearReto,
  estadoDelReto,
  formatearCodigo,
  generarCodigo,
  hitoAlcanzado,
  normalizarCodigo,
  renovarInvitacion,
  revisarCodigo,
  salir,
  sumar,
  textoAlSalir,
  textoDeAvance,
  textoDeCompania,
  textoDeEstado,
  textoDelBoton,
  textoParaInvitar,
  unirseConCodigo,
  yaSume,
} from '../services/pareja';

const crear = ({ C, T, R, S }) => ({
  contenido: {
    paddingTop: S.lg,
  },
  titulo: {
    ...T.saludo,
    fontSize: 28,
    lineHeight: 36,
  },
  intro: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.sm,
  },
  opcion: {
    borderRadius: R.medio,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingVertical: S.md,
    paddingHorizontal: S.lg,
    marginTop: S.sm,
  },
  opcionElegida: {
    borderColor: C.coral,
    backgroundColor: C.coralSuave,
  },
  opcionTitulo: {
    ...T.subtitulo,
    fontSize: 16,
  },
  opcionTexto: {
    ...T.secundario,
    fontSize: 14,
    marginTop: 2,
  },
  codigo: {
    ...T.saludo,
    fontSize: 34,
    lineHeight: 44,
    letterSpacing: 4,
    textAlign: 'center',
    marginVertical: S.md,
  },
  riel: {
    height: 8,
    borderRadius: R.pildora,
    backgroundColor: C.crema,
    overflow: 'hidden',
    marginTop: S.md,
  },
  avance: {
    height: '100%',
    borderRadius: R.pildora,
    backgroundColor: C.salvia,
  },
  frase: {
    ...T.cuerpo,
    marginTop: S.md,
  },
  compania: {
    ...T.secundario,
    marginTop: S.xs,
  },
  entrada: {
    ...T.cuerpo,
    backgroundColor: C.blanco,
    borderRadius: R.medio,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingHorizontal: S.lg,
    paddingVertical: S.lg,
    marginTop: S.md,
    letterSpacing: 3,
    textAlign: 'center',
  },
  aviso: {
    ...T.secundario,
    color: C.rojoTexto,
    marginTop: S.sm,
  },
  // Lo que se cuenta sin que nadie se haya equivocado. Va en gris y no en
  // rojo: salir de un reto es una decisión, no un error de formulario.
  dicho: {
    ...T.secundario,
    color: C.gris,
    marginTop: S.sm,
  },
  acciones: {
    gap: S.md,
  },
  enlace: {
    alignItems: 'center',
    paddingVertical: S.md,
  },
  enlaceTexto: {
    ...T.secundario,
    color: C.coralTexto,
    fontWeight: '700',
  },
  salirTexto: {
    ...T.secundario,
    color: C.gris,
    fontWeight: '600',
  },
  nota: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
  },
});

// Un reto de dos.
//
// LA DECISIÓN QUE MANDA EN ESTA PANTALLA
// No hay marcador. No hay dos barras enfrentadas, ni porcentajes, ni quién va
// ganando. Hay UNA barra, que es del reto, y avanza con lo que haga
// cualquiera de los dos. El módulo de reglas ni siquiera sabe calcular el
// reparto, así que esta pantalla no podría mostrarlo aunque quisiera.
//
// Del otro solo se dice que estuvo. Nunca que faltó: "lleva tres días sin
// aparecer" convierte el acompañamiento en vigilancia y pone a una persona a
// responder por otra. Cuando no hay nada bueno que contar, se habla del ritmo
// de cada quien y ya.
//
// Y la salida está a un toque, sin confirmación dramática y sin avisarle al
// otro. Una puerta que cuesta abrir es una razón para no entrar nunca.
//
// DÓNDE VIVE EL RETO
// En el estado global, bajo la clave `pareja`, que se persiste sola en disco.
// Vivía en un `useState` de aquí, y esta es una pantalla de pila: al tocar
// atrás, native-stack la desmonta y se iba con ella el reto entero, el código
// y lo que llevaban. Además Hoy lee esa misma clave para decidir entre "Van
// juntos" e "Invita a alguien", así que sin esto la tarjeta de Hoy nunca
// cambiaba.
export default function Pareja() {
  const est = useEstilos(crear);
  const { C } = useTema();
  const usuario = useUsuario();
  const { userId, hoy, guardarPareja } = usuario;

  // Sin cuenta todavía hay identidad: el reto se arma igual y se sincroniza
  // cuando la persona guarde su cuenta.
  const yo = userId ?? 'este-telefono';
  const reto = usuario.pareja ?? null;

  // Buscar un reto por su código es lo único que este teléfono no puede
  // hacer: el reto es de otra persona. La única que puede es `unirse_a_reto`
  // en Supabase. Mientras esa capa no exista, la búsqueda contesta 'sin-nube'
  // y eso se dice tal cual, en vez de responder "ese código no me suena" a
  // quien acaba de escribirlo bien.
  const buscar = usuario.buscarRetoPorCodigo ?? (() => ({ estado: 'sin-nube' }));

  const [elegido, setElegido] = useState(RETOS_PAREJA[0].clave);
  const [escribiendo, setEscribiendo] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState(null);
  const [dicho, setDicho] = useState(null);
  const [hito, setHito] = useState(null);

  const estado = estadoDelReto(reto, hoy);
  const paso = useMemo(() => avance(reto), [reto]);
  const hecho = yaSume(reto, yo, hoy);

  const armar = () => {
    guardarPareja(crearReto({ clave: elegido, quien: yo, codigo: generarCodigo(), hoy }));
    setAviso(null);
    setDicho(null);
  };

  const entrar = () => {
    const mal = revisarCodigo(codigo);
    if (mal) {
      setAviso(mal);
      return;
    }

    // La búsqueda va a ser una llamada de red en cuanto exista la nube, así
    // que se espera como promesa desde ya: conectarla no debería obligar a
    // rehacer este flujo.
    Promise.resolve()
      .then(() => buscar(normalizarCodigo(codigo)))
      .then((hallazgo) => {
        const r = unirseConCodigo({ quien: yo, codigo, hallazgo, hoy });
        if (!r.ok) {
          setAviso(r.error);
          return;
        }

        guardarPareja(r.reto);
        setCodigo('');
        setAviso(null);
        setEscribiendo(false);
      })
      // Si la búsqueda se cae, el código que escribió la persona no tiene la
      // culpa y no se le dice que lo revise.
      .catch(() => setAviso(MOTIVOS_ENTRADA['sin-nube']));
  };

  const compartir = () => {
    const mensaje = textoParaInvitar(reto, hoy);
    if (!mensaje) return;
    Share.share({ message: mensaje }).catch(() => {
      // Cerrar el compartir no es un error y no se comenta.
    });
  };

  const otroCodigo = () => {
    guardarPareja(renovarInvitacion(reto, { codigo: generarCodigo(), hoy }));
    setDicho(null);
  };

  const sumarHoy = () => {
    const siguiente = sumar(reto, { quien: yo, hoy });
    setHito(hitoAlcanzado(reto, siguiente));
    guardarPareja(siguiente);
  };

  // Un toque, sin preguntar dos veces y sin mandarle nada a nadie.
  const salirme = () => {
    guardarPareja(salir(reto, yo));
    setHito(null);
    setAviso(null);
    setDicho(textoAlSalir());
  };

  // El reto avanza desde el momento en que existe, aunque todavía esté solo
  // una persona: el texto de 'esperando' dice "mientras llega, puedes ir
  // sumando tú", y antes no había ningún botón con el que hacerlo.
  const hayReto = !!reto;

  return (
    <Pantalla contentStyle={est.contenido}>
      <Aparece orden={0}>
        <View>
          <Text style={est.titulo}>Un reto de dos</Text>
          <Text style={est.intro}>{textoDeEstado(reto, hoy)}</Text>
          {!!dicho && <Text style={est.dicho}>{dicho}</Text>}
        </View>
      </Aparece>

      {estado === 'sin' && !escribiendo && (
        <Aparece orden={1}>
          <Tarjeta>
            <Etiqueta>elige el reto</Etiqueta>
            {RETOS_PAREJA.map((r) => (
              <Pressable
                key={r.clave}
                onPress={() => setElegido(r.clave)}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegido === r.clave }}
                accessibilityLabel={`${r.titulo}. ${r.texto}`}
                style={[est.opcion, elegido === r.clave && est.opcionElegida]}
              >
                <Text style={est.opcionTitulo}>{r.titulo}</Text>
                <Text style={est.opcionTexto}>{r.texto}</Text>
              </Pressable>
            ))}
          </Tarjeta>
        </Aparece>
      )}

      {/* Solo con la invitación viva. Con el código vencido esta tarjeta
          seguía en pantalla y el botón de compartir también, así que se podía
          mandar por WhatsApp un código que al otro lado ya no abre nada. */}
      {estado === 'esperando' && (
        <Aparece orden={1}>
          <Tarjeta>
            <Etiqueta>tu código</Etiqueta>
            <Text style={est.codigo}>{formatearCodigo(reto.codigo)}</Text>
            <Text style={est.compania}>
              Se dicta en voz alta sin equivocarse: aquí no van la o ni el uno.
            </Text>
          </Tarjeta>
        </Aparece>
      )}

      {hayReto && (
        <Aparece orden={1}>
          <Tarjeta>
            <Etiqueta>lo que llevan</Etiqueta>
            <View style={est.riel}>
              <View style={[est.avance, { width: `${paso.fraccion * 100}%` }]} />
            </View>
            <Text style={est.frase}>{textoDeAvance(reto)}</Text>
            {!!textoDeCompania(reto, yo, hoy) && (
              <Text style={est.compania}>{textoDeCompania(reto, yo, hoy)}</Text>
            )}
          </Tarjeta>
        </Aparece>
      )}

      {!!hito && (
        <Aparece orden={2}>
          <Tarjeta>
            <Etiqueta>{hito.titulo}</Etiqueta>
            <Text style={est.frase}>{hito.texto}</Text>
          </Tarjeta>
        </Aparece>
      )}

      {escribiendo && (
        <Aparece orden={2}>
          <Tarjeta>
            <Etiqueta>el código que te pasaron</Etiqueta>
            <TextInput
              value={codigo}
              onChangeText={(t) => {
                setCodigo(t);
                setAviso(null);
              }}
              placeholder="ABC-D23"
              placeholderTextColor={C.apagado}
              style={est.entrada}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={9}
            />
            {!!aviso && <Text style={est.aviso}>{aviso}</Text>}
          </Tarjeta>
        </Aparece>
      )}

      {!escribiendo && !!aviso && <Text style={est.aviso}>{aviso}</Text>}

      <View style={est.acciones}>
        {estado === 'sin' && !escribiendo && <Boton onPress={armar}>Armar el reto</Boton>}

        {escribiendo && <Boton onPress={entrar}>Entrar al reto</Boton>}

        {estado === 'esperando' && <Boton onPress={compartir}>Compartir el código</Boton>}

        {estado === 'vencida' && <Boton onPress={otroCodigo}>Dame otro código</Boton>}

        {hayReto && estado !== 'completo' && (
          <Boton onPress={sumarHoy} disabled={hecho} variante={hecho ? 'salvia' : 'coral'}>
            {textoDelBoton(reto, yo, hoy)}
          </Boton>
        )}
      </View>

      {estado === 'sin' && (
        <Pressable
          onPress={() => {
            setEscribiendo((v) => !v);
            setAviso(null);
            setDicho(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="Entrar con un código que me pasaron"
          style={est.enlace}
        >
          <Text style={est.enlaceTexto}>
            {escribiendo ? 'Mejor armo el mío' : 'Me pasaron un código'}
          </Text>
        </Pressable>
      )}

      {estado === 'solo' && (
        <Pressable
          onPress={otroCodigo}
          accessibilityRole="button"
          accessibilityLabel="Invitar a otra persona"
          style={est.enlace}
        >
          <Text style={est.enlaceTexto}>Invitar a alguien</Text>
        </Pressable>
      )}

      {hayReto && (
        <Pressable
          onPress={salirme}
          accessibilityRole="button"
          accessibilityLabel="Salir del reto"
          style={est.enlace}
        >
          <Text style={est.salirTexto}>Salir del reto</Text>
        </Pressable>
      )}

      <Text style={est.nota}>
        El reto es de los dos y avanza con lo que haga cualquiera. Lo que puso cada quien no se
        cuenta en ninguna parte.
      </Text>
    </Pantalla>
  );
}
