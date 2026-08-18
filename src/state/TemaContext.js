import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { PALETAS, RELLENOS, S, R, F, semaforoDe, tipografiaDe, sombraDe } from '../theme';
import { cargarTema, guardarTema } from '../lib/almacenamiento';

// Tema activo de la app.
//
// El problema que resuelve: `StyleSheet.create` a nivel de módulo congela los
// colores al importar el archivo, así que un tema no puede cambiar en caliente.
// Aquí los estilos se construyen dentro del componente, memorizados por tema.

export const PREFERENCIAS = ['sistema', 'claro', 'oscuro'];

export const NOMBRES_PREFERENCIA = {
  sistema: 'Como el teléfono',
  claro: 'Claro',
  oscuro: 'Oscuro',
};

const TemaContext = createContext(null);

export function TemaProvider({ children }) {
  const delSistema = useColorScheme(); // 'light' | 'dark' | null
  const [preferencia, setPreferencia] = useState('sistema');
  const [leido, setLeido] = useState(false);

  useEffect(() => {
    let vivo = true;
    cargarTema().then((guardada) => {
      if (!vivo) return;
      if (PREFERENCIAS.includes(guardada)) setPreferencia(guardada);
      setLeido(true);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const cambiarPreferencia = useCallback((nueva) => {
    if (!PREFERENCIAS.includes(nueva)) return;
    setPreferencia(nueva);
    guardarTema(nueva);
  }, []);

  const valor = useMemo(() => {
    const modo =
      preferencia === 'sistema' ? (delSistema === 'dark' ? 'oscuro' : 'claro') : preferencia;

    const C = PALETAS[modo];

    return {
      modo,
      esOscuro: modo === 'oscuro',
      preferencia,
      cambiarPreferencia,
      temaLeido: leido,
      C,
      T: tipografiaDe(C),
      SEMAFORO: semaforoDe(C),
      RELLENO: RELLENOS[modo],
      SOMBRA: sombraDe(modo),
      S,
      R,
      F,
    };
  }, [preferencia, delSistema, cambiarPreferencia, leido]);

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema debe usarse dentro de TemaProvider');
  return ctx;
}

// Construye los estilos del componente a partir del tema activo.
//
// La fábrica DEBE declararse a nivel de módulo, nunca dentro del componente:
// si cambia de identidad en cada render, el memo no sirve de nada.
//
//   const crear = ({ C, T, S, R }) => ({ caja: { backgroundColor: C.blanco } });
//   export default function Algo() {
//     const est = useEstilos(crear);
//   }
export function useEstilos(fabrica) {
  const tema = useTema();
  return useMemo(() => StyleSheet.create(fabrica(tema)), [tema, fabrica]);
}
