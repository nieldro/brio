# Funciones de Brío en Azure

Capa de IA de Brío. Aquí vive la única copia de las llaves de Gemini y de la
service role de Supabase. La app móvil nunca las ve.

## Por qué está aquí y no en la app

La app solo manda su token de sesión de Supabase. La función lo verifica y
**deriva el `user_id` del token, nunca del cuerpo de la petición**. Como la
service role key salta Row Level Security, ese filtro explícito es la única
barrera entre un usuario y los datos de otro. No quitarlo nunca.

## Funciones

| Nombre | Disparador | Qué hace |
|---|---|---|
| `plan` | HTTP `POST /api/plan` | Lee el perfil, llama a Gemini con el prompt 2, valida el JSON y lo guarda en `planes`. |
| `coach` | HTTP `POST /api/coach` | Lee perfil, plan y últimos 10 mensajes, llama a Gemini con el prompt 1 y guarda ambos mensajes. |
| `recordatorios` | Timer, cada hora en punto | Escribe por Expo Push a quien le toca **a su hora local**, máximo 2 al día. A quien ya cumplió, no le escribe. |
| `plan-semanal` | Timer, lunes 9:00 UTC | Regenera el plan de todos según el cumplimiento, usando la misma `crearPlan`. |

`recordatorios` y `plan-semanal` requieren la migración
`supabase/migrations/002_recordatorios.sql`, que agrega `zona_horaria` y el
contador diario. Sin ella el tope de dos notificaciones no se puede cumplir.

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
| `GEMINI_MODELO` | Opcional. Por defecto `gemini-flash-latest` |

**Usa el alias, no una versión fija.** Google retira modelos para cuentas
nuevas sin avisar: `gemini-2.5-flash` empezó a devolver
`404 no longer available to new users` y dejó la app sin plan. El alias
`gemini-flash-latest` sigue apuntando al modelo vigente, y el validador de
`planJson.js` protege la calidad de lo que salga.

Si falta alguno, las funciones responden 503 con el nombre del ajuste que
falta, en vez de fallar de forma rara.

## Correr en tu máquina

```bash
npm install
cp local.settings.example.json local.settings.json   # y pega tus valores
npx azurite --silent &   # almacenamiento local, lo piden los Timer Trigger
npm start
```

Las Core Tools v4 y Azurite entran como `devDependencies`: no hay que
instalar nada de forma global ni con permisos de administrador.

Luego, en el `.env` de la app: `EXPO_PUBLIC_API_URL=http://localhost:7071`.

Con el host arriba se pueden verificar los caminos de error sin llaves reales:

```bash
curl -s -w "\n%{http_code}\n" -X POST http://localhost:7071/api/plan \
  -H "Content-Type: application/json" -d '{}'
```

Sin encabezado `Authorization` responde **401**. Si faltan ajustes en la
configuración, responde **503** nombrando cuáles.

## Publicar

```bash
npx func azure functionapp publish brio-functions-68191c --build remote --subscription <id>
```

El `--subscription` es necesario: Core Tools no siempre hereda el contexto de
`az` y falla con «Can't find app with name».

La Function App debe estar en **plan de consumo** (SKU `Y1`, nivel `Dynamic`):
un millón de ejecuciones gratis al mes, capa gratuita permanente. Cualquier
otro plan consume los créditos, que vencen.

### Dos cosas que costaron tiempo, para no repetirlas

**Node 22, no 24.** `az functionapp list-runtimes --os linux` reporta `Node|24`
como soportado en Functions v4, pero esa lista no separa por plan de
hospedaje. En Linux consumo la app se crea, dice `Running`, y tanto el sitio
como Kudu responden **503 indefinidamente**: nunca levanta un trabajador. Con
Node 22 arranca de inmediato. Verificado el 18/08/2026 en dos regiones
distintas, así que no es un problema del sello.

**Regiones restringidas.** Las suscripciones Azure for Students traen la
directiva `Allowed resource deployment regions`. Para ver cuáles permite:

```bash
az policy assignment list --query "[?displayName=='Allowed resource deployment regions'] | [0].parameters.listOfAllowedLocations.value"
```

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
