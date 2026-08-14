// Toda la configuración sale de Application Settings de la Function App.
// Ninguna llave vive en el código ni viaja a la app móvil.

export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  // Configurable para poder migrar de modelo sin tocar código (RNF-07).
  geminiModelo: process.env.GEMINI_MODELO || 'gemini-2.5-flash',
};

// Se revisa al arrancar cada función: mejor un 503 claro que un fallo raro.
export function ajustesFaltantes() {
  const faltan = [];
  if (!config.supabaseUrl) faltan.push('SUPABASE_URL');
  if (!config.serviceRoleKey) faltan.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!config.geminiKey) faltan.push('GEMINI_API_KEY');
  return faltan;
}
