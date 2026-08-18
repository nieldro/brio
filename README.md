# Brío

App móvil de hábitos, ejercicio y autoestima con coach de IA.

**La fuente de verdad del producto es [CLAUDE.md](CLAUDE.md).** Este archivo
solo explica cómo levantar el proyecto.

## Arrancar en tu máquina

```bash
npm install
npx expo start
```

Escanea el QR con **Expo Go**. Sin `.env` la app funciona en modo local: usa un
plan de arranque y guarda todo en el teléfono. Sirve para trabajar en la
interfaz sin depender de la nube.

## Conectar la nube

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. **SQL Editor** → pega [supabase/schema.sql](supabase/schema.sql) → Run.
3. **SQL Editor** → pega [supabase/migrations/002_recordatorios.sql](supabase/migrations/002_recordatorios.sql) → Run.
   Sin esto no se puede cumplir el tope de dos notificaciones al día.
4. **Authentication › Sign In / Providers › Anonymous sign-ins → On.**
5. Copia `.env.example` como `.env` y pega la URL y la clave `anon`.
6. `npx expo start --clear` — el `--clear` es obligatorio: las variables se
   inyectan al compilar.

Para la capa de IA, sigue [azure-functions/README.md](azure-functions/README.md)
y agrega `EXPO_PUBLIC_API_URL` al `.env`.

## Probar los recordatorios

**Expo Go ya no entrega push remoto en Android** (desde el SDK 53). Para probar
los recordatorios hace falta un development build, que también es gratis:

```bash
npx eas build --profile development --platform android
```

Las variables `EXPO_PUBLIC_*` no se leen del `.env` en EAS: hay que declararlas
en las variables de entorno del proyecto en EAS.

Todo lo demás sí se prueba en Expo Go.

## Landing

Publicada en Azure Static Web Apps, capa **gratuita**:

**https://mango-smoke-0a5b7bf10.7.azurestaticapps.net**

Para volver a desplegarla después de editar `landing/`:

```powershell
$token = az staticwebapp secrets list --name brio-landing --resource-group rg-brio --query "properties.apiKey" -o tsv
npx @azure/static-web-apps-cli deploy ./landing --env production --deployment-token $token
```

La primera vez puede fallar con «Could not find StaticSitesClient local binary»:
el CLI descarga un binario aparte y a veces no lo logra al primer intento.
Reintentar funciona.

## Pruebas

```bash
npm test                      # servicios de la app
npm test --prefix azure-functions   # funciones
```

Las pruebas cubren lo que puede romperse en silencio: reglas de racha, fechas
que cruzan mes y año bisiesto, validación del JSON que devuelve la IA, el tope
de notificaciones por zona horaria, y que **ningún texto de la app use las
palabras prohibidas** de la voz de Brío.

## Mapa del código

```
src/
  theme.js          colores, espaciados y tipografía. Nadie escribe un #hex fuera de aquí
  components/       piezas propias. Cero librerías de UI
  screens/          solo componen. La lógica de negocio no vive aquí
  services/         reglas puras: racha, fechas, plan. Se prueban solas
  state/            Context + useReducer. Única fuente de verdad en la app
  lib/              adaptadores externos: supabase, repositorio, api, almacenamiento
supabase/           esquema y migraciones
azure-functions/    capa de IA y recordatorios. Aquí viven las llaves
landing/            página pública para Azure Static Web Apps
```

La regla que sostiene todo: las dependencias van hacia abajo. Una pantalla
habla con `state/` y `services/`, nunca con Supabase directamente. Por eso las
fases 1 a 3 funcionaban con datos quemados y la fase 4 no obligó a reescribir
ninguna pantalla.

## Vulnerabilidades de npm

`npm audit` reporta hallazgos en `image-size`, que entra por Metro y el CLI de
Expo. Son herramientas de compilación, no código que viaje en la app.
`npm audit fix --force` rompe Expo: se dejan y se revisan cuando Expo publique
una versión nueva.
