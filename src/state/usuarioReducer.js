import { completarDia } from '../services/racha.js';
import { claveDia } from '../services/fecha.js';

// Máquina de estado de la app. Pura y sin dependencias de React ni de la red:
// el provider se encarga de los efectos, esto solo decide el siguiente estado.

export const estadoInicial = {
  hidratado: false, // ¿ya se puede pintar la app?
  // ¿ya leímos el disco DE VERDAD?
  //
  // Son dos cosas distintas y antes colgaban de la misma bandera, con
  // consecuencias feas. `ARRANCAR_IGUAL` enciende `hidratado` sin haber leído
  // nada, para que nadie se quede mirando una pantalla de carga si la red se
  // cuelga. Pero el efecto que guarda en disco también miraba `hidratado`, así
  // que escribía el estado EN BLANCO encima de lo que había: racha, diario,
  // hábitos y fotos, borrados por una red lenta.
  //
  // Guardar solo se autoriza cuando esta bandera está en true.
  leido: false,
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
  // El día en que se armó el plan, para saber cuándo está vencido.
  //
  // Sin esta fecha, quien se fue tres semanas volvía al plan que abandonó:
  // la semana 4 de alguien que ya no está en la semana 4. Volver y encontrar
  // lo mismo que dejaste es la forma más rápida de volverse a ir.
  planDesde: null, // '2026-08-19'
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
  // Rutinas terminadas enteras, ejercicio por ejercicio. Se cuenta aparte de
  // los días marcados porque son cosas distintas: un día se puede marcar sin
  // haber tachado todo, y está bien que así sea.
  rutinasCompletas: 0,
  // El último nivel de acompañamiento que se le explicó. Sirve para decirle
  // UNA vez que Brío va a hablar menos, y no cada vez que abre la app.
  distanciaAvisada: null,
  // --- Bienestar financiero (paquete 1.7 de la EDT) ----------------------
  //
  // El dinero avergüenza más que la comida, así que aquí valen las mismas
  // reglas: un gasto no es una falta y la app no dice en qué NO gastar.
  // Por eso no hay ningún acumulador de "lo que te pasaste", ni nada que se
  // pueda leer como una deuda con la app.
  gastos: [], // [{ id, fecha, monto, categoria, nota, recurrente }]
  presupuesto: { mensual: null, porCategoria: {} },
  // El reto de ahorro va atado a la racha de movimiento: el mismo día que se
  // cumple el reto, se aparta algo pequeño. Lo apartado NUNCA se borra por
  // romper la racha; eso sería castigo.
  ahorro: { porDia: null, desde: null },

  // La pareja con la que se lleva un reto. Una sola: dos ya es una red social.
  pareja: null, // { codigo, retoId, desde }

  // El día en que el detector de riesgo vio un dolor o una lesión.
  //
  // Sin esto, el chat contestaba "hoy paramos, deja que lo mire un
  // profesional" y la pantalla Hoy seguía enseñando el reto y el botón de
  // "Listo por hoy". La app decía una cosa y hacía la contraria, que en un
  // asunto de lesiones es peor que no decir nada.
  //
  // Es de UN día, como `retoAliviado`: mañana se arranca de cero, sin dejar
  // la app en un modo de reposo que nadie recuerda haber puesto.
  diaEnPausa: null, // '2026-08-19'

  // El día en que se pidió la versión corta del reto.
  //
  // Vivía dentro de la pantalla Hoy, y por eso el chip "Cambia mi reto" del
  // chat contestaba "listo, lo cambio" sin cambiar nada. Prometer y no
  // cumplir es peor que no ofrecerlo.
  //
  // Se guarda por día y no como un interruptor: mañana se arranca de cero,
  // sin dejar prendido un "modo fácil" que nadie recuerda haber puesto.
  retoAliviado: null, // '2026-08-19'
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
export function persistible({ hidratado, leido, userId, enNube, sesion, correo, ...resto }) {
  return userId ? { ...resto, duenoId: userId } : resto;
}

export function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'HIDRATAR':
      return { ...estado, ...(accion.datos ?? {}), hidratado: true, leido: true };

    // Red de seguridad. Si leer disco y nube se queda colgado (señal mala, VPN,
    // DNS caído), la app NO puede quedarse en la pantalla de carga para
    // siempre: el usuario ve un fondo azul vacío y cree que se rompió.
    //
    // Arranca con lo que haya. Si los datos llegan después, HIDRATAR los mete
    // encima y la pantalla se acomoda sola.
    //
    // `leido` NO se toca: destraba la pantalla, pero no autoriza a escribir en
    // disco. Sin esa distinción, una red lenta borraba los datos de la persona.
    case 'ARRANCAR_IGUAL':
      return estado.hidratado ? estado : { ...estado, hidratado: true };

    case 'TERMINAR_ONBOARDING':
      return {
        ...estado,
        onboardingListo: true,
        perfil: { ...estado.perfil, ...accion.perfil },
        plan: accion.plan ?? estado.plan,
        planDesde: accion.plan ? claveDia(accion.hoy ?? new Date()) : estado.planDesde,
      };

    case 'GUARDAR_PLAN':
      return {
        ...estado,
        plan: accion.plan,
        planDesde: claveDia(accion.hoy ?? new Date()),
      };

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

    case 'RUTINA_COMPLETA':
      return { ...estado, rutinasCompletas: (estado.rutinasCompletas ?? 0) + 1 };

    case 'DISTANCIA_AVISADA':
      return { ...estado, distanciaAvisada: accion.nivel };

    case 'ALIVIAR_RETO':
      return { ...estado, retoAliviado: accion.valor ? claveDia(accion.hoy) : null };

    case 'PAUSAR_DIA':
      return { ...estado, diaEnPausa: accion.valor ? claveDia(accion.hoy) : null };

    // --- Dinero ------------------------------------------------------------

    case 'ANOTAR_GASTO':
      return { ...estado, gastos: [accion.gasto, ...estado.gastos] };

    // Se borra por id y no por posición: la lista se reordena al sincronizar,
    // y borrar por índice terminaría quitando el gasto equivocado.
    case 'BORRAR_GASTO':
      return { ...estado, gastos: estado.gastos.filter((g) => g.id !== accion.id) };

    case 'GUARDAR_PRESUPUESTO':
      return { ...estado, presupuesto: { ...estado.presupuesto, ...accion.cambios } };

    case 'GUARDAR_AHORRO':
      return { ...estado, ahorro: { ...estado.ahorro, ...accion.cambios } };

    case 'GUARDAR_PAREJA':
      return { ...estado, pareja: accion.pareja };

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

    // Aquí `leido` SÍ va en true: la persona pidió empezar de cero, así que
    // el estado en blanco es el que debe quedar guardado.
    case 'REINICIAR':
      return {
        ...estadoInicial,
        hidratado: true,
        leido: true,
        userId: estado.userId,
        enNube: estado.enNube,
      };

    default:
      return estado;
  }
}
