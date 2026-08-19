import { claveDia, diasEntreClaves, sumarDias, fechaLargaDeClave } from './fecha.js';

// El álbum de Brío: una foto al día, de cintura para arriba, y a los seis
// meses una película con todas.
//
// Este archivo es solo la regla. No toca disco, no toca cámara: por eso se
// puede probar entero (lib/album.js hace los efectos).
//
// Tres decisiones que NO son técnicas y que sostienen el resto:
//
//   1. Las fotos nunca salen del teléfono. No hay subida, no hay copia en la
//      nube y la IA jamás las ve. Es lo único honesto para pedirle a alguien
//      una foto suya todos los días.
//   2. No hay racha de fotos ni recordatorio que reclame. Saltarse un día no
//      cuesta nada, porque el día que empiece a costar esto se vuelve otra
//      báscula.
//   3. No se muestran dos fotos lado a lado. Comparar el "antes" con el "hoy"
//      todos los días es exactamente el bucle que el documento prohíbe. El
//      movimiento se ve entero, en la película, y de tarde en tarde.

export const DIAS_DEL_CICLO = 182; // medio año
export const MINIMO_CUADROS = 4; // menos que esto no es una película, es un parpadeo
export const MAXIMO_CUADROS = 120; // 180 fotos en un año no caben en 20 segundos
export const MS_POR_CUADRO = 260;

export const nombreDeFoto = (clave) => `${clave}.jpg`;

// Solo se reconocen los archivos con forma de fecha. Cualquier otra cosa que
// aparezca en la carpeta se ignora en vez de romper el álbum.
export function claveDeNombre(nombre) {
  const m = /^(\d{4}-\d{2}-\d{2})\.jpg$/.exec(String(nombre ?? ''));
  return m ? m[1] : null;
}

export function ordenar(fotos = []) {
  return [...fotos].sort((a, b) => (a.clave < b.clave ? -1 : a.clave > b.clave ? 1 : 0));
}

export const hayFotoDe = (fotos = [], clave) => fotos.some((f) => f.clave === clave);

// Cuadros de la película. Con 300 fotos no se muestran 300: se reparten a lo
// largo de todo el periodo, y la primera y la última siempre entran (son las
// que la persona quiere ver).
export function seleccionarCuadros(fotos = [], max = MAXIMO_CUADROS) {
  const orden = ordenar(fotos);
  if (max < 2 || orden.length <= max) return orden;

  const salida = [];
  for (let i = 0; i < max; i += 1) {
    salida.push(orden[Math.round((i * (orden.length - 1)) / (max - 1))]);
  }
  return [...new Set(salida)];
}

export const duracionSegundos = (cuadros = []) =>
  Math.round((cuadros.length * MS_POR_CUADRO) / 1000);

// Los ciclos de medio año se cuentan desde la PRIMERA foto, no desde enero ni
// desde el día que se instaló la app: el medio año es de la persona.
export function ciclos(fotos = [], hoy = new Date()) {
  const orden = ordenar(fotos);
  if (!orden.length) return [];

  const primera = orden[0].clave;
  const hoyClave = claveDia(hoy);
  const grupos = new Map();

  for (const foto of orden) {
    const n = Math.floor(diasEntreClaves(primera, foto.clave) / DIAS_DEL_CICLO);
    if (!grupos.has(n)) grupos.set(n, []);
    grupos.get(n).push(foto);
  }

  return [...grupos.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, suyas]) => {
      const cierra = sumarDias(primera, (n + 1) * DIAS_DEL_CICLO);
      return {
        n,
        desde: sumarDias(primera, n * DIAS_DEL_CICLO),
        cierra,
        fotos: suyas,
        cerrado: diasEntreClaves(hoyClave, cierra) <= 0,
        suficientes: suyas.length >= MINIMO_CUADROS,
      };
    });
}

// Cuántos días faltan para que se cierre el medio año en curso.
// null cuando todavía no hay ninguna foto.
export function diasParaElCierre(fotos = [], hoy = new Date()) {
  const abierto = ciclos(fotos, hoy).find((c) => !c.cerrado);
  return abierto ? diasEntreClaves(claveDia(hoy), abierto.cierra) : null;
}

export function estadoDelAlbum(fotos = [], hoy = new Date()) {
  const orden = ordenar(fotos);
  const lista = ciclos(orden, hoy);
  const abierto = lista.find((c) => !c.cerrado) ?? null;

  return {
    total: orden.length,
    tieneHoy: hayFotoDe(orden, claveDia(hoy)),
    ultima: orden[orden.length - 1] ?? null,
    // La película se puede ver desde la cuarta foto. El medio año no es un
    // candado: es la fecha en que Brío la celebra.
    puedeVerPelicula: orden.length >= MINIMO_CUADROS,
    faltanFotos: Math.max(0, MINIMO_CUADROS - orden.length),
    faltanDias: abierto ? diasEntreClaves(claveDia(hoy), abierto.cierra) : null,
    cierraEl: abierto?.cierra ?? null,
    mediosAnos: lista.filter((c) => c.cerrado && c.suficientes).length,
  };
}

// Qué dice Brío en el álbum. Nunca cuenta los días que faltaron, nunca nombra
// el cuerpo y nunca pide una foto dos veces.
export function textoDelAlbum(estado) {
  if (estado.total === 0) {
    return 'Aquí va tu primera foto. No sale de este teléfono, ni yo la veo.';
  }

  if (estado.mediosAnos > 0 && estado.tieneHoy) {
    return 'Tu medio año ya está armado. Cuando quieras lo vemos.';
  }

  if (estado.faltanFotos > 0) {
    return estado.total === 1
      ? 'Una foto. Con tres más ya se ve el movimiento.'
      : `${estado.total} fotos. Con ${estado.faltanFotos} más ya se ve el movimiento.`;
  }

  if (estado.faltanDias != null && estado.faltanDias <= 7) {
    return `${estado.total} fotos. Tu medio año se cierra esta semana.`;
  }

  return estado.cierraEl
    ? `${estado.total} fotos. Tu medio año se cierra el ${fechaLargaDeClave(estado.cierraEl)}.`
    : `${estado.total} fotos guardadas.`;
}

// El pie de la película. Habla del tiempo, jamás del resultado: prometer un
// cambio visible en seis meses es exactamente lo que el documento prohíbe.
export function textoDeLaPelicula(cuadros = []) {
  if (cuadros.length < MINIMO_CUADROS) return 'Todavía no hay suficientes fotos.';

  const dias = diasEntreClaves(cuadros[0].clave, cuadros[cuadros.length - 1].clave) + 1;
  if (dias < 30) return `${dias} días, uno detrás de otro.`;

  const meses = Math.round(dias / 30);
  return meses === 1 ? 'Un mes de aparecer.' : `${meses} meses de aparecer.`;
}
