import { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import { useUsuario } from '../state/UsuarioContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Etiqueta from '../components/Etiqueta';
import Boton from '../components/Boton';
import Aparece from '../components/Aparece';
import Chispa from '../components/Chispa';
import {
  RETO_INICIAL,
  resumenDeAhorro,
  montosSugeridos,
  fijarMonto,
  pausar,
  reanudar,
  mensajeDelReto,
  textoDeLoApartado,
  textoDesdeCuando,
  textoDeCuandoRige,
  formatoMonto,
} from '../services/ahorro';

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
  filaCifra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.md,
  },
  cifra: {
    fontSize: 38,
    fontWeight: '800',
    color: C.salviaTexto,
    lineHeight: 44,
  },
  detalle: {
    ...T.cuerpo,
    marginTop: S.sm,
  },
  desde: {
    ...T.secundario,
    fontSize: 13,
    marginTop: 2,
  },
  cadaDia: {
    ...T.subtitulo,
    marginTop: S.md,
  },
  filaAcciones: {
    flexDirection: 'row',
    gap: S.xl,
    marginTop: S.md,
  },
  enlace: {
    paddingVertical: S.sm,
  },
  enlaceTexto: {
    ...T.secundario,
    color: C.coralTexto,
    fontWeight: '700',
  },
  ayuda: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.md,
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
    paddingHorizontal: S.lg,
  },
  chipElegido: {
    borderColor: C.coral,
    backgroundColor: C.coralSuave,
  },
  chipTexto: {
    ...T.cuerpo,
    color: C.gris,
  },
  chipTextoElegido: {
    color: C.cafe,
    fontWeight: '700',
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
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.lg,
  },
  medalla: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.crema,
    borderWidth: 1.5,
    borderColor: C.borde,
  },
  medallaGanada: {
    borderColor: C.salvia,
  },
  centro: {
    flex: 1,
  },
  nombreHito: {
    ...T.subtitulo,
    fontSize: 16,
  },
  nombrePendiente: {
    color: C.gris,
  },
  textoHito: {
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

// El reto de ahorro: el mismo día que te mueves, apartas algo pequeño.
//
// Todo lo que decide esta pantalla vive en services/ahorro.js y en
// services/hormiga.js. Aquí solo se pinta, y hay cuatro cosas que se pintan a
// propósito:
//
// 1. El total NUNCA baja. Ni al romper la racha, ni al bajar la cantidad, ni
//    al pausar. Un número que baja por haber fallado es un castigo con forma
//    de cifra, y el dinero avergüenza todavía más que la comida.
// 2. No hay barra de meta ni porcentaje. Una meta de dinero convierte esto en
//    una deuda consigo mismo.
// 3. Los hitos se miden en días, no en cantidad: es lo único que aparta igual
//    quien tiene mucho y quien tiene poco.
// 4. Lo pequeño que se repite se enseña como dato en pasado, nunca como una
//    lista de lo que habría que quitar. La app no dice en qué NO gastar.
export default function Ahorro() {
  const est = useEstilos(crear);
  const { C } = useTema();
  const usuario = useUsuario();
  const { hoy, perfil, diasCompletados, rota, guardarAhorro } = usuario;

  // El reto vive en el estado global, que se persiste solo. Esta pantalla es
  // de pila: se desmonta al volver atrás, y con el monto en un useState lo
  // apartado desaparecía por navegar. Perder dinero por salir de una pantalla
  // es justo el castigo que este módulo promete no hacer.
  const reto = usuario.ahorro ?? RETO_INICIAL;
  const guardarReto = (siguiente) => guardarAhorro({ tramos: siguiente.tramos });
  const gastos = usuario.gastos ?? [];

  const [eligiendo, setEligiendo] = useState(false);
  const [escrito, setEscrito] = useState('');

  const resumen = useMemo(
    () => resumenDeAhorro(diasCompletados, reto, hoy),
    [diasCompletados, reto, hoy],
  );

  const sugeridos = useMemo(() => montosSugeridos(gastos), [gastos]);
  const desdeCuando = textoDesdeCuando(reto);
  const cuandoRige = textoDeCuandoRige(reto, hoy);

  const nuncaEmpezo = !resumen.activo && resumen.dias === 0;
  const mostrarElector = eligiendo || nuncaEmpezo;
  const cantidad = Math.round(Number(escrito.replace(/\D/g, ''))) || 0;

  // Los días marcados viajan al servicio: con ellos sabe si hoy ya contó y no
  // vuelve a calcular un día que ya se apartó.
  const confirmar = () => {
    guardarReto(fijarMonto(reto, cantidad, hoy, diasCompletados));
    setEligiendo(false);
    setEscrito('');
  };

  return (
    <Pantalla contentStyle={est.contenido}>
      <Aparece orden={0}>
        <View>
          <Text style={est.titulo}>Lo que apartas</Text>
          <Text style={est.frase}>
            {mensajeDelReto({
              activo: resumen.activo,
              dias: resumen.dias,
              hoyApartado: resumen.hoyApartado,
              rota,
              nombre: perfil?.nombre,
            })}
          </Text>
        </View>
      </Aparece>

      {/* El total. Solo sube: los días que no se pudieron no restan, no
          suman. */}
      <Aparece orden={1}>
        <Tarjeta>
          <Etiqueta>lo que llevas apartado</Etiqueta>
          <View style={est.filaCifra}>
            <Chispa size={22} color={C.salvia} />
            <Text style={est.cifra}>{formatoMonto(resumen.total)}</Text>
          </View>
          <Text style={est.detalle}>{textoDeLoApartado(resumen)}</Text>
          {!!desdeCuando && <Text style={est.desde}>{desdeCuando}</Text>}
        </Tarjeta>
      </Aparece>

      {resumen.activo && (
        <Aparece orden={2}>
          <Tarjeta>
            <Etiqueta>cada día que te mueves</Etiqueta>
            <Text style={est.cadaDia}>{formatoMonto(resumen.monto)}</Text>
            {!!cuandoRige && <Text style={est.desde}>{cuandoRige}</Text>}

            <View style={est.filaAcciones}>
              <Pressable
                onPress={() => {
                  setEscrito(String(resumen.monto));
                  setEligiendo((v) => !v);
                }}
                accessibilityRole="button"
                accessibilityLabel="Cambiar cuánto aparto cada día"
                style={est.enlace}
              >
                <Text style={est.enlaceTexto}>{eligiendo ? 'Dejar así' : 'Cambiar cuánto'}</Text>
              </Pressable>

              <Pressable
                onPress={() => guardarReto(pausar(reto, hoy))}
                accessibilityRole="button"
                accessibilityLabel="Pausar el reto de ahorro"
                style={est.enlace}
              >
                <Text style={est.enlaceTexto}>Pausar</Text>
              </Pressable>
            </View>
          </Tarjeta>
        </Aparece>
      )}

      {/* En pausa con días ya apartados: se ofrece volver, sin insistir. */}
      {!resumen.activo && !nuncaEmpezo && (
        <Aparece orden={2}>
          <Boton
            variante="suave"
            onPress={() => guardarReto(reanudar(reto, hoy, null, diasCompletados))}
          >
            Volver a apartar
          </Boton>
        </Aparece>
      )}

      {mostrarElector && (
        <Aparece orden={3}>
          <Tarjeta>
            <Etiqueta>cuánto apartas</Etiqueta>
            <Text style={est.ayuda}>
              Pequeño está bien. Lo que sostiene esto es hacerlo seguido, no la cantidad.
            </Text>

            <View style={est.chips}>
              {sugeridos.map((m) => {
                const elegido = cantidad === m;

                return (
                  <Pressable
                    key={m}
                    onPress={() => setEscrito(String(m))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: elegido }}
                    accessibilityLabel={`Apartar ${formatoMonto(m)} cada día`}
                    style={[est.chip, elegido && est.chipElegido]}
                  >
                    <Text style={[est.chipTexto, elegido && est.chipTextoElegido]}>
                      {formatoMonto(m)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={escrito}
              onChangeText={setEscrito}
              placeholder="U otra cantidad"
              placeholderTextColor={C.apagado}
              keyboardType="number-pad"
              style={est.entrada}
              accessibilityLabel="Escribe cuánto quieres apartar cada día"
            />

            <Boton onPress={confirmar} disabled={cantidad === 0}>
              {resumen.activo ? 'Guardar' : 'Empezar'}
            </Boton>
          </Tarjeta>
        </Aparece>
      )}

      {/* A dónde se fue lo pequeño VIVE EN LA PANTALLA DE DINERO, no aquí.
          Se pintaba en las dos, con los mismos títulos y las mismas tarjetas.
          hormiga.js limita a tres hallazgos justo porque una lista larga se
          lee como una lista de reproches, y repetirla en dos sitios deshace
          esa contención en lo más delicado de tono de toda la app. Esta
          pantalla es la de lo que se aparta; la de a dónde se va es Dinero. */}

      {/* Los hitos aparecen cuando ya hay algo que medir. Enseñarle cuatro
          hitos por conseguir a quien todavía no ha empezado convierte la
          pantalla en una lista de deudas consigo mismo. */}
      {(resumen.activo || resumen.dias > 0) &&
        resumen.hitos.map((h, i) => (
          <Aparece key={h.clave} orden={5 + i}>
            <Tarjeta>
              <View style={est.fila}>
                <View style={[est.medalla, h.ganado && est.medallaGanada]}>
                  <Chispa size={18} color={h.ganado ? C.salvia : C.apagado} />
                </View>

                <View style={est.centro}>
                  <Text style={[est.nombreHito, !h.ganado && est.nombrePendiente]}>{h.titulo}</Text>
                  <Text style={est.textoHito}>{h.texto}</Text>

                  {/* Lo que falta se ve como avance, no como candado. */}
                  {!h.ganado && h.meta > 1 && (
                    <>
                      <View style={est.riel}>
                        <View style={[est.avance, { width: `${h.fraccion * 100}%` }]} />
                      </View>
                      <Text style={est.cuenta}>
                        {h.valor} de {h.meta} días
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </Tarjeta>
          </Aparece>
        ))}

      <Text style={est.nota}>
        Esto no gana intereses ni promete nada. Es tuyo, y si un día no se pudo, lo apartado sigue
        aquí.
      </Text>
    </Pantalla>
  );
}
