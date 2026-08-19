import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';
import { guardarPerfil, marcarRegistro, guardarLogro } from './repositorio';
import {
  encolar,
  pendientes,
  confirmar,
  reprogramar,
  proximoIntento,
  resumen,
} from '../services/cola';

// El motor que vacía la cola. La lógica de QUÉ mandar y CUÁNDO vive en
// services/cola.js, que es pura y está probada. Aquí solo están los efectos:
// disco, red y el temporizador.

const CLAVE = 'brio:cola:v1';

let cola = [];
let leida = false;
let corriendo = false;
let temporizador = null;
const oyentes = new Set();

// --- Disco ----------------------------------------------------------------

async function leerDelDisco() {
  if (leida) return;
  try {
    const crudo = await AsyncStorage.getItem(CLAVE);
    cola = crudo ? JSON.parse(crudo) : [];
  } catch {
    cola = [];
  }
  leida = true;
}

async function guardarEnDisco() {
  try {
    await AsyncStorage.setItem(CLAVE, JSON.stringify(cola));
  } catch {
    // Si el disco falla, la cola sigue viva en memoria hasta cerrar la app.
  }
}

function avisar() {
  const estado = resumen(cola);
  for (const o of oyentes) {
    try {
      o(estado);
    } catch {}
  }
}

// --- Envío ----------------------------------------------------------------

// Devuelve true solo si el servidor CONFIRMÓ. Cualquier otra cosa deja la
// operación en la cola: es preferible mandarla dos veces que perderla.
async function enviar(op, userId) {
  switch (op.tipo) {
    case 'perfil':
      return guardarPerfil(userId, op.datos);
    case 'registro':
      return marcarRegistro(userId, {
        fecha: op.fecha,
        reto: op.reto ?? null,
        rachaActual: op.rachaActual,
        mejorRacha: op.mejorRacha,
      });
    case 'logro':
      return guardarLogro(userId, { fecha: op.fecha, texto: op.texto });
    default:
      return true; // desconocida: se descarta, no se reintenta para siempre
  }
}

// --- Ciclo ----------------------------------------------------------------

function programar() {
  clearTimeout(temporizador);
  const espera = proximoIntento(cola, Date.now());
  if (espera === null) return;
  temporizador = setTimeout(() => vaciar(), Math.max(espera, 250));
}

export async function vaciar(userId) {
  await leerDelDisco();

  if (corriendo) return;
  if (!supabase) return;

  const dueno = userId ?? (await supabase.auth.getSession()).data?.session?.user?.id;
  if (!dueno) return;

  const listos = pendientes(cola, Date.now());
  if (!listos.length) {
    programar();
    return;
  }

  corriendo = true;

  try {
    for (const op of listos) {
      const ok = await enviar(op, dueno);
      cola = ok ? confirmar(cola, op.clave) : reprogramar(cola, op.clave, Date.now());
    }
    await guardarEnDisco();
    avisar();
  } finally {
    corriendo = false;
  }

  programar();
}

// --- API pública ----------------------------------------------------------

// Toda escritura a la nube entra por aquí. Devuelve enseguida: el usuario no
// espera a la red para ver su día marcado.
export async function anotar(operacion) {
  await leerDelDisco();
  cola = encolar(cola, operacion);
  await guardarEnDisco();
  avisar();
  vaciar();
}

// Para que la UI pueda mostrar "guardando…" sin saber nada de la cola.
export function escuchar(oyente) {
  oyentes.add(oyente);
  if (leida) oyente(resumen(cola));
  return () => oyentes.delete(oyente);
}

export async function estadoDeLaCola() {
  await leerDelDisco();
  return resumen(cola);
}

// Al cerrar sesión: lo pendiente era del usuario anterior.
export async function vaciarCola() {
  cola = [];
  leida = true;
  await guardarEnDisco();
  avisar();
}
