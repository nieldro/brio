import { app } from '@azure/functions';

import { ajustesFaltantes } from '../lib/config.js';
import { admin, usuarioDelToken } from '../lib/supabase.js';
import { generar } from '../lib/gemini.js';
import { promptCoach } from '../lib/prompts.js';
import { leerPerfil, planActual, ultimosMensajes, ultimoRegistro } from '../lib/datos.js';
import { fechaValida, hoyUtc, diaDeLaSemana } from '../lib/fechas.js';
import { ok, noAutorizado, malaPeticion, sinConfigurar, falloIA, cuerpoJson } from '../lib/http.js';

const LARGO_MAXIMO = 1000;

// POST /api/coach  { texto, fecha }
// Responde con la voz de Brío y deja los dos mensajes guardados.
async function manejar(request, context) {
  const faltan = ajustesFaltantes();
  if (faltan.length) return sinConfigurar(faltan);

  const usuario = await usuarioDelToken(request);
  if (!usuario) return noAutorizado();

  const cuerpo = await cuerpoJson(request);
  const texto = typeof cuerpo.texto === 'string' ? cuerpo.texto.trim() : '';
  if (!texto) return malaPeticion('el mensaje viene vacío');
  if (texto.length > LARGO_MAXIMO) return malaPeticion('el mensaje es demasiado largo');

  const hoy = fechaValida(cuerpo.fecha) ?? hoyUtc();

  const [perfil, plan, historial, registro] = await Promise.all([
    leerPerfil(usuario.id),
    planActual(usuario.id),
    ultimosMensajes(usuario.id, 10),
    ultimoRegistro(usuario.id),
  ]);

  if (!perfil) return malaPeticion('todavía no hay perfil para este usuario');

  const dia = plan?.plan?.dias?.find((d) => d.dia === diaDeLaSemana(hoy));

  const instruccion = promptCoach({
    nombre: perfil.nombre ?? 'amigo',
    edad: perfil.edad ?? 'no dice',
    objetivo: perfil.objetivo ?? 'Crear el hábito',
    porque: perfil.porque ?? 'sentirse mejor',
    lugar: perfil.lugar ?? 'En casa',
    tiempo: perfil.tiempo_min ?? 20,
    racha: perfil.racha_actual ?? 0,
    reto_hoy: dia?.reto ?? 'todavía no hay reto para hoy',
    ultimo_registro: registro
      ? `${registro.fecha}${registro.reto ? ` (${registro.reto})` : ''}`
      : 'ninguno todavía',
  });

  let respuesta;
  try {
    respuesta = await generar({
      instruccion,
      // El mensaje nuevo va al final del historial, no dentro de la instrucción:
      // así el modelo no puede confundir el texto del usuario con sus reglas.
      historial: [...historial, { rol: 'user', texto }],
      temperatura: 0.7,
      timeoutMs: 20000,
    });
  } catch (e) {
    context.error(`fallo del coach: ${e.message}`);
    return falloIA();
  }

  const { error } = await admin()
    .from('mensajes')
    .insert([
      { user_id: usuario.id, rol: 'user', texto },
      { user_id: usuario.id, rol: 'brio', texto: respuesta },
    ]);

  if (error) context.error(`no se pudieron guardar los mensajes: ${error.message}`);

  return ok({ texto: respuesta });
}

app.http('coach', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: manejar,
});
