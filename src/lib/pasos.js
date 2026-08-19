import { Platform } from 'react-native';

// El podómetro del teléfono. El efecto; la regla vive en services/movimiento.js.
//
// El módulo se pide dentro de la función y no arriba del archivo, igual que
// la cámara y las notificaciones: un import nativo en el alcance del módulo
// tumba la app entera al cargar la pila cuando el módulo no está, y sin decir
// por qué.
//
// Aquí NADA lanza y nada es obligatorio. Sin sensor, con el permiso negado o
// en Expo Go, todo termina en `disponible: false` y la app sigue exactamente
// igual. Los pasos son un extra: si desaparecen, no se cae nada ni se rompe
// ninguna cuenta, porque no alimentan ninguna cuenta.

let MODULO;
function pedometro() {
  if (MODULO === undefined) {
    try {
      // eslint-disable-next-line global-require
      MODULO = require('expo-sensors').Pedometer ?? null;
    } catch {
      MODULO = null;
    }
  }
  return MODULO;
}

// Lo que se devuelve cuando no hay nada que leer. `pasos: null` NO es cero:
// es "no sé", y la diferencia importa porque un cero se mostraría como un
// mal día cuando en realidad es un teléfono sin sensor.
const APAGADO = { disponible: false, permiso: false, pasos: null, historico: false };

// En Android, `getStepCountAsync` lanza siempre: el sistema no guarda un
// historial que expo-sensors pueda consultar hacia atrás. Se pregunta antes
// por la plataforma y ni se intenta, porque un error atrapado igual sale por
// consola y en desarrollo aparece como una alerta roja encima de la app.
const hayHistorial = () => Platform.OS === 'ios';

export async function estadoDelPodometro() {
  const P = pedometro();
  if (!P) return APAGADO;

  try {
    if (!(await P.isAvailableAsync())) return APAGADO;

    const { granted } = await P.getPermissionsAsync();
    return { disponible: true, permiso: !!granted, pasos: null, historico: hayHistorial() };
  } catch {
    return APAGADO;
  }
}

// Se pide una vez y desde donde la persona lo pidió, nunca al abrir la app.
// Un permiso de actividad en la cara al arrancar se niega por reflejo.
export async function pedirPermisoDePasos() {
  const P = pedometro();
  if (!P) return false;

  try {
    const actual = await P.getPermissionsAsync();
    if (actual.granted) return true;

    const pedido = await P.requestPermissionsAsync();
    return !!pedido.granted;
  } catch {
    return false;
  }
}

// Los pasos desde medianoche. Solo donde el sistema guarda el historial.
export async function pasosDeHoy() {
  const estado = await estadoDelPodometro();
  if (!estado.disponible || !estado.permiso || !hayHistorial()) return estado;

  try {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const { steps } = await pedometro().getStepCountAsync(inicio, new Date());
    return { ...estado, pasos: Number(steps) || 0 };
  } catch {
    return estado;
  }
}

// Mira el podómetro mientras la pantalla esté abierta.
//
// Llama a `alCambiar` con { disponible, permiso, pasos, historico } cada vez
// que hay algo nuevo, y devuelve la función para dejar de mirar. La suscripción
// se corta al salir de la pantalla a propósito: contar pasos en segundo plano
// gasta batería para alimentar un número que ni siquiera es una métrica.
export function seguirPasos(alCambiar) {
  let vivo = true;
  let suscripcion = null;

  const avisar = (estado) => {
    if (vivo && typeof alCambiar === 'function') alCambiar(estado);
  };

  (async () => {
    const estado = await estadoDelPodometro();
    if (!vivo) return;

    if (!estado.disponible || !estado.permiso) {
      avisar(estado);
      return;
    }

    // Se arranca con lo que ya llevaba el día, donde se pueda saber. Sin
    // esto, quien abre la app a las seis de la tarde vería la cuenta empezar
    // en cero, como si no hubiera caminado en todo el día.
    const yaLlevaba = (await pasosDeHoy()).pasos;
    if (!vivo) return;

    avisar({ ...estado, pasos: yaLlevaba });

    try {
      suscripcion = pedometro().watchStepCount(({ steps }) => {
        avisar({ ...estado, pasos: (yaLlevaba ?? 0) + (Number(steps) || 0) });
      });
    } catch {
      // Sin suscripción se queda con lo que ya se avisó. Nunca un error visible.
    }
  })();

  return () => {
    vivo = false;
    try {
      suscripcion?.remove?.();
    } catch {
      // Desmontar no puede fallar hacia afuera.
    }
  };
}
