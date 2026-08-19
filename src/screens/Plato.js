import { useState } from 'react';
import { View, Text, Image } from 'react-native';

import { useEstilos } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';
import Latido from '../components/Latido';
import PuntoSemaforo from '../components/PuntoSemaforo';

import { mirarPlato, hayApi } from '../lib/api';
import { encoger, ANCHO_PLATO } from '../lib/imagen';
import { tomarFoto, elegirFoto } from '../lib/selector';

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
  foto: {
    width: '100%',
    height: 220,
    borderRadius: R.medio,
    backgroundColor: C.crema,
    marginBottom: S.lg,
  },
  filaPlato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.md,
  },
  nombrePlato: {
    ...T.titulo,
    flex: 1,
  },
  suma: {
    ...T.cuerpo,
    marginTop: S.md,
  },
  mensaje: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.md,
  },
  botones: {
    gap: S.md,
  },
  nota: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
  },
});

const SIN_PLATO = {
  titulo: 'No veo un plato ahí.',
  cuerpo: 'Prueba con otra foto, de frente y con luz.',
};

const SIN_RED = {
  titulo: 'No pude mirarlo ahora.',
  cuerpo: 'Puede ser la señal. Inténtalo más tarde y aquí sigo.',
};

const SIN_FOTO = {
  titulo: 'No pude preparar la foto.',
  cuerpo: 'Prueba tomándola otra vez desde la app.',
};

// El semáforo del plato.
//
// Lo que esta pantalla NO hace, y es a propósito: no cuenta calorías, no
// reparte macros y no califica lo que alguien come. La regla 1 del producto
// dice que eso no se toca, y quien usa Brío ya probó una app que sí lo hacía.
//
// Lo que hace es mirar el plato y decir UNA cosa para sumarle. Tips de suma,
// no de resta, igual que los del plan.
export default function Plato() {
  const est = useEstilos(crear);

  const [vista, setVista] = useState(null); // uri de lo que se está mirando
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [aviso, setAviso] = useState(null);

  const mirar = async (traerFoto) => {
    setAviso(null);
    const elegida = await traerFoto();
    if (!elegida) return; // canceló o dijo que no al permiso: sin reproche

    setVista(elegida.uri);
    setResultado(null);
    setCargando(true);

    try {
      const { base64 } = await encoger(elegida.uri, { ancho: ANCHO_PLATO, base64: true });
      if (!base64) {
        setAviso(SIN_FOTO);
        return;
      }

      const respuesta = await mirarPlato(base64);
      if (!respuesta) setAviso(SIN_RED);
      else if (!respuesta.hayPlato) setAviso(SIN_PLATO);
      else setResultado(respuesta);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Pantalla contentStyle={est.contenido}>
      <View>
        <Text style={est.titulo}>Mírame el plato</Text>
        <Text style={est.intro}>
          No cuento calorías ni nada por el estilo. Miro qué se ve y te digo una cosa para
          sumarle.
        </Text>
      </View>

      {!!vista && <Image source={{ uri: vista }} style={est.foto} resizeMode="cover" />}

      {cargando && <Latido />}

      {!cargando && !!resultado && (
        <Tarjeta>
          <Etiqueta>tu plato</Etiqueta>
          <View style={est.filaPlato}>
            <PuntoSemaforo color={resultado.color} size={14} />
            <Text style={est.nombrePlato}>{resultado.plato}</Text>
          </View>
          <Text style={est.suma}>{resultado.suma}</Text>
          <Text style={est.mensaje}>{resultado.mensaje}</Text>
        </Tarjeta>
      )}

      {!cargando && !!aviso && (
        <Tarjeta>
          <Etiqueta>brío te dice</Etiqueta>
          <Text style={est.suma}>{aviso.titulo}</Text>
          <Text style={est.mensaje}>{aviso.cuerpo}</Text>
        </Tarjeta>
      )}

      {!cargando && (
        <View style={est.botones}>
          <Boton onPress={() => mirar(tomarFoto)}>
            {resultado || aviso ? 'Mirar otro plato' : 'Tomar la foto'}
          </Boton>
          <Boton variante="suave" onPress={() => mirar(elegirFoto)}>
            Buscar en mis fotos
          </Boton>
        </View>
      )}

      {/* Se dice porque es verdad y porque es lo que la hace usable: pedirle
          a alguien una foto de lo que come sin decirle dónde termina esa foto
          es exactamente lo que nadie debería hacer. */}
      <Text style={est.nota}>
        {hayApi
          ? 'La foto no se guarda en ninguna parte. Se mira y se va.'
          : 'Esto necesita conexión con Brío. Todavía no está configurada.'}
      </Text>
    </Pantalla>
  );
}
