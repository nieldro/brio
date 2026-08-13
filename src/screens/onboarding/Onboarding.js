import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { C, S, T } from '../../theme';
import { useUsuario } from '../../state/UsuarioContext';
import { planDemo } from '../../data/planDemo';
import { diaDelPlan } from '../../services/plan';

import Latido from '../../components/Latido';
import Marco from './Marco';
import { PASOS, interpolar } from './pasos';
import { ListaOpciones, CampoUnico, CamposDatos, SelectorHora } from './PasosUI';

const ESPERA_PLAN = 1800; // fase 5: aquí se espera a la Edge Function `plan`
const RETARDO_AVANCE = 180; // deja ver la opción elegida antes de pasar

const LIMITES = {
  edad: [10, 100],
  estatura: [100, 250],
  peso: [30, 300],
};

const enRango = (clave, texto) => {
  const n = Number(texto);
  const [min, max] = LIMITES[clave];
  return Number.isFinite(n) && n >= min && n <= max;
};

export default function Onboarding() {
  const { terminarOnboarding } = useUsuario();

  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [otro, setOtro] = useState('');
  const [datos, setDatos] = useState({ edad: '', estatura: '', peso: '' });

  const paso = PASOS[indice];
  const diaDeHoy = useMemo(() => diaDelPlan(planDemo, new Date()), []);

  const avanzar = (cambios) => {
    if (cambios) setRespuestas((r) => ({ ...r, ...cambios }));
    setIndice((i) => Math.min(i + 1, PASOS.length - 1));
  };

  const retroceder = indice > 0 ? () => setIndice((i) => i - 1) : undefined;

  // El paso de carga avanza solo. En la fase 5 espera al plan real.
  useEffect(() => {
    if (paso.tipo !== 'cargando') return;
    const t = setTimeout(() => setIndice((i) => i + 1), ESPERA_PLAN);
    return () => clearTimeout(t);
  }, [paso.tipo]);

  const elegirOpcion = (valor) => {
    setRespuestas((r) => ({ ...r, [paso.campo]: valor }));
    if (valor === ListaOpciones.OTRO) return; // espera a que escriba
    setTimeout(() => setIndice((i) => i + 1), RETARDO_AVANCE);
  };

  const porqueFinal =
    respuestas.porque === ListaOpciones.OTRO ? otro.trim() : respuestas.porque;

  const terminar = () => {
    terminarOnboarding({
      nombre: respuestas.nombre?.trim() ?? '',
      objetivo: respuestas.objetivo ?? '',
      porque: porqueFinal ?? '',
      edad: Number(datos.edad),
      estatura: Number(datos.estatura),
      peso: Number(datos.peso),
      lugar: respuestas.lugar ?? '',
      tiempo_min: respuestas.tiempo_min ?? null,
      hora_recordatorio: respuestas.hora_recordatorio ?? '',
      notificaciones: !!respuestas.notificaciones,
    });
  };

  const comun = {
    paso: indice,
    total: PASOS.length,
    onAtras: retroceder,
    titulo: interpolar(paso.titulo, respuestas),
    sub: paso.sub,
    pie: paso.pie,
  };

  switch (paso.tipo) {
    case 'mensaje':
      return <Marco {...comun} boton={paso.boton} onBoton={() => avanzar(paso.alAvanzar)} />;

    case 'campo': {
      const valor = respuestas[paso.campo] ?? '';
      return (
        <Marco {...comun} boton={paso.boton} onBoton={() => avanzar()} botonActivo={valor.trim().length > 0}>
          <CampoUnico
            valor={valor}
            placeholder={paso.placeholder}
            onChange={(t) => setRespuestas((r) => ({ ...r, [paso.campo]: t }))}
          />
        </Marco>
      );
    }

    case 'opciones': {
      const valor = respuestas[paso.campo];
      const enOtro = valor === ListaOpciones.OTRO;
      return (
        <Marco
          {...comun}
          boton={enOtro ? 'Seguir' : undefined}
          onBoton={() => avanzar()}
          botonActivo={otro.trim().length > 0}
        >
          <ListaOpciones
            opciones={paso.opciones}
            valor={valor}
            onElegir={elegirOpcion}
            permiteOtro={paso.permiteOtro}
            otro={otro}
            onOtro={setOtro}
          />
        </Marco>
      );
    }

    case 'datos': {
      const completo = Object.keys(LIMITES).every((k) => enRango(k, datos[k]));
      return (
        <Marco {...comun} boton={paso.boton} onBoton={() => avanzar()} botonActivo={completo}>
          <CamposDatos
            datos={datos}
            onChange={(clave, texto) => setDatos((d) => ({ ...d, [clave]: texto }))}
          />
        </Marco>
      );
    }

    case 'hora': {
      const valor = respuestas[paso.campo] ?? '';
      return (
        <Marco {...comun} boton={paso.boton} onBoton={() => avanzar()} botonActivo={!!valor}>
          <SelectorHora
            valor={valor}
            onChange={(v) => setRespuestas((r) => ({ ...r, [paso.campo]: v }))}
          />
        </Marco>
      );
    }

    case 'cargando':
      return (
        <Marco {...comun}>
          <Latido />
        </Marco>
      );

    case 'final':
      return (
        <Marco
          {...comun}
          titulo={`${respuestas.nombre ?? ''}, tu semana está lista.`}
          boton={paso.boton}
          onBoton={terminar}
        >
          <View style={styles.cierre}>
            <Text style={styles.linea}>Empezamos suave. Hoy: {diaDeHoy.reto}.</Text>
            <Text style={styles.linea}>Y recuerda. Esto es por {porqueFinal || 'ti'}.</Text>
          </View>
        </Marco>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  cierre: {
    marginTop: S.lg,
    gap: S.md,
  },
  linea: {
    ...T.cuerpo,
    color: C.gris,
    fontSize: 18,
    lineHeight: 27,
  },
});
