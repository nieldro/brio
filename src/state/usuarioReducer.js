import { completarDia } from '../services/racha.js';
import { claveDia } from '../services/fecha.js';

// Máquina de estado de la app. Pura y sin dependencias de React ni de la red:
// el provider se encarga de los efectos, esto solo decide el siguiente estado.

export const estadoInicial = {
  hidratado: false, // ¿ya leímos disco y nube?
  userId: null,
  enNube: false,
  // 'invitado' | 'anonimo' | 'concuenta'. Decide si Perfil ofrece guardar
  // la cuenta o mostrar el correo con el que entró.
  sesion: 'invitado',
  correo: null,
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
    // Vacío es "el cuerpo entero". Quien no elige nada no está pidiendo un
    // plan de brazos, está pidiendo un plan.
    zonas: [],
  },
  plan: null, // jsonb de `planes.plan`; null mientras no lo genere la IA
  ultimoDiaCompletado: null, // '2026-08-13'
  diasCompletados: [], // ['2026-08-13', ...] para la semana y el progreso
  rachaActual: 0,
  mejorRacha: 0,
  diario: {}, // { '2026-08-13': 'texto' }
  // Los hábitos que la persona lleva, máximo tres, y los días que los hizo.
  // Sin racha a propósito: tres contadores más que se pueden poner en cero
  // es exactamente lo que hace irse a quien ya abandonó otras apps.
  habitos: [], // ['agua', 'estirar']
  habitosHechos: {}, // { agua: ['2026-08-19', ...] }
  // Ver la estimación de energía al mirar un plato. APAGADO por defecto.
  //
  // No es una métrica de la app y nunca va a serlo: no se guarda, no se
  // suma, no aparece en el progreso. Es información para el momento en que
  // alguien la pide, y por eso hay que encenderla a mano.
  nutricionDetallada: false,
};

// Lo que se guarda en disco. Lo demás se resuelve en cada arranque.
//
// La sesión y el correo NUNCA se persisten: los manda Supabase, y una copia
// vieja haría creer a la app que sigue viva una sesión que ya murió.
//
// El `userId` sí queda, como `duenoId`: es el sello de a quién pertenece esto.
// Al abrir, si el dueño del disco no es quien tiene la sesión, lo guardado se
// descarta. Así dos personas en el mismo teléfono no mezclan sus datos, y no
// hay que borrar nada por adelantado para conseguirlo.
export function persistible({ hidratado, userId, enNube, sesion, correo, ...resto }) {
  return userId ? { ...resto, duenoId: userId } : resto;
}

export function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'HIDRATAR':
      return { ...estado, ...(accion.datos ?? {}), hidratado: true };

    // Red de seguridad. Si leer disco y nube se queda colgado (señal mala, VPN,
    // DNS caído), la app NO puede quedarse en la pantalla de carga para
    // siempre: el usuario ve un fondo azul vacío y cree que se rompió.
    //
    // Arranca con lo que haya. Si los datos llegan después, HIDRATAR los mete
    // encima y la pantalla se acomoda sola.
    case 'ARRANCAR_IGUAL':
      return estado.hidratado ? estado : { ...estado, hidratado: true };

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

    case 'NUTRICION_DETALLADA':
      return { ...estado, nutricionDetallada: !!accion.valor };

    case 'ELEGIR_HABITOS':
      return { ...estado, habitos: accion.habitos };

    case 'MARCAR_HABITO':
      return { ...estado, habitosHechos: accion.hechos };

    case 'GUARDAR_LOGRO':
      return {
        ...estado,
        diario: { ...estado.diario, [claveDia(accion.hoy)]: accion.texto },
      };

    case 'SESION':
      return { ...estado, sesion: accion.tipoSesion, correo: accion.correo ?? null };

    // Vuelve a cero y espera una hidratación nueva. `hidratado` en false
    // hace que Raiz muestre la chispa mientras se traen los datos de quien
    // acaba de entrar, en vez de enseñar por un instante los del anterior.
    case 'REHIDRATAR':
      return { ...estadoInicial, enNube: estado.enNube };

    case 'REINICIAR':
      return { ...estadoInicial, hidratado: true, userId: estado.userId, enNube: estado.enNube };

    default:
      return estado;
  }
}
