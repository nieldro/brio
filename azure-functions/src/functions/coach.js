import { app } from '@azure/functions';

import { ajustesFaltantes } from '../lib/config.js';
import { admin, usuarioDelToken } from '../lib/supabase.js';
import { generar } from '../lib/gemini.js';
import { promptCoach } from '../lib/prompts.js';
import { detectarRiesgo, respuestaDeRiesgo, notaDeRiesgo } from '../lib/riesgo.js';
import { leerPerfil, planActual, ultimosMensajes, ultimoRegistro } from '../lib/datos.js';
import { fechaValida, hoyUtc, diaDeLaSemana } from '../lib/fechas.js';
import { ok, noAutorizado, malaPeticion, sinConfigurar, falloIA, cuerpoJson } from '../lib/http.js';

const LARGO_MAXIMO = 1000;

// Los dos mensajes de la vuelta, guardados juntos. Si falla, se sigue: el
// hilo se pierde, pero la persona ya tiene su respuesta en pantalla.
async function guardarVuelta(userId, texto, respuesta, context) {
  const { error } = await admin()
    .from('mensajes')
    .insert([
      { user_id: userId, rol: 'user', texto },
      { user_id: userId, rol: 'brio', texto: respuesta },
    ]);

  if (error) context.error(`no se pudieron guardar los mensajes: ${error.message}`);
}

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

  // El detector corre ANTES que la IA y la puede cortocircuitar.
  //
  // El prompt ya lleva sus reglas de seguridad, pero un prompt es una
  // petición: no hay forma de comprobar que el modelo la obedeció, y el día
  // que no lo haga se entera la persona equivocada. Esto es código.
  const riesgo = detectarRiesgo(texto);

  if (riesgo.corta) {
    // Solo el perfil: ni plan, ni historial, ni reto de hoy. Nada de eso entra
    // en esta respuesta, y pedirlo sería trabajo para tirar.
    const perfil = await leerPerfil(usuario.id);

    // Sin perfil se contesta igual, sin nombre. Devolver un 400 a quien acaba
    // de escribir esto sería dejarlo mirando una pantalla de error.
    const respuesta = respuestaDeRiesgo(riesgo.nivel, perfil?.nombre);

    // Se registra QUE pasó, nunca QUÉ escribió. Lo que alguien dice en su peor
    // momento no tiene por qué quedar guardado en un log de Azure.
    context.warn(`riesgo detectado (${riesgo.nivel}): se respondió sin llamar a la IA`);

    await guardarVuelta(usuario.id, texto, respuesta, context);
    return ok({ texto: respuesta, riesgo: riesgo.nivel });
  }

  const hoy = fechaValida(cuerpo.fecha) ?? hoyUtc();

  const [perfil, plan, historial, registro] = await Promise.all([
    leerPerfil(usuario.id),
    planActual(usuario.id),
    ultimosMensajes(usuario.id, 10),
    ultimoRegistro(usuario.id),
  ]);

  if (!perfil) return malaPeticion('todavía no hay perfil para este usuario');

  const dia = plan?.plan?.dias?.find((d) => d.dia === diaDeLaSemana(hoy));

  // La nota del detector va pegada al FINAL de la instrucción, que es lo
  // último que lee el modelo y lo que más le pesa. Hoy solo la escribe el
  // desánimo: la persona necesita que la validen, no que le pidan nada.
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
  }) + notaDeRiesgo(riesgo.nivel);

  let respuesta;
  try {
    respuesta = await generar({
      instruccion,
      // El mensaje nuevo va al final del historial, no dentro de la instrucción:
      // así el modelo no puede confundir el texto del usuario con sus reglas.
      historial: [...historial, { rol: 'user', texto }],
      temperatura: 0.7,
      timeoutMs: 20000,
      log: context,
    });
  } catch (e) {
    context.error(`fallo del coach: ${e.message}`);
    return falloIA();
  }

  await guardarVuelta(usuario.id, texto, respuesta, context);

  return ok({ texto: respuesta, riesgo: riesgo.nivel });
}

app.http('coach', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: manejar,
});
