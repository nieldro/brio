import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Cliente con service role: salta Row Level Security. Solo existe aquí, en el
// servidor. Por eso cada función debe filtrar SIEMPRE por el user_id del token.
let cliente = null;

export function admin() {
  if (!cliente) {
    cliente = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
}

// El user_id NUNCA se toma del cuerpo de la petición: sale del token firmado
// por Supabase. Si viniera del cuerpo, cualquiera podría leer datos ajenos.
export async function usuarioDelToken(request) {
  const encabezado = request.headers.get('authorization') || '';
  if (!encabezado.toLowerCase().startsWith('bearer ')) return null;

  const token = encabezado.slice(7).trim();
  if (!token) return null;

  try {
    const { data, error } = await admin().auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    // Supabase caído o URL mal configurada: se responde 401, no 500.
    // Un token que no se pudo verificar es un token que no vale.
    return null;
  }
}
