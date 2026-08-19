import { subCelebracion } from './racha.js';
import { celebrarRegreso } from './regresos.js';
import { textoDeHito } from './recorrido.js';
import { debeCelebrar } from './acompanamiento.js';

// Qué se celebra al cerrar el día. Puro, para poder probarlo.
//
// EL PROBLEMA
// Celebrar lo mismo todos los días le quita el valor a la celebración. Al
// tercer mes, una pantalla completa por marcar un martes cualquiera ya no
// emociona: interrumpe.
//
// EL ORDEN
// De lo más raro a lo más común. Solo lo primero que aplique se muestra:
// dos pantallas seguidas se sienten a premio de feria.
//
//   1. Una insignia recién ganada. Lo que más costó.
//   2. Volver después de haber parado. Lo difícil de verdad.
//   3. Un hito redondo de días.
//   4. Un día normal, y SOLO si Brío todavía está cerca.
//
// Los tres primeros se celebran siempre, esté Brío donde esté. El cuarto es
// el que se apaga con el tiempo, y ese apagarse es el punto: la app deja de
// necesitar aplaudirte para que sigas.

export function queCelebrar({
  nuevasInsignias = [],
  esRegreso = false,
  regresos = 0,
  diasSinVolver = null,
  hito = null,
  distancia = 'cerca',
  racha = 0,
} = {}) {
  if (nuevasInsignias.length) {
    const [ins] = nuevasInsignias;
    return { motivo: 'insignia', titulo: ins.titulo, sub: ins.texto };
  }

  if (esRegreso) {
    const texto = celebrarRegreso(regresos, diasSinVolver);
    return { motivo: 'regreso', ...texto };
  }

  if (hito) {
    return { motivo: 'hito', ...textoDeHito(hito) };
  }

  if (debeCelebrar(distancia, {})) {
    return { motivo: 'dia', titulo: 'Hecho.', sub: subCelebracion(racha) };
  }

  // Silencio a propósito. El día se marca igual; lo que no hay es fanfarria.
  return null;
}
