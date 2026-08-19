import { supabase, hayNube } from './supabase';
import { claveDia } from '../services/fecha';

// Llamadas a las Azure Functions. La app nunca ve la key de Gemini ni la
// service role de Supabase: solo manda su propio token de sesión.
//
// Si la API no está configurada o falla, estas funciones devuelven null.
// Quien las llama decide el plan B. Brío nunca deja una pantalla rota.

const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export const hayApi = Boolean(base && hayNube);

async function llamar(ruta, cuerpo, { timeoutMs = 20000 } = {}) {
  if (!hayApi) return null;

  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return null;

  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), timeoutMs);

  try {
    const respuesta = await fetch(`${base}/api/${ruta}`, {
      method: 'POST',
      signal: control.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      // La fecha local del teléfono: el servidor vive en UTC y se equivocaría
      // de día para quien está en América al caer la noche.
      body: JSON.stringify({ fecha: claveDia(), ...cuerpo }),
    });

    if (!respuesta.ok) return null;
    return await respuesta.json();
  } catch {
    return null;
  } finally {
    clearTimeout(corte);
  }
}

// Genera el plan de la semana. Puede tardar: el modelo escribe siete días.
//
// `ajustes` son las órdenes que sacó el motor de adaptación del historial
// (services/adaptacion.js). Van desde la app porque el análisis se hace con
// los días que el teléfono ya tiene, incluidos los que aún no subieron.
export function generarPlan(ajustes = []) {
  return llamar('plan', { ajustes }, { timeoutMs: 45000 });
}

// Una vuelta de conversación con Brío.
export function preguntarCoach(texto) {
  return llamar('coach', { texto }, { timeoutMs: 20000 });
}
