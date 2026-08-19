import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';

import { useEstilos, useTema } from '../state/TemaContext';
import Pantalla from '../components/Pantalla';
import Tarjeta from '../components/Tarjeta';
import Boton from '../components/Boton';
import Etiqueta from '../components/Etiqueta';
import Chispa from '../components/Chispa';
import { useUsuario } from '../state/UsuarioContext';
import { claveDia, fechaLarga } from '../services/fecha';
import { semanasEnteras } from '../services/recorrido';
import { contarRegresos, contarRegresosLargos } from '../services/regresos';
import {
  pruebasDeLoQueHizo,
  insigniasGanadas,
  mensajeDeDiaDificil,
  cierreDeDiaDificil,
} from '../services/animo';
import { recordatorioDePorque } from '../services/porque';

function aFecha(clave) {
  const [a, m, d] = clave.split('-').map(Number);
  return new Date(a, m - 1, d);
}

const crear = ({ C, T, R, S }) => ({
  contenido: {
    paddingTop: S.lg,
  },
  pregunta: {
    ...T.subtitulo,
    marginTop: S.md,
  },
  entrada: {
    ...T.cuerpo,
    marginTop: S.md,
    backgroundColor: C.crema,
    borderRadius: R.chico,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  pie: {
    ...T.secundario,
    marginTop: S.md,
  },
  recordatorio: {
    backgroundColor: C.blanco,
    borderColor: C.salvia,
  },
  filaChispa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },
  mensajeDificil: {
    ...T.cuerpo,
    flex: 1,
    fontWeight: '600',
  },
  destacado: {
    borderColor: C.salvia,
  },
  fecha: {
    ...T.secundario,
    textTransform: 'lowercase',
  },
  logro: {
    ...T.cuerpo,
    marginTop: S.sm,
  },
  vacio: {
    ...T.cuerpo,
    color: C.gris,
  },
  prueba: {
    borderColor: C.salvia,
    paddingVertical: S.lg,
  },
  pruebaCifra: {
    fontSize: 34,
    fontWeight: '800',
    color: C.salviaTexto,
    lineHeight: 40,
  },
  pruebaTexto: {
    ...T.cuerpo,
    marginTop: 2,
  },
  insignia: {
    ...T.subtitulo,
    fontSize: 16,
    marginTop: S.sm,
  },
  cierre: {
    ...T.cuerpo,
    color: C.gris,
    textAlign: 'center',
    marginTop: S.sm,
  },
  porque: {
    ...T.cuerpo,
    color: C.cafe,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: S.lg,
    paddingHorizontal: S.md,
  },
});

export default function Diario() {
  const est = useEstilos(crear);
  const { C } = useTema();
  const {
    hoy,
    perfil,
    diario,
    guardarLogro,
    plan,
    diasCompletados,
    habitosHechos,
    mejorRacha,
    rutinasCompletas,
  } = useUsuario();
  const hoyClave = claveDia(hoy);

  const datos = useMemo(
    () => ({ diasCompletados, habitosHechos, diario, mejorRacha, rutinasCompletas }),
    [diasCompletados, habitosHechos, diario, mejorRacha, rutinasCompletas],
  );

  const pruebas = useMemo(() => pruebasDeLoQueHizo(datos), [datos]);

  const ganadas = useMemo(
    () =>
      insigniasGanadas({
        dias: pruebas.find((p) => p.clave === 'dias')?.cifra ?? 0,
        semanas: pruebas.find((p) => p.clave === 'semanas')?.cifra ?? 0,
        semanasEnteras: semanasEnteras(diasCompletados),
        rutinas: rutinasCompletas ?? 0,
        habitos: pruebas.find((p) => p.clave === 'habitos')?.cifra ?? 0,
        lineas: Object.values(diario).filter((t) => t?.trim?.()).length,
        regresos: contarRegresos(diasCompletados),
        regresosLargos: contarRegresosLargos(diasCompletados),
        mejorRacha,
      }),
    [pruebas, diasCompletados, diario, mejorRacha, rutinasCompletas],
  );

  const guardado = diario[hoyClave] ?? '';
  const [texto, setTexto] = useState(guardado);
  const [diaDificil, setDiaDificil] = useState(false);

  useEffect(() => setTexto(guardado), [guardado]);

  // Perder el foco sin haber cambiado nada no puede borrar lo escrito.
  const guardarSiCambio = () => {
    const limpio = texto.trim();
    if (limpio !== guardado) guardarLogro(limpio);
  };

  const pasados = useMemo(
    () =>
      Object.entries(diario)
        .filter(([clave, valor]) => clave !== hoyClave && valor?.trim())
        .sort((a, b) => b[0].localeCompare(a[0])),
    [diario, hoyClave],
  );

  return (
    <Pantalla contentStyle={est.contenido}>
      <Tarjeta>
        <Etiqueta>hoy</Etiqueta>
        <Text style={est.pregunta}>¿Un logro de hoy?</Text>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          onBlur={guardarSiCambio}
          placeholder="Una línea basta"
          placeholderTextColor={C.apagado}
          style={est.entrada}
          multiline
        />
        <Text style={est.pie}>Nada es demasiado pequeño para escribirlo.</Text>
      </Tarjeta>

      {/* Siempre disponible, tenga o no diario escrito. Antes solo aparecía
          con entradas guardadas, así que quien nunca escribe —la que no se
          felicita, la que más lo necesita— abría su peor momento y no
          recibía nada. */}
      <Boton
        variante={diaDificil ? 'salvia' : 'suave'}
        onPress={() => setDiaDificil((v) => !v)}
      >
        {diaDificil ? 'Ya estoy mejor' : 'Hoy es un día difícil'}
      </Boton>

      {diaDificil && (
        <>
          <Tarjeta style={est.recordatorio}>
            <View style={est.filaChispa}>
              <Chispa size={20} />
              <Text style={est.mensajeDificil}>
                {mensajeDeDiaDificil(perfil.nombre, pruebas.length)}
              </Text>
            </View>
          </Tarjeta>

          {/* La evidencia, venga de donde venga. Nada de esto es un consejo
              ni un pendiente: en un día difícil, "podrías intentar" es una
              piedra más. Solo lo que ya está hecho, en pasado. */}
          {pruebas.map((p) => (
            <Tarjeta key={p.clave} style={est.prueba}>
              <Text style={est.pruebaCifra}>{p.cifra}</Text>
              <Text style={est.pruebaTexto}>{p.texto}</Text>
            </Tarjeta>
          ))}

          {ganadas.length > 0 && (
            <Tarjeta style={est.destacado}>
              <Etiqueta>y esto ya nadie te lo quita</Etiqueta>
              {ganadas.map((i) => (
                <Text key={i.clave} style={est.insignia}>
                  {i.titulo}
                </Text>
              ))}
            </Tarjeta>
          )}

          {/* Su motivo, en sus palabras. Va de últimas y no de primeras: en un
              mal día, empezar por el porqué se lee como un reproche. Después
              de la evidencia se lee como lo que es, un dato suyo. */}
          {recordatorioDePorque(perfil.porque) && (
            <Text style={est.porque}>{recordatorioDePorque(perfil.porque)}</Text>
          )}

          <Text style={est.cierre}>{cierreDeDiaDificil(!!plan)}</Text>
        </>
      )}

      {pasados.map(([clave, valor]) => (
        <Tarjeta key={clave} style={diaDificil && est.destacado}>
          <Text style={est.fecha}>{fechaLarga(aFecha(clave))}</Text>
          <Text style={est.logro}>{valor}</Text>
        </Tarjeta>
      ))}

      {pasados.length === 0 && (
        <Tarjeta>
          <Text style={est.vacio}>
            Aquí se van a guardar tus logros. El primero es el de hoy.
          </Text>
        </Tarjeta>
      )}
    </Pantalla>
  );
}
