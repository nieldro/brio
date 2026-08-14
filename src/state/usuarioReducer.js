import { completarDia } from '../services/racha.js';
import { claveDia } from '../services/fecha.js';

// Máquina de estado de la app. Pura y sin dependencias de React ni de la red:
// el provider se encarga de los efectos, esto solo decide el siguiente estado.

export const estadoInicial = {
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
    push_token: null,
    zona_horaria: null,
  },
  plan: null, // jsonb de `planes.plan`; null mientras no lo genere la IA
  ultimoDiaCompletado: null, // '2026-08-13'
  diasCompletados: [], // ['2026-08-13', ...] para la semana y el progreso
  rachaActual: 0,
  mejorRacha: 0,
  diario: {}, // { '2026-08-13': 'texto' }
};

// Lo que se guarda en disco. Lo demás se resuelve en cada arranque.
export function persistible({ hidratado, userId, enNube, ...resto }) {
  return resto;
}

export function reducer(estado, accion) {
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
    case 'COMPLETAR_DIA': {
      const siguiente = completarDia(estado, accion.hoy);
      if (siguiente === estado) return estado;

      const clave = siguiente.ultimoDiaCompletado;
      return {
        ...estado,
        ...siguiente,
        diasCompletados: estado.diasCompletados.includes(clave)
          ? estado.diasCompletados
          : [clave, ...estado.diasCompletados],
      };
    }

    case 'GUARDAR_LOGRO':
      return {
        ...estado,
        diario: { ...estado.diario, [claveDia(accion.hoy)]: accion.texto },
      };

    case 'REINICIAR':
      return { ...estadoInicial, hidratado: true, userId: estado.userId, enNube: estado.enNube };

    default:
      return estado;
  }
}
