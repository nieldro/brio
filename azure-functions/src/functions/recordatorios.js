import { app } from '@azure/functions';

import { ajustesFaltantes } from '../lib/config.js';
import { admin } from '../lib/supabase.js';
import { enviarPush } from '../lib/push.js';
import { debeEnviarse, textoRecordatorio, horaLocal } from '../lib/recordatorio.js';
import { diaDeLaSemana } from '../lib/fechas.js';

// Timer cada cuarto de hora. Formato NCRONTAB: segundo minuto hora día mes díaSemana.
//
// Corría solo en punto, y el selector deja elegir :00, :15, :30 y :45. Quien
// pedía las 07:45 recibía el aviso a las 07:00, y ninguna corrida posterior
// se lo entregaba a su hora. Cuatro corridas cubren los cuatro minutos que la
// app ofrece, y de paso las zonas con desfase de media hora o de tres cuartos.
const CADA_CUARTO = '0 0,15,30,45 * * * *';

// Recorre a quien pueda recibir push y le escribe solo si le toca ahora.
// La regla de "a quién y cuándo" vive en lib/recordatorio.js, no aquí.
async function manejar(_temporizador, context) {
  const faltan = ajustesFaltantes();
  if (faltan.length) {
    context.error(`recordatorios sin configurar: ${faltan.join(', ')}`);
    return;
  }

  const ahora = new Date();

  const { data: perfiles, error } = await admin()
    .from('profiles')
    .select(
      'id, nombre, push_token, hora_recordatorio, zona_horaria, recordatorios_fecha, recordatorios_enviados',
    )
    .not('push_token', 'is', null);

  if (error) {
    context.error(`no se pudieron leer los perfiles: ${error.message}`);
    return;
  }

  const candidatos = (perfiles ?? []).filter((p) => debeEnviarse(p, ahora));
  if (!candidatos.length) {
    context.log('ningún recordatorio para esta hora');
    return;
  }

  const mensajes = [];
  const enviadosA = [];

  for (const perfil of candidatos) {
    const local = horaLocal(ahora, perfil.zona_horaria);

    const [plan, registro] = await Promise.all([
      admin()
        .from('planes')
        .select('plan')
        .eq('user_id', perfil.id)
        .order('semana', { ascending: false })
        .limit(1),
      admin()
        .from('registros')
        .select('completado')
        .eq('user_id', perfil.id)
        .eq('fecha', local.fecha)
        .maybeSingle(),
    ]);

    const dia = plan.data?.[0]?.plan?.dias?.find((d) => d.dia === diaDeLaSemana(local.fecha));

    const texto = textoRecordatorio({
      nombre: perfil.nombre,
      dia,
      completadoHoy: !!registro.data?.completado,
    });

    // Quien ya cumplió hoy no recibe nada. Insistir molesta.
    if (!texto) continue;

    mensajes.push({
      to: perfil.push_token,
      title: texto.titulo,
      body: texto.cuerpo,
      channelId: 'brio',
      sound: null,
      priority: 'normal',
    });

    enviadosA.push({ perfil, local });
  }

  const invalidos = await enviarPush(mensajes, context);

  // Contador diario, en el día LOCAL de cada quien.
  await Promise.all(
    enviadosA
      .filter(({ perfil }) => !invalidos.includes(perfil.push_token))
      .map(({ perfil, local }) => {
        const mismoDia = perfil.recordatorios_fecha === local.fecha;
        return admin()
          .from('profiles')
          .update({
            recordatorios_fecha: local.fecha,
            recordatorios_enviados: mismoDia ? (perfil.recordatorios_enviados ?? 0) + 1 : 1,
          })
          .eq('id', perfil.id);
      }),
  );

  // Token muerto: la app se desinstaló. Se limpia para no reintentar siempre.
  if (invalidos.length) {
    await admin().from('profiles').update({ push_token: null }).in('push_token', invalidos);
    context.warn(`${invalidos.length} token(s) dados de baja`);
  }

  context.log(`recordatorios enviados: ${mensajes.length - invalidos.length}`);
}

app.timer('recordatorios', { schedule: CADA_CUARTO, handler: manejar });
