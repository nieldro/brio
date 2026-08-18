// Toda la configuración sale de Application Settings de la Function App.
// Ninguna llave vive en el código ni viaja a la app móvil.

export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  // Configurable para poder migrar de modelo sin tocar código (RNF-07).
  //
  // Por defecto un ALIAS, no una versión fija: Google retira modelos para
  // cuentas nuevas sin avisar. `gemini-2.5-flash` empezó a devolver 404
  // ("no longer available to new users") y dejó la app sin plan. El alias
  // sigue apuntando al modelo vigente, y el validador de planJson.js protege
  // la calidad de lo que salga. Mitiga el riesgo R3 del entregable.
  geminiModelo: process.env.GEMINI_MODELO || 'gemini-flash-latest',
};

// Se revisa al arrancar cada función: mejor un 503 claro que un fallo raro.
export function ajustesFaltantes() {
  const faltan = [];
  if (!config.supabaseUrl) faltan.push('SUPABASE_URL');
  if (!config.serviceRoleKey) faltan.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!config.geminiKey) faltan.push('GEMINI_API_KEY');
  return faltan;
}
