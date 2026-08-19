import { claveDia } from '../services/fecha';
import { nombreDeFoto, claveDeNombre, ordenar } from '../services/album';
import { encoger, ANCHO_ALBUM } from './imagen';

// Efectos del álbum: disco y cámara. La regla vive en services/album.js.
//
// Las fotos se guardan en la carpeta privada de la app, la que solo esta app
// puede leer y que se va con la app cuando se desinstala. NO van a la galería
// del teléfono: nadie que preste el celular para ver una foto se topa con
// estas de paso.
//
// La carpeta lleva dentro el id del dueño. Dos personas que entren en el
// mismo teléfono no ven las fotos de la otra, y quien cierra sesión y vuelve
// encuentra las suyas donde las dejó. Borrarlas al salir era la otra opción
// y significaba perder medio año por tocar un botón.

const RAIZ = 'brio-album';

// Igual que con las notificaciones: importar el módulo arriba tumbaba la app
// entera en Expo Go cuando el módulo no estaba disponible, y sin decir por qué.
// Se pide en el momento de usarlo.
let FS = null;
function fs() {
  if (!FS) FS = require('expo-file-system');
  return FS;
}

const carpetaDe = (duenoId) => {
  const { Directory, Paths } = fs();
  const dir = new Directory(Paths.document, RAIZ, duenoId || 'local');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
};

// Devuelve [{ clave, uri, bytes }] ordenado por fecha.
export async function listarFotos(duenoId) {
  try {
    const dir = carpetaDe(duenoId);
    const fotos = dir
      .list()
      .map((entrada) => {
        const clave = claveDeNombre(entrada.name);
        return clave ? { clave, uri: entrada.uri, bytes: entrada.size ?? 0 } : null;
      })
      .filter(Boolean);
    return ordenar(fotos);
  } catch {
    // Sin carpeta o sin permiso de disco: álbum vacío, nunca una pantalla rota.
    return [];
  }
}

// Guarda la foto del día. Repetirla el mismo día reemplaza la anterior:
// la clave es la fecha, así que un álbum nunca tiene dos del mismo día.
export async function guardarFoto(duenoId, uriTemporal, hoy = new Date()) {
  const { File } = fs();
  const clave = claveDia(hoy);

  const { uri: encogida } = await encoger(uriTemporal, { ancho: ANCHO_ALBUM });
  const origen = new File(encogida);
  const destino = new File(carpetaDe(duenoId), nombreDeFoto(clave));

  await origen.copy(destino, { overwrite: true });

  return { clave, uri: destino.uri, bytes: destino.size ?? 0 };
}

export async function borrarFoto(duenoId, clave) {
  try {
    const { File } = fs();
    const archivo = new File(carpetaDe(duenoId), nombreDeFoto(clave));
    if (archivo.exists) archivo.delete();
    return true;
  } catch {
    return false;
  }
}

// "Borrar mis fotos" del álbum. Es definitivo y no hay copia en ningún lado:
// la pantalla lo advierte antes de llamar aquí.
export async function borrarAlbum(duenoId) {
  try {
    const dir = carpetaDe(duenoId);
    for (const entrada of dir.list()) {
      if (claveDeNombre(entrada.name)) entrada.delete();
    }
    return true;
  } catch {
    return false;
  }
}
