import { app } from '@azure/functions';

import { ajustesFaltantes } from '../lib/config.js';
import { usuarioDelToken } from '../lib/supabase.js';
import { leerPerfil } from '../lib/datos.js';
import { generar } from '../lib/gemini.js';
import { promptPlato } from '../lib/prompts.js';
import { extraerJson } from '../lib/planJson.js';
import { validarPlato } from '../lib/platoJson.js';
import { ok, noAutorizado, malaPeticion, sinConfigurar, falloIA, cuerpoJson } from '../lib/http.js';

// POST /api/plato
// Mira una foto de comida y devuelve el semáforo del día con UNA suma.
//
// La foto no se guarda en ninguna parte: ni en Supabase, ni en el disco de la
// función, ni en un log. Entra en la petición, va a Gemini y se va con la
// respuesta. Es la única forma de pedirle a alguien una foto de lo que come.

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

  const perfil = await leerPerfil(usuario.id);
  const instruccion = promptPlato({ nombre: perfil?.nombre ?? '' });

  // Un solo reintento, igual que el plan: si el modelo se sale de las reglas
  // se le dice exactamente en qué y se le da otra oportunidad. Si vuelve a
  // salirse, la app no muestra nada antes que mostrar algo que juzgue.
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
                ? 'Mira este plato.'
                : `El intento anterior falló por: ${fallos.join('; ')}. Corrígelo y responde solo el JSON.`,
          },
        ],
        imagen: { datos, tipo },
        temperatura: 0.2,
        timeoutMs: 25000,
        log: context,
      });

      const revision = validarPlato(extraerJson(crudo));
      if (revision.ok) resultado = revision.resultado;
      else {
        fallos = revision.errores;
        context.warn?.(`plato inválido (intento ${intento}): ${fallos.join('; ')}`);
      }
    } catch (e) {
      fallos = [e.message];
      context.error?.(`fallo al mirar el plato (intento ${intento}): ${e.message}`);
    }
  }

  if (!resultado) return falloIA();

  return ok(resultado);
}

app.http('plato', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: manejar,
});
