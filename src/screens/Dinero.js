import { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';
import Aparece from '../components/Aparece';
import Latido from '../components/Latido';
import PuntoSemaforo from '../components/PuntoSemaforo';

import { leerFactura, hayApi } from '../lib/api';
import { encoger, ANCHO_PLATO } from '../lib/imagen';
import { tomarFoto, elegirFoto } from '../lib/selector';
import { claveDia, fechaLargaDeClave } from '../services/fecha';
import {
  CATEGORIAS,
  analizarGasto,
  formatearMonto,
  gastosDelMes,
  pareceRecurrente,
  siguienteId,
  tituloDeCategoria,
  ultimos,
} from '../services/gastos';
import {
  TITULO_HORMIGAS,
  TITULO_SUSCRIPCIONES,
  hallazgosDeGasto,
} from '../services/hormiga';
import {
  PRESUPUESTO_VACIO,
  avisoDelMes,
  estadoDelMes,
  estadoPorCategoria,
  fijarMensual,
  textoDeLoQueQueda,
  textoDeSugerencia,
  topeDesdeTexto,
  topeSugerido,
} from '../services/presupuesto';

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
  entrada: {
    ...T.cuerpo,
    marginTop: S.md,
    backgroundColor: C.crema,
    borderRadius: R.chico,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    minHeight: 52,
  },
  lectura: {
    marginTop: S.md,
  },
  monto: {
    fontSize: 30,
    fontWeight: '800',
    color: C.cafe,
    lineHeight: 38,
  },
  leido: {
    ...T.secundario,
    marginTop: 2,
  },
  duda: {
    ...T.secundario,
    color: C.coralTexto,
    marginTop: S.sm,
  },
  chips: {
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
    fontSize: 14,
    color: C.gris,
  },
  chipTextoElegido: {
    color: C.cafe,
    fontWeight: '700',
  },
  boton: {
    marginTop: S.lg,
  },
  botones: {
    gap: S.md,
    marginTop: S.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.md,
  },
  gastado: {
    fontSize: 34,
    fontWeight: '800',
    color: C.cafe,
    lineHeight: 40,
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
  },
  pie: {
    ...T.secundario,
    marginTop: S.md,
  },
  filaCategoria: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: S.sm,
    marginTop: S.lg,
  },
  categoria: {
    ...T.cuerpo,
    flex: 1,
  },
  cifra: {
    ...T.cuerpo,
    fontWeight: '700',
  },
  tope: {
    ...T.secundario,
    fontSize: 13,
    marginTop: 2,
  },
  hallazgo: {
    marginTop: S.md,
  },
  gasto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.md,
  },
  centro: {
    flex: 1,
  },
  fecha: {
    ...T.secundario,
    fontSize: 13,
  },
  quitar: {
    paddingVertical: S.xs,
    paddingHorizontal: S.sm,
  },
  quitarTexto: {
    ...T.secundario,
    fontSize: 13,
    color: C.coralTexto,
  },
  cambiar: {
    alignItems: 'center',
    paddingVertical: S.md,
  },
  cambiarTexto: {
    ...T.secundario,
    color: C.coralTexto,
    fontWeight: '700',
  },
  cierre: {
    ...T.secundario,
    fontSize: 13,
    textAlign: 'center',
  },
});

const SIN_FACTURA = 'No le veo una factura a esa foto. Prueba de frente y con luz.';
const SIN_RED = 'No pude leerla ahora. Puede ser la señal, y el renglón de arriba sirve igual.';
const SIN_FOTO = 'No pude preparar la foto. Prueba tomándola otra vez desde la app.';

// "No hay conexión configurada" y "la red falló" no son lo mismo, y decirle a
// alguien que revise la señal cuando el problema es que la app no tiene
// servidor es mandarlo a buscar donde no hay nada.
const SIN_API =
  'Leer facturas necesita la conexión con Brío, que todavía no está puesta. El renglón de arriba funciona igual, con señal o sin ella.';

// Un rótulo de tirilla que le da órdenes a la persona no puede acabar de
// nota. El validador del servidor deja pasar el comercio sin juzgarlo —y
// hace bien, porque "Farmacia El Ahorro" es un nombre propio y rechazarlo
// dejaba a la gente con una factura perfectamente legible sin poder usarla—,
// pero esa nota SÍ se guarda y se muestra. Aquí se filtra solo lo que suena
// a consejo, no lo que suena a marca.
const RETORICA = /\b(ahorra|compra|aprovecha|no\s+te\s+lo\s+pierdas|controla|cuida\s+tu|invierte|paga\s+menos|llevate|gana)\b/i;

function comercioComoNota(comercio) {
  const limpio = String(comercio ?? '').trim();
  if (!limpio) return '';
  return RETORICA.test(limpio) ? '' : limpio;
}

// Tu dinero: anotar lo que se fue y ver cómo va el mes.
//
// LA REGLA DE ESTA PANTALLA
// El dinero avergüenza más que la comida, y quien usa Brío ya se critica solo.
// Aquí no hay alarmas rojas, ni "te pasaste", ni consejos sobre en qué no
// gastar, ni comparaciones con nadie. Se anota, se suma y se muestra.
//
// El semáforo es el mismo del resto del producto y significa lo mismo: informa
// y nunca castiga. El rojo dice "el mes pasó el número que TÚ pusiste", en
// pasado, y ahí se acaba la frase.
//
// Y anotar tiene que costar un renglón: "almuerzo 12 mil" y ya. El día que
// haya que pelear con un formulario de tres campos se deja de anotar, y una
// app de gastos sin gastos no sirve para nada. La factura por foto es el
// atajo para cuando el renglón da pereza, no el camino principal: necesita
// red, y esto tiene que funcionar en un bus sin señal.
export default function Dinero() {
  const est = useEstilos(crear);
  const { C, SEMAFORO } = useTema();
  // Los tres nombres son los que expone UsuarioContext, ni uno más: lo que se
  // anota aquí va al estado global y a la cola, y sobrevive a salir de la
  // pantalla. Un respaldo local "por si acaso" solo sirve para que un nombre
  // mal escrito pase desapercibido y los gastos se pierdan en silencio.
  const {
    hoy,
    perfil,
    gastos,
    presupuesto,
    anotarGasto,
    borrarGasto,
    guardarPresupuesto,
  } = useUsuario();

  const [texto, setTexto] = useState('');
  const [pendiente, setPendiente] = useState(null); // lo que salió de una factura
  const [categoriaElegida, setCategoriaElegida] = useState(null);
  const [editandoTope, setEditandoTope] = useState(false);
  const [textoTope, setTextoTope] = useState('');
  const [mirando, setMirando] = useState(false);
  const [avisoFoto, setAvisoFoto] = useState(null);

  const lista = useMemo(() => gastos ?? [], [gastos]);
  const pre = presupuesto ?? PRESUPUESTO_VACIO;

  const lectura = useMemo(
    () => (texto.trim() ? analizarGasto(texto, { gastos: lista, hoy }) : null),
    [texto, lista, hoy],
  );

  const estado = useMemo(
    () => estadoDelMes({ gastos: lista, presupuesto: pre, hoy }),
    [lista, pre, hoy],
  );

  const filas = useMemo(
    () => estadoPorCategoria({ gastos: lista, presupuesto: pre, hoy }),
    [lista, pre, hoy],
  );

  const delMes = useMemo(() => gastosDelMes(lista, estado.mes), [lista, estado.mes]);
  const recientes = useMemo(() => ultimos(delMes, 6), [delMes]);
  const sugerido = useMemo(() => topeSugerido(lista, hoy), [lista, hoy]);

  // Lo pequeño y repetido, y lo que se cobra solo. Sale de hormiga.js con
  // TODO el historial y no solo con el mes: un patrón de dos meses no cabe en
  // uno. Devuelve lista vacía a menudo, y así tiene que ser.
  const hallazgos = useMemo(() => hallazgosDeGasto(lista, hoy), [lista, hoy]);
  const hormigas = hallazgos.filter((h) => h.grupo === 'hormigas');
  const cobros = hallazgos.filter((h) => h.grupo === 'suscripciones');

  // Escrito a mano o leído de una factura, lo que se va a guardar es lo mismo
  // y se confirma en el mismo sitio. Dos caminos para entrar, una sola puerta.
  const propuesta = pendiente ?? (lectura?.ok ? lectura.gasto : null);
  const categoria = categoriaElegida ?? propuesta?.categoria;
  const dudosa = pendiente ? pendiente.categoria === 'otros' : lectura?.segura === false;

  const escribir = (valor) => {
    setTexto(valor);
    setPendiente(null);
    setAvisoFoto(null);
    setCategoriaElegida(null);
  };

  const anotar = () => {
    if (!propuesta) return;

    anotarGasto({ ...propuesta, categoria: categoria ?? 'otros' });

    setTexto('');
    setPendiente(null);
    setCategoriaElegida(null);
  };

  // Se manda el presupuesto entero y no solo el número: `fijarMensual` es la
  // misma función que usa el resto del módulo, así que "quitar el tope"
  // significa exactamente lo mismo aquí y en las reglas.
  const guardarTope = () => {
    guardarPresupuesto(fijarMensual(pre, topeDesdeTexto(textoTope)));

    setTextoTope('');
    setEditandoTope(false);
  };

  // La factura por foto. Lo que vuelve NO se guarda solo: un OCR se equivoca, y
  // un número mal leído que se anota solo es un número que la persona ve como
  // suyo sin haberlo aprobado. Aquí se propone; confirma ella.
  const mirarFactura = async (traerFoto) => {
    setAvisoFoto(null);
    const elegida = await traerFoto();
    if (!elegida) return; // canceló o dijo que no al permiso: sin reproche

    setMirando(true);

    try {
      const { base64 } = await encoger(elegida.uri, { ancho: ANCHO_PLATO, base64: true });
      if (!base64) {
        setAvisoFoto(SIN_FOTO);
        return;
      }

      const respuesta = await leerFactura(base64, 'image/jpeg');

      // `null` significa dos cosas distintas y se dicen distinto: sin API no
      // hay nada que esperar, y con API es la red, que vuelve.
      if (!respuesta) setAvisoFoto(hayApi ? SIN_RED : SIN_API);
      else if (!respuesta.hayFactura) setAvisoFoto(SIN_FACTURA);
      else {
        // El comercio se lee de la tirilla y por eso el validador lo deja
        // pasar sin juzgarlo: "Farmacia El Ahorro" es un nombre propio, no
        // una opinión. Pero la nota SÍ se guarda y se muestra, así que un
        // rótulo como "Ahorra con nosotros" entraría a la pantalla en
        // imperativo y sin filtro. El comercio solo sirve de nota si no trae
        // un verbo de los que la app no usa.
        const nota = respuesta.nota || comercioComoNota(respuesta.comercio) || '';
        setTexto('');
        setCategoriaElegida(null);
        setPendiente({
          id: siguienteId(lista),
          fecha: respuesta.fecha ?? claveDia(hoy),
          monto: respuesta.monto,
          categoria: respuesta.categoria,
          nota,
          recurrente: pareceRecurrente(nota),
        });
      }
    } finally {
      setMirando(false);
    }
  };

  return (
    <Pantalla contentStyle={est.contenido}>
      <Aparece orden={0}>
        <View>
          <Text style={est.titulo}>Tu dinero</Text>
          <Text style={est.frase}>{avisoDelMes(estado, perfil?.nombre)}</Text>
        </View>
      </Aparece>

      {/* Anotar. Un renglón escrito como se habla, y la app entiende. */}
      <Aparece orden={1}>
        <Tarjeta>
          <Etiqueta>anotar un gasto</Etiqueta>
          <TextInput
            value={texto}
            onChangeText={escribir}
            onSubmitEditing={anotar}
            placeholder="almuerzo 12 mil"
            placeholderTextColor={C.apagado}
            style={est.entrada}
            returnKeyType="done"
          />

          {!!propuesta && (
            <View style={est.lectura}>
              <Text style={est.monto}>{formatearMonto(propuesta.monto)}</Text>
              <Text style={est.leido}>
                {propuesta.nota ? `${propuesta.nota} · ` : ''}
                {tituloDeCategoria(categoria)}
                {propuesta.recurrente ? ' · se repite cada mes' : ''}
                {propuesta.fecha !== claveDia(hoy) ? ` · ${fechaLargaDeClave(propuesta.fecha)}` : ''}
              </Text>

              {/* Lo que no está claro se dice. Adivinar en silencio termina en
                  un mes lleno de "otros" que nadie revisó. */}
              {dudosa && !categoriaElegida && (
                <Text style={est.duda}>
                  No tengo clara la categoría. Tócala aquí abajo si va en otra parte.
                </Text>
              )}

              <View style={est.chips}>
                {CATEGORIAS.map((c) => (
                  <Pressable
                    key={c.clave}
                    onPress={() => setCategoriaElegida(c.clave)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: categoria === c.clave }}
                    accessibilityLabel={`Guardarlo en ${c.titulo}`}
                    style={[est.chip, categoria === c.clave && est.chipElegido]}
                  >
                    <Text style={[est.chipTexto, categoria === c.clave && est.chipTextoElegido]}>
                      {c.titulo}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* `length > 0` y no `texto.trim()` a secas: una cadena vacía se
              intenta pintar como texto suelto y revienta la pantalla. */}
          {texto.trim().length > 0 && !propuesta && (
            <Text style={est.duda}>{lectura?.mensaje}</Text>
          )}

          <Boton onPress={anotar} disabled={!propuesta} style={est.boton}>
            Anotar
          </Boton>
        </Tarjeta>
      </Aparece>

      {/* La factura por foto: el atajo, no el camino principal. */}
      <Aparece orden={2}>
        <Tarjeta>
          <Etiqueta>o léela de una factura</Etiqueta>

          {/* Sin API los botones no se pintan: un botón que no puede funcionar
              y encima culpa a la señal enseña a desconfiar de la pantalla. */}
          {mirando && <Latido />}

          {!mirando && hayApi && (
            <View style={est.botones}>
              <Boton variante="suave" onPress={() => mirarFactura(tomarFoto)}>
                Tomar la foto
              </Boton>
              <Boton variante="suave" onPress={() => mirarFactura(elegirFoto)}>
                Buscar en mis fotos
              </Boton>
            </View>
          )}

          <Text style={est.pie}>
            {avisoFoto ??
              (hayApi ? 'La foto no se guarda en ninguna parte. Se lee y se va.' : SIN_API)}
          </Text>
        </Tarjeta>
      </Aparece>

      {/* El mes. Cuánto va y cuánto queda, sin dramatismo. */}
      <Aparece orden={3}>
        <Tarjeta>
          <Etiqueta>este mes</Etiqueta>
          <View style={est.fila}>
            {!!estado.color && <PuntoSemaforo color={estado.color} size={14} />}
            <Text style={est.gastado}>{formatearMonto(estado.gastado)}</Text>
          </View>

          {estado.hay && (
            <View style={est.riel}>
              <View
                style={[
                  est.avance,
                  {
                    width: `${Math.min(estado.fraccion, 1) * 100}%`,
                    backgroundColor: SEMAFORO[estado.color],
                  },
                ]}
              />
            </View>
          )}

          <Text style={est.pie}>{textoDeLoQueQueda(estado) ?? textoDeSugerencia(sugerido)}</Text>
        </Tarjeta>
      </Aparece>

      {/* El tope es de la persona: se pone, se cambia o se quita cuando quiera. */}
      <Pressable
        onPress={() => setEditandoTope((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={estado.hay ? 'Cambiar el tope del mes' : 'Ponerle un tope al mes'}
        style={est.cambiar}
      >
        <Text style={est.cambiarTexto}>
          {editandoTope
            ? 'Ahora no'
            : estado.hay
              ? 'Cambiar mi tope del mes'
              : 'Ponerle un tope al mes'}
        </Text>
      </Pressable>

      {editandoTope && (
        <Aparece orden={4}>
          <Tarjeta>
            <Etiqueta>tu tope del mes</Etiqueta>
            <Text style={est.pie}>{textoDeSugerencia(sugerido)}</Text>
            <TextInput
              value={textoTope}
              onChangeText={setTextoTope}
              onSubmitEditing={guardarTope}
              placeholder="600 mil"
              placeholderTextColor={C.apagado}
              style={est.entrada}
              returnKeyType="done"
            />
            <Boton
              variante="suave"
              onPress={guardarTope}
              disabled={!textoTope.trim()}
              style={est.boton}
            >
              {topeDesdeTexto(textoTope) ? 'Guardar el tope' : 'Quitar el tope'}
            </Boton>
          </Tarjeta>
        </Aparece>
      )}

      {/* A dónde se fue. Es información, no una lista de culpas. */}
      {filas.length > 0 && (
        <Aparece orden={5}>
          <Tarjeta>
            <Etiqueta>a dónde se fue</Etiqueta>
            {filas.map((f) => (
              <View key={f.clave}>
                <View style={est.filaCategoria}>
                  {!!f.color && <PuntoSemaforo color={f.color} size={10} />}
                  <Text style={est.categoria}>{f.titulo}</Text>
                  <Text style={est.cifra}>{formatearMonto(f.gastado)}</Text>
                </View>
                {!!f.tope && (
                  <Text style={est.tope}>de {formatearMonto(f.tope)} que pusiste aquí</Text>
                )}
              </View>
            ))}
          </Tarjeta>
        </Aparece>
      )}

      {/* Lo pequeño y repetido, y lo que se cobra solo. Cada línea es un dato
          en pasado: cuántas veces pasó y cuánto sumó. No hay consejo, ni
          adjetivo, ni nada que decir sobre en qué gastó nadie su plata. */}
      {hormigas.length > 0 && (
        <Aparece orden={6}>
          <Tarjeta>
            <Etiqueta>{TITULO_HORMIGAS}</Etiqueta>
            {hormigas.map((h) => (
              <View key={h.clave} style={est.hallazgo}>
                <Text style={est.categoria}>{h.titulo}</Text>
                <Text style={est.tope}>{h.texto}</Text>
              </View>
            ))}
          </Tarjeta>
        </Aparece>
      )}

      {cobros.length > 0 && (
        <Aparece orden={7}>
          <Tarjeta>
            <Etiqueta>{TITULO_SUSCRIPCIONES}</Etiqueta>
            {cobros.map((c) => (
              <View key={c.clave} style={est.hallazgo}>
                <Text style={est.categoria}>{c.titulo}</Text>
                <Text style={est.tope}>{c.texto}</Text>
              </View>
            ))}
          </Tarjeta>
        </Aparece>
      )}

      {recientes.length > 0 && (
        <Aparece orden={8}>
          <Tarjeta>
            <Etiqueta>lo último</Etiqueta>
            {recientes.map((g) => (
              <View key={g.id} style={est.gasto}>
                <View style={est.centro}>
                  <Text style={est.categoria}>{g.nota || tituloDeCategoria(g.categoria)}</Text>
                  <Text style={est.fecha}>{fechaLargaDeClave(g.fecha)}</Text>
                </View>
                <Text style={est.cifra}>{formatearMonto(g.monto)}</Text>
                <Pressable
                  onPress={() => borrarGasto(g.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${g.nota || 'este gasto'}`}
                  style={est.quitar}
                >
                  <Text style={est.quitarTexto}>Quitar</Text>
                </Pressable>
              </View>
            ))}
          </Tarjeta>
        </Aparece>
      )}

      <Text style={est.cierre}>
        Aquí no hay puntajes ni comparaciones con nadie. Un gasto no es una falta.
      </Text>
    </Pantalla>
  );
}
