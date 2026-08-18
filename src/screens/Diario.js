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
});

export default function Diario() {
  const est = useEstilos(crear);
  const { C } = useTema();
  const { hoy, perfil, diario, guardarLogro } = useUsuario();
  const hoyClave = claveDia(hoy);

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

      {pasados.length > 0 && (
        <Boton
          variante={diaDificil ? 'salvia' : 'suave'}
          onPress={() => setDiaDificil((v) => !v)}
        >
          {diaDificil ? 'Ya estoy mejor' : 'Hoy es un día difícil'}
        </Boton>
      )}

      {diaDificil && (
        <Tarjeta style={est.recordatorio}>
          <View style={est.filaChispa}>
            <Chispa size={20} />
            <Text style={est.mensajeDificil}>
              {perfil.nombre ? `${perfil.nombre}, mira` : 'Mira'} todo lo que ya hiciste.
            </Text>
          </View>
        </Tarjeta>
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
