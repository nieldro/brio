import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Las llaves llegan por variables de entorno de Expo, nunca quemadas.
// Si no están, la app funciona igual en modo local: nada se rompe.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const hayNube = Boolean(url && anon);

export const supabase = hayNube
  ? createClient(url, anon, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // No hay navegador ni redirecciones: es una app.
        detectSessionInUrl: false,
      },
    })
  : null;

// Sesión anónima: entrar sin correo ni contraseña. Cero fricción en el paso 1.
// En una versión futura esta cuenta se puede vincular a un correo sin perder datos.
export async function sesionAnonima() {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (data?.session) return data.session;

  const { data: nueva, error } = await supabase.auth.signInAnonymously();
  if (error) return null;
  return nueva.session;
}
