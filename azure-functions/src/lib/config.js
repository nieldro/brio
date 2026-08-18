// Toda la configuración sale de Application Settings de la Function App.
// Ninguna llave vive en el código ni viaja a la app móvil.

export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  // LISTA de modelos, en orden de preferencia, separados por coma.
  // El primero que responda gana; si uno está retirado o saturado, lo releva
  // el siguiente. Ver el porqué en gemini.js. Mitiga el riesgo R3.
  geminiModelos: (process.env.GEMINI_MODELO || 'gemini-3.6-flash,gemini-flash-latest,gemini-3-flash-preview')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
};

// Se revisa al arrancar cada función: mejor un 503 claro que un fallo raro.
export function ajustesFaltantes() {
  const faltan = [];
  if (!config.supabaseUrl) faltan.push('SUPABASE_URL');
  if (!config.serviceRoleKey) faltan.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!config.geminiKey) faltan.push('GEMINI_API_KEY');
  return faltan;
}
