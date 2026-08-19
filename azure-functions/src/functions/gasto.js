import { app } from '@azure/functions';

import { ajustesFaltantes } from '../lib/config.js';
import { usuarioDelToken } from '../lib/supabase.js';
import { leerPerfil } from '../lib/datos.js';
import { generar } from '../lib/gemini.js';
import { extraerJson } from '../lib/planJson.js';
import { validarGasto, promptGasto } from '../lib/gastoJson.js';
import { fechaValida, hoyUtc } from '../lib/fechas.js';
import { ok, noAutorizado, malaPeticion, sinConfigurar, falloIA, cuerpoJson } from '../lib/http.js';

// POST /api/gasto
// Lee la foto de una factura y devuelve el gasto para que la persona confirme.
//
// DOS COSAS QUE ESTA FUNCIÓN NO HACE, A PROPÓSITO
//
// 1. No guarda la foto. Ni en Supabase, ni en el disco de la función, ni en un
//    log. Entra en la petición, va a Gemini y se va con la respuesta. Una
//    factura lleva dónde estuvo la persona y a qué hora, y eso no se archiva.
//
// 2. No guarda el gasto. Devuelve la lectura y ya: un OCR se equivoca, y un
//    número mal leído que se anota solo es un número que la persona ve como
//    suyo sin haberlo aprobado. Confirma ella, y guarda la app por el mismo
//    camino que un gasto escrito a mano.

const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp']);

// ~1,3 MB de imagen. La app manda 720 px, que pesa mucho menos; este tope
// está para que una petición rara no se lleve la memoria de la función.
const MAXIMO_BASE64 = 1_800_000;

// Quita el "data:image/jpeg;base64," que ponen algunos clientes.
const limpiar = (s) => String(s).replace(/^data:[^;]+;base64,/, '').trim();

async function manejar(request, context) {
  const faltan = ajustesFaltantes();
  if (faltan.length) return sinConfigurar(faltan);

  const usuario = await usuarioDelToken(request);
  if (!usuario) return noAutorizado();

  const cuerpo = await cuerpoJson(request);
  const tipo = cuerpo.tipo ?? 'image/jpeg';

  if (typeof cuerpo.imagen !== 'string' || !cuerpo.imagen.trim()) {
    return malaPeticion('falta la imagen');
  }
  if (!TIPOS.has(tipo)) return malaPeticion('formato de imagen no admitido');

  const datos = limpiar(cuerpo.imagen);
  if (datos.length > MAXIMO_BASE64) return malaPeticion('la foto pesa demasiado');

  // El día lo manda la app: el servidor vive en UTC y a las 8 p. m. en Bogotá
  // ya sería mañana, así que una factura de hoy se leería como del futuro.
  const hoy = fechaValida(cuerpo.fecha) ?? hoyUtc();

  const perfil = await leerPerfil(usuario.id);
  const instruccion = promptGasto({ nombre: perfil?.nombre ?? '', hoy });

  // Un solo reintento, igual que el plan y el plato: si el modelo se sale de
  // las reglas se le dice exactamente en qué y se le da otra oportunidad. Si
  // vuelve a salirse, la app no muestra nada antes que mostrar algo que juzgue.
  let resultado = null;
  let fallos = [];

  for (let intento = 1; intento <= 2 && !resultado; intento += 1) {
    try {
      const crudo = await generar({
        instruccion,
        historial: [
          {
            rol: 'user',
            texto:
              intento === 1
                ? 'Lee esta factura.'
                : `El intento anterior falló por: ${fallos.join('; ')}. Corrígelo y responde solo el JSON.`,
          },
        ],
        imagen: { datos, tipo },
        temperatura: 0.1,
        timeoutMs: 25000,
        log: context,
      });

      const revision = validarGasto(extraerJson(crudo), { hoy });
      if (revision.ok) resultado = revision.resultado;
      else {
        fallos = revision.errores;
        context.warn?.(`gasto inválido (intento ${intento}): ${fallos.join('; ')}`);
      }
    } catch (e) {
      fallos = [e.message];
      context.error?.(`fallo al leer la factura (intento ${intento}): ${e.message}`);
    }
  }

  if (!resultado) return falloIA();

  return ok(resultado);
}

app.http('gasto', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: manejar,
});
