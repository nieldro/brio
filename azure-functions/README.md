# Funciones de Brío en Azure

Capa de IA de Brío. Aquí vive la única copia de las llaves de Gemini y de la
service role de Supabase. La app móvil nunca las ve.

## Por qué está aquí y no en la app

La app solo manda su token de sesión de Supabase. La función lo verifica y
**deriva el `user_id` del token, nunca del cuerpo de la petición**. Como la
service role key salta Row Level Security, ese filtro explícito es la única
barrera entre un usuario y los datos de otro. No quitarlo nunca.

## Funciones

| Ruta | Método | Qué hace |
|---|---|---|
| `/api/plan` | POST | Lee el perfil, llama a Gemini con el prompt 2, valida el JSON y lo guarda en `planes`. |
| `/api/coach` | POST | Lee perfil, plan y últimos 10 mensajes, llama a Gemini con el prompt 1 y guarda ambos mensajes. |

Las dos aceptan `{ "fecha": "2026-08-14" }`: la fecha **local** del teléfono.
El servidor vive en UTC y se equivocaría de día para quien está en América al
caer la noche.

`plan` valida el JSON contra las reglas del producto y **reintenta una vez**
diciéndole al modelo qué falló. Si el segundo intento tampoco sirve, responde
502 y la app sigue con el plan de arranque en vez de mostrar algo roto.

## Ajustes (Application Settings)

| Nombre | Dónde sale |
|---|---|
| `SUPABASE_URL` | Supabase › Project Settings › API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase › Project Settings › API › service_role |
| `GEMINI_API_KEY` | Google AI Studio › API keys |
| `GEMINI_MODELO` | Opcional. Por defecto `gemini-2.5-flash` |

Si falta alguno, las funciones responden 503 con el nombre del ajuste que
falta, en vez de fallar de forma rara.

## Correr en tu máquina

```bash
npm install
cp local.settings.example.json local.settings.json   # y pega tus valores
func start
```

Necesitas [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local).
Luego, en el `.env` de la app: `EXPO_PUBLIC_API_URL=http://localhost:7071`.

## Publicar

```bash
func azure functionapp publish brio-functions
```

La Function App debe estar en **plan de consumo** (un millón de ejecuciones
gratis al mes, capa gratuita permanente). Activa Application Insights con la
cuota mensual gratuita.

Después de publicar, en el `.env` de la app:
`EXPO_PUBLIC_API_URL=https://brio-functions.azurewebsites.net`.

También hay que permitir el origen de la app en **CORS** de la Function App.

## Pruebas

```bash
npm test
```

Cubren lo que puede fallar sin red: la extracción del JSON que el modelo
devuelve envuelto en markdown, la validación contra las reglas del producto
(7 días, mínimo 2 suaves, duración, tips sin calorías, palabras prohibidas) y
el manejo de fechas.
