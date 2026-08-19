import { restarDias } from './fechas.js';

// A quién le toca plan nuevo el lunes, en qué orden y hasta dónde alcanza.
//
// Esto vive aparte porque es lo que evita que la función se muera callada.
// El Timer tiene un tiempo máximo y generar un plan tarda entre cinco y
// cincuenta segundos. Sin filtro, la lista crece con cada persona que se
// registra —incluidas las que probaron la app una vez y no volvieron— y un
// lunes cualquiera deja de alcanzar. Nadie se entera: la función se corta a
// mitad de la lista y los últimos se quedan con el plan de la semana pasada.

// Tres semanas sin moverse. A quien lleva tanto fuera no se le arma un plan
// a las cuatro de la mañana: se le arma cuando vuelva, y arrancando suave.
export const DIAS_SIN_MOVERSE = 21;

// Cuánto se permite trabajar. Se corta bastante antes del límite de la
// función para que quepa una última generación lenta sin que la maten.
export const PRESUPUESTO_MS = 420_000;

// De a tres. La pausa fija de antes era tiempo tirado a la basura, y el
// límite de la capa gratuita de Gemini es por minuto, no por simultáneas.
export const A_LA_VEZ = 3;

// Un plan de hace menos de esto todavía sirve y no se rehace.
//
// Es lo que hace que correr el Timer dos veces no haga daño: la segunda vez
// no encuentra a nadie. También evita chocar con la app, que renueva sola
// cuando alguien vuelve después de un tiempo.
export const DIAS_DE_PLAN_FRESCO = 6;

// Filtra a quien no se ha movido y pone primero al del plan más viejo.
//
// El orden importa más de lo que parece: si el tiempo no alcanza, se corta
// por el final, y como el final es el de los planes más nuevos, la semana
// siguiente los que se quedaron sin plan son los primeros de la fila.
// Con cualquier otro orden, los mismos se quedarían por fuera para siempre.
export function aQuienLeToca(usuarios, hoy, opciones = {}) {
  const { dias = DIAS_SIN_MOVERSE, frescura = DIAS_DE_PLAN_FRESCO } = opciones;

  const corte = restarDias(hoy, dias);
  const reciente = restarDias(hoy, frescura);

  return (usuarios ?? [])
    .filter((u) => u?.userId)
    .filter((u) => typeof u.ultimoMovimiento === 'string' && u.ultimoMovimiento >= corte)
    .filter((u) => orden(u.planDesde).slice(0, 10) < reciente)
    .sort((a, b) => orden(a.planDesde).localeCompare(orden(b.planDesde)));
}

// Sin plan previo va primero: es quien más lo necesita.
const orden = (valor) => (typeof valor === 'string' && valor ? valor : '');

// Corre el trabajo de a varios y para cuando se acaba el tiempo.
//
// Devuelve también cuántos quedaron sin atender. Ese número se registra: una
// tanda que se recorta en silencio se lee igual que una que terminó, y es
// justo el error que estamos arreglando.
export async function enTandas(items, hacer, opciones = {}) {
  const {
    aLaVez = A_LA_VEZ,
    presupuestoMs = PRESUPUESTO_MS,
    reloj = Date.now,
  } = opciones;

  const arranque = reloj();
  const pendientes = [...(items ?? [])];
  const hechos = [];
  let sinTiempo = false;

  const obrero = async () => {
    while (pendientes.length) {
      if (reloj() - arranque >= presupuestoMs) {
        sinTiempo = true;
        return;
      }

      const item = pendientes.shift();
      try {
        hechos.push({ item, resultado: await hacer(item) });
      } catch (e) {
        // Que uno falle no puede tumbar la tanda: los demás siguen esperando
        // su plan.
        hechos.push({ item, error: e?.message ?? String(e) });
      }
    }
  };

  const cuantos = Math.max(1, Math.min(aLaVez, pendientes.length));
  await Promise.all(Array.from({ length: cuantos }, obrero));

  return { hechos, quedaron: pendientes.length, sinTiempo };
}
