// Reglas de los recordatorios. Puras y sin red: se prueban solas.
//
// Regla dura del producto: máximo 2 notificaciones al día, a la hora que el
// usuario eligió. `hora_recordatorio` es hora LOCAL y el servidor vive en UTC,
// así que todo pasa por la zona horaria del perfil.

export const MAXIMO_DIARIO = 2;
export const ZONA_POR_DEFECTO = 'America/Bogota';

export function horaLocal(ahora, zona) {
  let usada = zona || ZONA_POR_DEFECTO;
  let partes;

  try {
    partes = formatear(ahora, usada);
  } catch {
    // Zona inválida guardada en el perfil: no puede tumbar el envío de todos.
    usada = ZONA_POR_DEFECTO;
    partes = formatear(ahora, usada);
  }

  return {
    zona: usada,
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    hora: Number(partes.hour) % 24, // algunas versiones de ICU dicen 24 a medianoche
    minuto: Number(partes.minute),
  };
}

function formatear(ahora, zona) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return Object.fromEntries(fmt.formatToParts(ahora).map((p) => [p.type, p.value]));
}

// El cuarto de hora al que pertenece un minuto: 0, 15, 30 o 45.
//
// El Timer corre en esos cuatro momentos, así que comparar el cubo y no el
// minuto exacto tolera que arranque unos segundos tarde.
const cuarto = (minuto) => Math.floor(minuto / 15) * 15;

// La hora Y los minutos que la persona eligió.
//
// Antes solo se miraba la hora, con `slice(0, 2)`. El selector ofrece :00,
// :15, :30 y :45 y la pantalla dice por escrito "Te escribo a las 07:45",
// pero el aviso salía a las 07:00: cuarenta y cinco minutos antes de lo
// prometido, y sin ninguna corrida después que lo entregara a tiempo.
//
// Comparar los minutos sirve además para las zonas con desfase de media hora
// o de tres cuartos (India, Nepal, Chatham), donde la hora local nunca cae
// en punto.
export function debeEnviarse(perfil, ahora) {
  if (!perfil?.push_token) return false;
  if (!perfil.hora_recordatorio) return false;

  const [hh, mm] = String(perfil.hora_recordatorio).split(':');
  const elegida = Number(hh);
  const minutoElegido = Number(mm);
  if (!Number.isFinite(elegida) || !Number.isFinite(minutoElegido)) return false;

  const local = horaLocal(ahora, perfil.zona_horaria);
  if (local.hora !== elegida) return false;
  if (cuarto(local.minuto) !== cuarto(minutoElegido)) return false;

  // Tope diario. Se cuenta por el día LOCAL del usuario, no por el del servidor.
  if (
    perfil.recordatorios_fecha === local.fecha &&
    (perfil.recordatorios_enviados ?? 0) >= MAXIMO_DIARIO
  ) {
    return false;
  }

  return true;
}

// Devuelve null cuando no hay nada que decir. Un recordatorio de más
// molesta más de lo que ayuda, y quien ya cumplió no necesita que le insistan.
export function textoRecordatorio({ nombre, dia, completadoHoy }) {
  if (completadoHoy) return null;

  const quien = nombre?.trim() ? `${nombre.trim()}, ` : '';

  if (!dia) {
    return {
      titulo: `${quien}aquí sigo`,
      cuerpo: 'Cuando quieras abrimos tu plan y arrancamos suave.',
    };
  }

  if (dia.tipo === 'descanso') {
    return {
      titulo: `${quien}hoy descansas`,
      cuerpo: 'Descansar también es parte del plan.',
    };
  }

  const minutos = dia.duracion_min > 0 ? `Son ${dia.duracion_min} minutos y ya.` : 'Es cortito.';

  return {
    titulo: `${quien}hoy toca ${dia.reto}`,
    cuerpo: minutos,
  };
}
