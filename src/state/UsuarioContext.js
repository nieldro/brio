import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { completarDia, estaCompletado, rachaVigente, rachaRota } from '../services/racha';
import { claveDia } from '../services/fecha';
import { cargarEstado, guardarEstado, borrarEstado } from '../lib/almacenamiento';

// Única fuente de verdad de la app.
// En la fase 4 el reducer se mantiene igual y solo se le agrega la escritura
// contra Supabase: las pantallas no se enteran del cambio.

const estadoInicial = {
  hidratado: false, // ¿ya leímos el disco?
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
  ultimoDiaCompletado: null, // '2026-08-13'
  rachaActual: 0,
  mejorRacha: 0,
  diario: {}, // { '2026-08-13': 'texto' }
};

// Lo que se guarda en disco. `hidratado` es de esta sesión, no se persiste.
function persistible({ hidratado, ...resto }) {
  return resto;
}

function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'HIDRATAR':
      return { ...estado, ...(accion.guardado ?? {}), hidratado: true };

    case 'TERMINAR_ONBOARDING':
      return {
        ...estado,
        onboardingListo: true,
        perfil: { ...estado.perfil, ...accion.perfil },
      };

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
      return { ...estadoInicial, hidratado: true };

    default:
      return estado;
  }
}

const UsuarioContext = createContext(null);

export function UsuarioProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);

  // Leer el disco una sola vez, al abrir.
  useEffect(() => {
    let vivo = true;
    cargarEstado().then((guardado) => {
      if (vivo) dispatch({ tipo: 'HIDRATAR', guardado });
    });
    return () => {
      vivo = false;
    };
  }, []);

  // Guardar en cada cambio, nunca antes de haber leído (borraría lo guardado).
  useEffect(() => {
    if (!estado.hidratado) return;
    guardarEstado(persistible(estado));
  }, [estado]);

  const valor = useMemo(() => {
    const hoy = new Date();
    return {
      ...estado,
      // Derivados: las pantallas no recalculan reglas de racha.
      completadoHoy: estaCompletado(estado, hoy),
      racha: rachaVigente(estado, hoy),
      rota: rachaRota(estado, hoy),

      terminarOnboarding: (perfil) => dispatch({ tipo: 'TERMINAR_ONBOARDING', perfil }),
      actualizarPerfil: (cambios) => dispatch({ tipo: 'ACTUALIZAR_PERFIL', cambios }),
      marcarDiaCompletado: () => dispatch({ tipo: 'COMPLETAR_DIA' }),
      guardarLogro: (texto) => dispatch({ tipo: 'GUARDAR_LOGRO', texto }),
      // La usa "cerrar sesión" del Perfil en la fase 6.
      reiniciar: async () => {
        await borrarEstado();
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
