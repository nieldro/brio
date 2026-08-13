import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

import { C, S, R, T } from '../theme';
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
import { diaDelPlan, resumenReto, esDescanso } from '../services/plan';
import { textoHecho, fraseDelDia, subCelebracion } from '../services/racha';


const SALUDOS = {
  manana: 'Buenos días',
  tarde: 'Buenas tardes',
  noche: 'Buenas noches',
};

export default function Hoy() {
  const hoy = useMemo(() => new Date(), []);
  const dia = useMemo(() => diaDelPlan(planDemo, hoy), [hoy]);

  const { celebrar } = useCelebracion();
  const { perfil, racha, rota, completadoHoy, marcarDiaCompletado, diario, guardarLogro } =
    useUsuario();

  const [logro, setLogro] = useState(diario[claveDia(hoy)] ?? '');

  const marcarListo = () => {
    if (completadoHoy) return;
    marcarDiaCompletado();
    celebrar({ titulo: 'Hecho.', sub: subCelebracion(racha + 1) });
  };

  const saludo = `${SALUDOS[franjaDelDia(hoy)]}, ${perfil.nombre}.`;

  return (
    <Pantalla>
      <View style={styles.encabezado}>
        <Text style={styles.fecha}>{fechaLarga(hoy)}</Text>
        <PildoraRacha dias={racha} />
      </View>

      <View style={styles.bloqueSaludo}>
        <Text style={T.saludo}>{saludo}</Text>
        <Text style={styles.frase}>{fraseDelDia({ completadoHoy, racha, rota })}</Text>
      </View>

      <Tarjeta>
        <Etiqueta>{esDescanso(dia) ? 'hoy descansas' : 'reto de hoy'}</Etiqueta>
        <Text style={styles.reto}>{dia.reto}</Text>
        <Text style={styles.resumen}>{resumenReto(dia, perfil.lugar)}</Text>

        {dia.ejercicios.length > 0 && (
          <View style={styles.ejercicios}>
            {dia.ejercicios.map((e) => (
              <View key={e.nombre} style={styles.ejercicio}>
                <Text style={styles.ejercicioNombre}>{e.nombre}</Text>
                <Text style={T.secundario}>{e.detalle}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.mensaje}>{dia.mensaje}</Text>

        <Boton
          variante={completadoHoy ? 'salvia' : 'coral'}
          onPress={marcarListo}
          style={styles.botonListo}
        >
          {completadoHoy ? textoHecho(racha) : 'Listo por hoy'}
        </Boton>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>hoy en la mesa</Etiqueta>
        <View style={styles.filaTip}>
          <PuntoSemaforo color={dia.comida_color} />
          <Text style={[T.cuerpo, styles.tip]}>{dia.comida_tip}</Text>
        </View>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>tu diario</Etiqueta>
        <Text style={styles.pregunta}>¿Un logro de hoy?</Text>
        <TextInput
          value={logro}
          onChangeText={setLogro}
          onBlur={() => guardarLogro(logro.trim())}
          placeholder="Una línea basta"
          placeholderTextColor={C.apagado}
          style={styles.input}
          multiline
        />
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fecha: {
    ...T.secundario,
    textTransform: 'lowercase',
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
  ejercicioNombre: {
    ...T.subtitulo,
    fontSize: 16,
  },
  mensaje: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.lg,
  },
  botonListo: {
    marginTop: S.lg,
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
