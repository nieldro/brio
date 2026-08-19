import { useCallback, useMemo } from 'react';

import { useUsuario } from './UsuarioContext';
import { useCelebracion } from './CelebracionContext';
import { textoHecho } from '../services/racha';
import { claveDia } from '../services/fecha';
import { hoySeriaRegreso, contarRegresos, contarRegresosLargos, diasSinVolver } from '../services/regresos';
import { totales, semanasEnteras, hitoAlcanzado, semanasConMovimiento } from '../services/recorrido';
import { reciénGanadas } from '../services/insignias';
import { nivelDeAcompanamiento } from '../services/acompanamiento';
import { queCelebrar } from '../services/celebracion';

// Cerrar el día: una sola vez, en un solo sitio.
//
// Antes esto vivía dentro de Hoy, así que desde la rutina no había forma de
// terminar el día: la persona tachaba sus cinco ejercicios y tenía que volver
// atrás a buscar el botón. Ahora las dos pantallas usan esto y hacen lo mismo,
// que además evita que una celebre distinto que la otra.
//
// QUÉ SE CELEBRA Y CUÁNDO
// No todo merece pantalla completa, y celebrar lo mismo todos los días le
// quita el valor a la celebración. Hay un orden de importancia:
//
//   1. Una insignia recién ganada. Es lo más raro y lo que más costó.
//   2. Volver después de haber parado. Lo difícil de verdad.
//   3. Un hito redondo de días.
//   4. Un día normal, y solo si Brío todavía está cerca.
//
// El cuarto caso es el que se apaga con el tiempo: a los tres meses, marcar
// un martes cualquiera ya no necesita fuegos artificiales. Los tres primeros
// se celebran siempre, esté Brío donde esté.
export function useMarcarDia() {
  const {
    hoy,
    racha,
    completadoHoy,
    diasCompletados,
    marcarDiaCompletado,
    habitosHechos,
    diario,
    mejorRacha,
    rutinasCompletas,
  } = useUsuario();
  const { celebrar } = useCelebracion();

  const esRegreso = useMemo(
    () => hoySeriaRegreso({ diasCompletados }, hoy),
    [diasCompletados, hoy],
  );

  // Los datos de las insignias con y sin el día de hoy, para saber si marcar
  // hoy hace ganar alguna. Se calcula a mano porque el estado todavía no se
  // ha actualizado cuando hay que decidir qué mostrar.
  const datosDe = useCallback(
    (dias) => {
      const t = totales({ diasCompletados: dias, habitosHechos, diario });
      return {
        dias: t.dias,
        semanas: t.semanas,
        semanasEnteras: semanasEnteras(dias),
        rutinas: rutinasCompletas ?? 0,
        habitos: t.habitos,
        lineas: t.lineas,
        regresos: contarRegresos(dias),
        regresosLargos: contarRegresosLargos(dias),
        mejorRacha: Math.max(mejorRacha ?? 0, racha + 1),
      };
    },
    [habitosHechos, diario, rutinasCompletas, mejorRacha, racha],
  );

  const marcar = useCallback(
    (reto) => {
      if (completadoHoy) return false;

      const antes = diasCompletados;
      const despues = [...new Set([...diasCompletados, claveDia(hoy)])];

      const nuevas = reciénGanadas(datosDe(antes), datosDe(despues));
      const hito = hitoAlcanzado(new Set(despues).size);

      const distancia = nivelDeAcompanamiento(
        { semanas: semanasConMovimiento(despues), diasCompletados: despues },
        hoy,
      );

      // La decisión vive en services/celebracion.js, pura y probada. Aquí
      // solo se juntan los datos y se dispara el efecto.
      const felicitacion = queCelebrar({
        nuevasInsignias: nuevas,
        esRegreso,
        regresos: contarRegresos(diasCompletados) + 1,
        diasSinVolver: diasSinVolver(diasCompletados, hoy),
        hito,
        distancia,
        racha: racha + 1,
      });

      marcarDiaCompletado(reto);
      if (felicitacion) celebrar(felicitacion);
      return true;
    },
    [
      completadoHoy,
      diasCompletados,
      hoy,
      datosDe,
      esRegreso,
      racha,
      marcarDiaCompletado,
      celebrar,
    ],
  );

  return {
    marcar,
    completadoHoy,
    racha,
    // El texto del botón, igual en las dos pantallas.
    texto: completadoHoy ? textoHecho(racha) : 'Listo por hoy',
  };
}
