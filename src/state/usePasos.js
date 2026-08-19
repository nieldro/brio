import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { estadoDelPodometro, pedirPermisoDePasos, seguirPasos } from '../lib/pasos';
import { lecturaDeHoy, explicacionDe } from '../services/movimiento';

// El podómetro, enchufado a una pantalla.
//
// lib/pasos.js habla con el sensor y services/movimiento.js decide qué se
// puede decir de lo que trae. Entre los dos faltaba esto: quién pide el
// permiso, quién se suscribe y quién corta la suscripción al salir. Sin ese
// pegamento los dos archivos eran código escrito y nunca ejecutado: como el
// permiso no lo pedía nadie, la lectura habría sido 'sin-permiso' para
// siempre y la tarjeta no habría aparecido jamás.
//
// QUÉ NO HACE ESTE HOOK
// No guarda nada. Los pasos no son una métrica de Brío (regla 11): se miran
// mientras la pantalla está abierta y se van con ella. Tampoco pide el
// permiso al montar: eso vive en `activar`, que llama la persona desde
// ajustes. Un diálogo de actividad en la cara al abrir la app se niega por
// reflejo, y un permiso negado no se vuelve a pedir.
export function usePasos() {
  // `{}` no es lo mismo que "no hay sensor": es "todavía no sé". Para la
  // tarjeta de Hoy da igual —en los dos casos no se pinta nada—, pero para
  // Ajustes NO: `explicacionDe` traducía ese hueco a "Tu teléfono no cuenta
  // pasos", que es una afirmación sobre el teléfono de la persona dicha antes
  // de haber mirado. Por eso hace falta saber si ya se preguntó.
  const [estado, setEstado] = useState({});
  const [mirado, setMirado] = useState(false);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  // Al entrar solo se MIRA si hay sensor y si el permiso ya estaba dado.
  useEffect(() => {
    let mirando = true;
    estadoDelPodometro().then((e) => {
      if (!mirando) return;
      setEstado(e);
      setMirado(true);
    });
    return () => {
      mirando = false;
    };
  }, []);

  // Sin permiso no hay a qué suscribirse. La limpieza que devuelve
  // `seguirPasos` se devuelve tal cual: es la que corta la suscripción al
  // salir de la pantalla, y sin ella el teléfono seguiría contando pasos con
  // la pantalla cerrada para alimentar un número que ni siquiera se guarda.
  useEffect(() => {
    if (!estado.disponible || !estado.permiso) return undefined;
    return seguirPasos(setEstado);
  }, [estado.disponible, estado.permiso]);

  // Se pide una vez y desde donde la persona lo pidió, nunca al abrir la app.
  const activar = useCallback(async () => {
    const dado = await pedirPermisoDePasos();
    const nuevo = await estadoDelPodometro();
    if (vivo.current) setEstado(nuevo);
    return dado;
  }, []);

  const lectura = useMemo(() => lecturaDeHoy(estado), [estado]);

  return {
    lectura,
    // Por qué no hay nada que mostrar. Solo sirve donde la persona preguntó,
    // en ajustes: en Hoy la tarjeta simplemente no aparece, porque explicar
    // una ausencia es hablar de lo que no hizo.
    //
    // Mientras no se haya mirado se devuelve null: mejor no decir nada que
    // decirle que su teléfono no sirve sin haberlo comprobado.
    explicacion: mirado ? explicacionDe(lectura.motivo) : null,
    mirado,
    disponible: !!estado.disponible,
    permiso: !!estado.permiso,
    activar,
  };
}
