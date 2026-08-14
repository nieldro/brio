const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';
const LOTE = 100; // el máximo que acepta Expo por petición

// Envío a Expo Push. Gratis y sin SDK: es una petición HTTP.
// Devuelve la lista de tokens que Expo marcó como muertos, para limpiarlos.
export async function enviarPush(mensajes, log = console) {
  const invalidos = [];
  if (!mensajes.length) return invalidos;

  for (let i = 0; i < mensajes.length; i += LOTE) {
    const lote = mensajes.slice(i, i + LOTE);

    try {
      const respuesta = await fetch(EXPO_PUSH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(lote),
      });

      if (!respuesta.ok) {
        log.error?.(`Expo Push respondió ${respuesta.status}`);
        continue;
      }

      const { data } = await respuesta.json();

      (data ?? []).forEach((recibo, j) => {
        if (recibo?.status !== 'error') return;
        log.warn?.(`push rechazado: ${recibo.message}`);
        // El token dejó de servir: la app se desinstaló o se reinstaló.
        if (recibo?.details?.error === 'DeviceNotRegistered') {
          invalidos.push(lote[j].to);
        }
      });
    } catch (e) {
      log.error?.(`fallo al enviar push: ${e.message}`);
    }
  }

  return invalidos;
}
