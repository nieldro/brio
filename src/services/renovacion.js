import { claveDia, sumarDias } from './fecha.js';
import { analizar, instruccionesParaElPlan } from './adaptacion.js';

// Cuándo pedir un plan nuevo, y con qué ajustes.
//
// El Timer del lunes atiende a quien se está moviendo. A quien lleva semanas
// fuera no lo despierta a las cuatro de la mañana con un plan: se lo arma
// cuando vuelva. Esto es ese "cuando vuelva".
//
// Y aquí se cierra un cable que estaba suelto: el motor de adaptación
// (services/adaptacion.js) sabía desde hace rato que los lunes se le
// atraviesan a alguien, pero eso solo se mostraba en Progreso. Nunca llegaba
// a quien arma el plan. Una app que te dice "noté que los lunes te cuestan"
// y a la semana siguiente te vuelve a poner el lunes pesado no está notando
// nada: está adivinando en voz alta.

// Una semana. Si el plan cumplió siete días, ya se pasó de su semana.
export const DIAS_DE_VIGENCIA = 7;

// Sin esto, un teléfono sin conexión reintentaría en cada arranque.
const REINTENTO_HORAS = 6;

export function planVencido({ plan, planDesde }, hoy = new Date()) {
  // Sin plan no hay nada que renovar: ese caso lo cubre el onboarding, y
  // pedirlo aquí le pisaría el paso.
  if (!plan) return false;

  // Un plan sin fecha viene de antes de que se guardara la fecha. Se le da
  // por vencido: es más seguro renovar de más que dejar a alguien clavado.
  if (!planDesde) return true;

  return claveDia(hoy) >= sumarDias(planDesde, DIAS_DE_VIGENCIA);
}

// ¿Se puede intentar ahora? Evita machacar la red cuando no hay señal.
export function sePuedeIntentar(ultimoIntento, ahora = Date.now()) {
  if (!ultimoIntento) return true;
  return ahora - ultimoIntento >= REINTENTO_HORAS * 3_600_000;
}

// Las órdenes que acompañan la petición: lo que Brío aprendió del historial.
//
// Van desde la app porque el análisis se hace con los días que el teléfono ya
// tiene, incluidos los que todavía no subieron a la nube.
export function ajustesParaRenovar(diasCompletados = [], hoy = new Date()) {
  return instruccionesParaElPlan(analizar(diasCompletados, hoy));
}

// La decisión completa, en un solo lugar y sin efectos.
export function queHacerConElPlan(estado, hoy = new Date(), ultimoIntento = null, ahora = Date.now()) {
  if (!planVencido(estado, hoy)) return { renovar: false, motivo: 'vigente' };
  if (!sePuedeIntentar(ultimoIntento, ahora)) return { renovar: false, motivo: 'espera' };

  return {
    renovar: true,
    motivo: estado.planDesde ? 'vencido' : 'sin fecha',
    ajustes: ajustesParaRenovar(estado.diasCompletados, hoy),
  };
}
