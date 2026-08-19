import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { AppState } from 'react-native';
import { completarDia, estaCompletado, rachaVigente, rachaRota } from '../services/racha';
import { claveDia } from '../services/fecha';
import { alternarHecho, estaHecho } from '../services/habitos';
import { queHacerConElPlan } from '../services/renovacion';
import { reducer, estadoInicial, persistible } from './usuarioReducer';
import { useHoy } from './useHoy';
import { cargar, guardarLocal, guardarPerfil, conLimite } from '../lib/repositorio';
import { anotar, vaciar, vaciarCola } from '../lib/sincronizador';
import { estadoDeSesion, salir as salirDeLaCuenta } from '../lib/auth';
import { generarPlan, hayApi } from '../lib/api';

// Única fuente de verdad de la app.
// La máquina de estado vive en usuarioReducer.js (pura, con pruebas).
// Aquí solo se manejan los efectos: leer, guardar y sincronizar.

const UsuarioContext = createContext(null);

// Lo que se espera por disco y nube antes de arrancar igual. Ocho segundos es
// mucho para una red buena y poco para quedarse mirando una pantalla vacía.
const ESPERA_MAXIMA = 8000;

export function UsuarioProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);

  // Cambia sola al cruzar la medianoche o al volver del segundo plano.
  // Sin esto, `completadoHoy` se quedaba en el día del arranque.
  const hoy = useHoy();

  // Trae disco, nube y estado de sesión. Se usa al abrir y cada vez que
  // alguien entra o crea cuenta: ahí los datos cambian de dueño.
  const hidratar = useCallback(async () => {
    // `estadoDeSesion` era la única promesa del arranque sin tope, y una
    // conexión que abre y no responde la deja colgada para siempre. Si tarda,
    // se sigue sin ella: saber si hay cuenta puede esperar, ver tus datos no.
    const [datos, sesion] = await Promise.all([
      cargar(),
      conLimite(estadoDeSesion()).catch(() => ({ tipo: 'invitado', correo: null })),
    ]);
    dispatch({ tipo: 'HIDRATAR', datos });
    dispatch({ tipo: 'SESION', tipoSesion: sesion.tipo, correo: sesion.correo });
  }, []);

  // Leer una sola vez, al abrir.
  useEffect(() => {
    let vivo = true;

    // Nada de esto puede dejar la app colgada en la carga. Una promesa que no
    // resuelve no lanza y no entra al catch: se queda esperando para siempre,
    // y lo que la persona ve es un fondo vacío que parece un error.
    const reloj = setTimeout(() => {
      if (vivo) dispatch({ tipo: 'ARRANCAR_IGUAL' });
    }, ESPERA_MAXIMA);

    hidratar()
      .then(() => vaciar()) // lo que quedó pendiente de la última sesión
      .catch(() => {
        // Sin datos la app arranca igual, en modo local.
        if (vivo) dispatch({ tipo: 'HIDRATAR', datos: null });
      });

    return () => {
      vivo = false;
      clearTimeout(reloj);
    };
  }, [hidratar]);

  // Al volver del segundo plano suele haber red otra vez: buen momento para
  // intentar de nuevo sin esperar al temporizador.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') vaciar();
    });
    return () => sub.remove();
  }, []);

  // Guardar en disco en cada cambio, nunca antes de haber leído
  // (guardar antes borraría lo que ya estaba).
  //
  // La guarda mira `leido` y NO `hidratado`. Miraba `hidratado`, y como
  // ARRANCAR_IGUAL lo enciende a los ocho segundos sin haber leído nada, una
  // red lenta hacía que la app escribiera el estado en blanco encima del
  // disco. La persona veía el onboarding otra vez y, si cerraba la app ahí,
  // perdía la racha, el diario y los hábitos para siempre.
  useEffect(() => {
    if (!estado.leido) return;
    guardarLocal(persistible(estado));
  }, [estado]);

  // Plan vencido: se pide uno nuevo al abrir.
  //
  // El Timer del lunes solo atiende a quien se está moviendo, así que quien
  // se fue tres semanas volvía al plan que dejó abandonado. Volver y
  // encontrar exactamente lo que dejaste es la forma más rápida de volverse
  // a ir. Aquí también es donde el motor de adaptación llega por fin a la
  // IA: los ajustes que salen del historial viajan con la petición.
  const ultimoIntento = useRef(null);

  useEffect(() => {
    if (!estado.hidratado || !estado.onboardingListo) return undefined;
    if (!hayApi || !estado.enNube || !estado.userId) return undefined;

    const que = queHacerConElPlan(estado, hoy, ultimoIntento.current);
    if (!que.renovar) return undefined;

    // Se marca ANTES de pedir: sin esto, un teléfono sin señal reintentaría
    // en cada cambio de estado.
    ultimoIntento.current = Date.now();

    let vivo = true;
    generarPlan(que.ajustes)
      .then((respuesta) => {
        if (vivo && respuesta?.plan) dispatch({ tipo: 'GUARDAR_PLAN', plan: respuesta.plan, hoy });
      })
      .catch(() => {
        // Se sigue con el plan que hay. Se reintenta en unas horas.
      });

    return () => {
      vivo = false;
    };
  }, [estado, hoy]);

  const valor = useMemo(() => {
    return {
      ...estado,
      hoy,
      // Atajo para la UI: solo quien está anónimo necesita que le ofrezcan
      // guardar la cuenta.
      puedeGuardarCuenta: estado.sesion === 'anonimo',
      // Derivados: las pantallas no recalculan reglas de racha.
      completadoHoy: estaCompletado(estado, hoy),
      racha: rachaVigente(estado, hoy),
      rota: rachaRota(estado, hoy),

      // La versión corta del reto de hoy. Vive aquí y no dentro de Hoy para
      // que el chat pueda cambiarla de verdad cuando alguien lo pide.
      retoEnMinima: estado.retoAliviado === claveDia(hoy),
      aliviarReto: (valor = true) => dispatch({ tipo: 'ALIVIAR_RETO', valor, hoy }),

      // El plan llega desde el paso 10 del onboarding; puede venir vacío si
      // la IA no respondió, y ahí las pantallas usan el plan de arranque.
      terminarOnboarding: (perfil, plan) => {
        dispatch({ tipo: 'TERMINAR_ONBOARDING', perfil, plan, hoy });
        guardarPerfil(estado.userId, perfil);
      },

      guardarPlan: (plan) => dispatch({ tipo: 'GUARDAR_PLAN', plan, hoy }),

      // Devuelve promesa a propósito: el onboarding necesita que el perfil
      // esté en Supabase ANTES de pedirle el plan a la Azure Function,
      // porque la función lo lee de la base.
      actualizarPerfil: async (cambios) => {
        dispatch({ tipo: 'ACTUALIZAR_PERFIL', cambios });
        await guardarPerfil(estado.userId, { ...estado.perfil, ...cambios });
      },

      // `reto` va al registro para que el Progreso pueda mostrar qué se hizo.
      // La fecha se pasa explícita para que marcar a las 23:59 y el registro
      // que se guarda hablen del mismo día.
      // Las escrituras van a la COLA, no directo a la red. El usuario ve su
      // día marcado al instante y la nube se entera cuando pueda: sin señal
      // el dato ya no se pierde, que era lo que pasaba antes.
      marcarDiaCompletado: (reto) => {
        const siguiente = completarDia(estado, hoy);
        if (siguiente === estado) return; // ya estaba marcado hoy
        dispatch({ tipo: 'COMPLETAR_DIA', hoy });
        anotar({
          tipo: 'registro',
          fecha: siguiente.ultimoDiaCompletado,
          reto: reto ?? null,
          rachaActual: siguiente.rachaActual,
          mejorRacha: siguiente.mejorRacha,
        });
      },

      // Los hábitos viven en el perfil (hasta tres claves) y sus días en el
      // estado local. Van por la cola como todo lo demás: se ven marcados al
      // instante y la nube se entera cuando pueda.
      elegirHabitos: (habitos) => {
        dispatch({ tipo: 'ELEGIR_HABITOS', habitos });
        anotar({ tipo: 'perfil', datos: { ...estado.perfil, habitos } });
      },

      marcarHabito: (clave) => {
        const hechos = alternarHecho(estado.habitosHechos, clave, hoy);
        dispatch({ tipo: 'MARCAR_HABITO', hechos });
        anotar({
          tipo: 'habito',
          clave,
          fecha: claveDia(hoy),
          hecho: estaHecho(hechos, clave, hoy),
        });
      },

      // Solo vive en el teléfono: es una preferencia de lo que se ve, no un
      // dato de la persona, y no tiene por qué viajar a la nube.
      verNutricionDetallada: (valor) => dispatch({ tipo: 'NUTRICION_DETALLADA', valor }),

      // Terminar la rutina entera es un logro por su cuenta, distinto de
      // marcar el día. Vive solo en el teléfono: es una cuenta de trabajo,
      // no un dato que haga falta en la nube.
      contarRutinaCompleta: () => dispatch({ tipo: 'RUTINA_COMPLETA' }),

      avisarDistancia: (nivel) => dispatch({ tipo: 'DISTANCIA_AVISADA', nivel }),

      guardarLogro: (texto) => {
        dispatch({ tipo: 'GUARDAR_LOGRO', texto, hoy });
        anotar({ tipo: 'logro', fecha: claveDia(hoy), texto });
      },

      // Después de entrar o de crear cuenta: los datos cambiaron de dueño,
      // hay que volver a traerlos enteros.
      refrescarSesion: async () => {
        dispatch({ tipo: 'REHIDRATAR' });
        await hidratar();
      },

      // "Cerrar sesión" del Perfil. Con cuenta, los datos siguen en la nube
      // y vuelven al entrar; lo que se borra es la copia de este teléfono.
      reiniciar: async () => {
        // Lo que quedara pendiente era del usuario anterior: no se le manda
        // al siguiente que entre en este teléfono.
        await vaciarCola();
        await salirDeLaCuenta();
        dispatch({ tipo: 'REHIDRATAR' });
        await hidratar();
      },
    };
  }, [estado, hidratar, hoy]);

  return <UsuarioContext.Provider value={valor}>{children}</UsuarioContext.Provider>;
}

export function useUsuario() {
  const ctx = useContext(UsuarioContext);
  if (!ctx) throw new Error('useUsuario debe usarse dentro de UsuarioProvider');
  return ctx;
}
