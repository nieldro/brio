import { createContext, useContext, useMemo, useReducer } from 'react';
import { completarDia } from '../services/racha';
import { claveDia } from '../services/fecha';

// Única fuente de verdad de la app en la fase 3.
// En la fase 4 el reducer se mantiene igual y solo se le agrega la escritura
// contra Supabase: las pantallas no se enteran del cambio.

const estadoInicial = {
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
  rachaActual: 0,
  mejorRacha: 0,
  completadoHoy: false,
  diario: {}, // { '2026-08-13': 'texto' }
};

function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'TERMINAR_ONBOARDING':
      return {
        ...estado,
        onboardingListo: true,
        perfil: { ...estado.perfil, ...accion.perfil },
      };

    case 'ACTUALIZAR_PERFIL':
      return { ...estado, perfil: { ...estado.perfil, ...accion.cambios } };

    case 'COMPLETAR_DIA': {
      // La regla vive en services/racha.js, no aquí.
      const { completadoHoy, rachaActual, mejorRacha } = completarDia({
        completadoHoy: estado.completadoHoy,
        rachaActual: estado.rachaActual,
        mejorRacha: estado.mejorRacha,
      });
      return { ...estado, completadoHoy, rachaActual, mejorRacha };
    }

    case 'GUARDAR_LOGRO':
      return {
        ...estado,
        diario: { ...estado.diario, [claveDia()]: accion.texto },
      };

    default:
      return estado;
  }
}

const UsuarioContext = createContext(null);

export function UsuarioProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);

  const valor = useMemo(
    () => ({
      ...estado,
      terminarOnboarding: (perfil) => dispatch({ tipo: 'TERMINAR_ONBOARDING', perfil }),
      actualizarPerfil: (cambios) => dispatch({ tipo: 'ACTUALIZAR_PERFIL', cambios }),
      marcarDiaCompletado: () => dispatch({ tipo: 'COMPLETAR_DIA' }),
      guardarLogro: (texto) => dispatch({ tipo: 'GUARDAR_LOGRO', texto }),
    }),
    [estado],
  );

  return <UsuarioContext.Provider value={valor}>{children}</UsuarioContext.Provider>;
}

export function useUsuario() {
  const ctx = useContext(UsuarioContext);
  if (!ctx) throw new Error('useUsuario debe usarse dentro de UsuarioProvider');
  return ctx;
}
