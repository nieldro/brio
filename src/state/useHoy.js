import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { claveDia } from '../services/fecha';

// La fecha de hoy, viva.
//
// Antes cada pantalla hacía `useMemo(() => new Date(), [])`, que se calcula una
// sola vez. Como Hoy vive dentro de las pestañas y nunca se desmonta, la app
// se quedaba en el día de ayer: el encabezado, el reto del plan y, lo peor,
// `completadoHoy` seguía en true y el botón "Listo por hoy" no hacía nada.
// El usuario perdía el día sin entender por qué.
//
// Se revisa por dos vías porque ninguna alcanza sola:
//   - volver a la app desde el segundo plano (el caso normal)
//   - un reloj, para quien la deja abierta y cruza la medianoche
export function useHoy() {
  const [fecha, setFecha] = useState(() => new Date());

  useEffect(() => {
    // Devuelve el MISMO objeto si el día no cambió: así los useMemo que
    // dependen de esta fecha no se recalculan sesenta veces por hora.
    const revisar = () =>
      setFecha((anterior) => (claveDia(anterior) === claveDia(new Date()) ? anterior : new Date()));

    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') revisar();
    });

    const reloj = setInterval(revisar, 60_000);

    return () => {
      suscripcion.remove();
      clearInterval(reloj);
    };
  }, []);

  return fecha;
}
