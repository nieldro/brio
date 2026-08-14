import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { completarDia, estaCompletado, rachaVigente, rachaRota } from '../services/racha';
import { claveDia } from '../services/fecha';
import {
  cargar,
  guardarLocal,
  guardarPerfil,
  marcarRegistro,
  guardarLogro as subirLogro,
  olvidar,
} from '../lib/repositorio';

// Única fuente de verdad de la app.
// Habla solo con `lib/repositorio`: no sabe si los datos vienen del disco,
// de Supabase o de las dos partes.

const estadoInicial = {
  hidratado: false, // ¿ya leímos disco y nube?
  userId: null,
  enNube: false,
  onboardingListo: false,
  perfil: {
    nombre: '',
    edad: null,
    estatura: null,
    peso: null,
    objetivo: '',
    porque: '',
    lugar: '',
    tiempo_min: null,
    hora_recordatorio: '',
    notificaciones: false,
  },
  plan: null, // jsonb de `planes.plan`; null mientras no lo genere la IA
  ultimoDiaCompletado: null, // '2026-08-13'
  rachaActual: 0,
  mejorRacha: 0,
  diario: {}, // { '2026-08-13': 'texto' }
};

// Lo que se guarda en disco. Lo demás se resuelve en cada arranque.
function persistible({ hidratado, userId, enNube, ...resto }) {
  return resto;
}

function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'HIDRATAR':
      return { ...estado, ...(accion.datos ?? {}), hidratado: true };

    case 'TERMINAR_ONBOARDING':
      return {
        ...estado,
        onboardingListo: true,
        perfil: { ...estado.perfil, ...accion.perfil },
        plan: accion.plan ?? estado.plan,
      };

    case 'GUARDAR_PLAN':
      return { ...estado, plan: accion.plan };

    case 'ACTUALIZAR_PERFIL':
      return { ...estado, perfil: { ...estado.perfil, ...accion.cambios } };

    // La regla vive en services/racha.js, no aquí.
    case 'COMPLETAR_DIA':
      return { ...estado, ...completarDia(estado) };

    case 'GUARDAR_LOGRO':
      return {
        ...estado,
        diario: { ...estado.diario, [claveDia()]: accion.texto },
      };

    case 'REINICIAR':
      return { ...estadoInicial, hidratado: true, userId: estado.userId, enNube: estado.enNube };

    default:
      return estado;
  }
}

const UsuarioContext = createContext(null);

export function UsuarioProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);

  // Leer una sola vez, al abrir.
  useEffect(() => {
    let vivo = true;
    cargar().then((datos) => {
      if (vivo) dispatch({ tipo: 'HIDRATAR', datos });
    });
    return () => {
      vivo = false;
    };
  }, []);

  // Guardar en disco en cada cambio, nunca antes de haber leído
  // (guardar antes borraría lo que ya estaba).
  useEffect(() => {
    if (!estado.hidratado) return;
    guardarLocal(persistible(estado));
  }, [estado]);

  const valor = useMemo(() => {
    const hoy = new Date();

    return {
      ...estado,
      // Derivados: las pantallas no recalculan reglas de racha.
      completadoHoy: estaCompletado(estado, hoy),
      racha: rachaVigente(estado, hoy),
      rota: rachaRota(estado, hoy),

      // El plan llega desde el paso 10 del onboarding; puede venir vacío si
      // la IA no respondió, y ahí las pantallas usan el plan de arranque.
      terminarOnboarding: (perfil, plan) => {
        dispatch({ tipo: 'TERMINAR_ONBOARDING', perfil, plan });
        guardarPerfil(estado.userId, perfil);
      },

      guardarPlan: (plan) => dispatch({ tipo: 'GUARDAR_PLAN', plan }),

      // Devuelve promesa a propósito: el onboarding necesita que el perfil
      // esté en Supabase ANTES de pedirle el plan a la Azure Function,
      // porque la función lo lee de la base.
      actualizarPerfil: async (cambios) => {
        dispatch({ tipo: 'ACTUALIZAR_PERFIL', cambios });
        await guardarPerfil(estado.userId, { ...estado.perfil, ...cambios });
      },

      // `reto` va al registro para que el Progreso pueda mostrar qué se hizo.
      marcarDiaCompletado: (reto) => {
        const siguiente = completarDia(estado);
        if (siguiente === estado) return; // ya estaba marcado hoy
        dispatch({ tipo: 'COMPLETAR_DIA' });
        marcarRegistro(estado.userId, {
          fecha: siguiente.ultimoDiaCompletado,
          reto: reto ?? null,
          rachaActual: siguiente.rachaActual,
          mejorRacha: siguiente.mejorRacha,
        });
      },

      guardarLogro: (texto) => {
        dispatch({ tipo: 'GUARDAR_LOGRO', texto });
        subirLogro(estado.userId, { fecha: claveDia(), texto });
      },

      // La usa "cerrar sesión" del Perfil en la fase 6.
      reiniciar: async () => {
        await olvidar();
        dispatch({ tipo: 'REINICIAR' });
      },
    };
  }, [estado]);

  return <UsuarioContext.Provider value={valor}>{children}</UsuarioContext.Provider>;
}

export function useUsuario() {
  const ctx = useContext(UsuarioContext);
  if (!ctx) throw new Error('useUsuario debe usarse dentro de UsuarioProvider');
  return ctx;
}
