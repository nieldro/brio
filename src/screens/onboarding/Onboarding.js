import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { useEstilos } from '../../state/TemaContext';
import { useUsuario } from '../../state/UsuarioContext';
import { generarPlan, hayApi } from '../../lib/api';
import { pedirPermisoYToken } from '../../lib/notificaciones';
import { planDemo } from '../../data/planDemo';
import { diaDelPlan } from '../../services/plan';
import { zonaDelTelefono } from '../../services/fecha';

import Latido from '../../components/Latido';
import SelectorHora from '../../components/SelectorHora';
import Marco from './Marco';
import { PASOS, interpolar } from './pasos';
import { ListaOpciones, CampoUnico, CamposDatos } from './PasosUI';

const ESPERA_MINIMA = 1600; // que la chispa alcance a respirar, no parpadee
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

export default function Onboarding({ navigation }) {
  const { terminarOnboarding, actualizarPerfil } = useUsuario();
  const est = useEstilos(crear);

  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [otro, setOtro] = useState('');
  const [datos, setDatos] = useState({ edad: '', estatura: '', peso: '' });
  const [plan, setPlan] = useState(null);

  const paso = PASOS[indice];
  // Hasta que la IA responda, el reto del paso 11 sale del plan de arranque.
  const diaDeHoy = useMemo(() => diaDelPlan(plan ?? planDemo, new Date()), [plan]);

  const avanzar = (cambios) => {
    if (cambios) setRespuestas((r) => ({ ...r, ...cambios }));
    setIndice((i) => Math.min(i + 1, PASOS.length - 1));
  };

  // Desde el primer paso, atrás vuelve a la bienvenida. Sin esto, quien
  // entraba al onboarding por error quedaba encerrado sin forma de llegar
  // a "ya tengo cuenta".
  const retroceder =
    indice > 0
      ? () => setIndice((i) => i - 1)
      : navigation.canGoBack()
        ? () => navigation.goBack()
        : undefined;

  const porqueFinal =
    respuestas.porque === ListaOpciones.OTRO ? otro.trim() : respuestas.porque;

  const armarPerfil = () => ({
    nombre: respuestas.nombre?.trim() ?? '',
    objetivo: respuestas.objetivo ?? '',
    porque: porqueFinal ?? '',
    edad: Number(datos.edad),
    estatura: Number(datos.estatura),
    peso: Number(datos.peso),
    lugar: respuestas.lugar ?? '',
    tiempo_min: respuestas.tiempo_min ?? null,
    hora_recordatorio: respuestas.hora_recordatorio ?? '',
    notificaciones: !!respuestas.push_token,
    push_token: respuestas.push_token ?? null,
    // El servidor vive en UTC y la hora del recordatorio es local.
    zona_horaria: zonaDelTelefono(),
  });

  // Paso 8. Pide el permiso real. Si el usuario dice que no, se sigue igual:
  // la app funciona sin recordatorios y nadie recibe un reproche por negarse.
  const pedirPermiso = async () => {
    const token = await pedirPermisoYToken();
    avanzar({ push_token: token });
  };

  // Paso 10. Guarda el perfil y le pide el plan a la Azure Function.
  // Si la IA no está configurada o falla, se sigue con el plan de arranque:
  // el usuario nunca se queda atrapado en esta pantalla.
  useEffect(() => {
    if (paso.tipo !== 'cargando') return;

    let vivo = true;
    const desde = Date.now();

    (async () => {
      if (hayApi) {
        try {
          await actualizarPerfil(armarPerfil());
          // En el onboarding no hay historial todavía: no hay nada que ajustar.
          const respuesta = await generarPlan([]);
          if (vivo && respuesta?.plan) setPlan(respuesta.plan);
        } catch {
          // Se sigue con el plan de arranque.
        }
      }

      const falta = Math.max(0, ESPERA_MINIMA - (Date.now() - desde));
      setTimeout(() => {
        if (vivo) setIndice((i) => i + 1);
      }, falta);
    })();

    return () => {
      vivo = false;
    };
  }, [paso.tipo]);

  const elegirOpcion = (valor) => {
    setRespuestas((r) => ({ ...r, [paso.campo]: valor }));
    if (valor === ListaOpciones.OTRO) return; // espera a que escriba
    setTimeout(() => setIndice((i) => i + 1), RETARDO_AVANCE);
  };

  const terminar = () => terminarOnboarding(armarPerfil(), plan);

  const comun = {
    paso: indice,
    total: PASOS.length,
    onAtras: retroceder,
    titulo: interpolar(paso.titulo, respuestas),
    sub: paso.sub,
    pie: paso.pie,
  };

  switch (paso.tipo) {
    // La marca no se repite aquí: la muestra Bienvenida, en la pantalla justo
    // anterior, y sería el mismo logo dos veces seguidas.
    case 'mensaje':
      return (
        <Marco {...comun} boton={paso.boton} onBoton={() => avanzar(paso.alAvanzar)}>
          {/* Solo en el primer paso, y como enlace discreto: quien ya usó Brío
              en otro teléfono no debería tener que rehacer el onboarding.
              Nunca es un muro, siempre está debajo del botón principal. */}
          {paso.id === 'intro' && (
            <Pressable
              onPress={() => navigation.navigate('Cuenta', { modo: 'entrar' })}
              accessibilityRole="button"
              style={est.enlaceCuenta}
            >
              <Text style={est.enlaceCuentaTexto}>Ya tengo cuenta</Text>
            </Pressable>
          )}
        </Marco>
      );

    case 'permiso':
      return <Marco {...comun} boton={paso.boton} onBoton={pedirPermiso} />;

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
          <View style={est.cierre}>
            <Text style={est.linea}>Empezamos suave. Hoy: {diaDeHoy.reto}.</Text>
            <Text style={est.linea}>Y recuerda. Esto es por {porqueFinal || 'ti'}.</Text>
          </View>
        </Marco>
      );

    default:
      return null;
  }
}

const crear = ({ C, T, S }) => ({
  enlaceCuenta: {
    marginTop: S.xxl,
    alignSelf: 'flex-start',
    paddingVertical: S.sm,
  },
  enlaceCuentaTexto: {
    ...T.cuerpo,
    color: C.coralTexto,
    fontWeight: '600',
  },
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
