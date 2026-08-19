import { useCallback, useMemo } from 'react';

import { useUsuario } from './UsuarioContext';
import { useCelebracion } from './CelebracionContext';
import { subCelebracion, textoHecho } from '../services/racha';
import { hoySeriaRegreso, celebrarRegreso, contarRegresos, diasSinVolver } from '../services/regresos';

// Cerrar el día: una sola vez, en un solo sitio.
//
// Antes esto vivía dentro de Hoy, así que desde la rutina no había forma de
// terminar el día: la persona tachaba sus cinco ejercicios y tenía que volver
// atrás a buscar el botón. Ahora las dos pantallas usan esto y hacen lo mismo,
// que además evita que una celebre distinto que la otra.
export function useMarcarDia() {
  const { hoy, racha, completadoHoy, diasCompletados, marcarDiaCompletado } = useUsuario();
  const { celebrar } = useCelebracion();

  const esRegreso = useMemo(
    () => hoySeriaRegreso({ diasCompletados }, hoy),
    [diasCompletados, hoy],
  );

  const marcar = useCallback(
    (reto) => {
      if (completadoHoy) return false;

      // Volver se celebra distinto que seguir. Para quien paró, esto es lo
      // difícil, y es justo lo que ninguna app le ha reconocido nunca.
      const felicitacion = esRegreso
        ? celebrarRegreso(contarRegresos(diasCompletados) + 1, diasSinVolver(diasCompletados, hoy))
        : { titulo: 'Hecho.', sub: subCelebracion(racha + 1) };

      marcarDiaCompletado(reto);
      celebrar(felicitacion);
      return true;
    },
    [completadoHoy, esRegreso, diasCompletados, hoy, racha, marcarDiaCompletado, celebrar],
  );

  return {
    marcar,
    completadoHoy,
    racha,
    // El texto del botón, igual en las dos pantallas.
    texto: completadoHoy ? textoHecho(racha) : 'Listo por hoy',
  };
}
