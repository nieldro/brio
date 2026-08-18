import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { completarDia, estaCompletado, rachaVigente, rachaRota } from '../services/racha';
import { claveDia } from '../services/fecha';
import { reducer, estadoInicial, persistible } from './usuarioReducer';
import { useHoy } from './useHoy';
import {
  cargar,
  guardarLocal,
  guardarPerfil,
  marcarRegistro,
  guardarLogro as subirLogro,
} from '../lib/repositorio';
import { estadoDeSesion, salir as salirDeLaCuenta } from '../lib/auth';

// Única fuente de verdad de la app.
// La máquina de estado vive en usuarioReducer.js (pura, con pruebas).
// Aquí solo se manejan los efectos: leer, guardar y sincronizar.

const UsuarioContext = createContext(null);

export function UsuarioProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);

  // Cambia sola al cruzar la medianoche o al volver del segundo plano.
  // Sin esto, `completadoHoy` se quedaba en el día del arranque.
  const hoy = useHoy();

  // Trae disco, nube y estado de sesión. Se usa al abrir y cada vez que
  // alguien entra o crea cuenta: ahí los datos cambian de dueño.
  const hidratar = useCallback(async () => {
    const [datos, sesion] = await Promise.all([cargar(), estadoDeSesion()]);
    dispatch({ tipo: 'HIDRATAR', datos });
    dispatch({ tipo: 'SESION', tipoSesion: sesion.tipo, correo: sesion.correo });
  }, []);

  // Leer una sola vez, al abrir.
  useEffect(() => {
    let vivo = true;
    hidratar().catch(() => {
      // Sin datos la app arranca igual, en modo local.
      if (vivo) dispatch({ tipo: 'HIDRATAR', datos: null });
    });
    return () => {
      vivo = false;
    };
  }, [hidratar]);

  // Guardar en disco en cada cambio, nunca antes de haber leído
  // (guardar antes borraría lo que ya estaba).
  useEffect(() => {
    if (!estado.hidratado) return;
    guardarLocal(persistible(estado));
  }, [estado]);

  const valor = useMemo(() => {
    return {
      ...estado,
      hoy,
      // Atajo para la UI: solo quien está anónimo necesita que le ofrezcan
      // guardar la cuenta.
      puedeGuardarCuenta: estado.sesion === 'anonimo',
      // Derivados: las pantallas no recalculan reglas de racha.
      completadoHoy: estaCompletado(estado, hoy),
      racha: rachaVigente(estado, hoy),
      rota: rachaRota(estado, hoy),

      // El plan llega desde el paso 10 del onboarding; puede venir vacío si
      // la IA no respondió, y ahí las pantallas usan el plan de arranque.
      terminarOnboarding: (perfil, plan) => {
        dispatch({ tipo: 'TERMINAR_ONBOARDING', perfil, plan });
        guardarPerfil(estado.userId, perfil);
      },

      guardarPlan: (plan) => dispatch({ tipo: 'GUARDAR_PLAN', plan }),

      // Devuelve promesa a propósito: el onboarding necesita que el perfil
      // esté en Supabase ANTES de pedirle el plan a la Azure Function,
      // porque la función lo lee de la base.
      actualizarPerfil: async (cambios) => {
        dispatch({ tipo: 'ACTUALIZAR_PERFIL', cambios });
        await guardarPerfil(estado.userId, { ...estado.perfil, ...cambios });
      },

      // `reto` va al registro para que el Progreso pueda mostrar qué se hizo.
      // La fecha se pasa explícita para que marcar a las 23:59 y el registro
      // que se guarda hablen del mismo día.
      marcarDiaCompletado: (reto) => {
        const siguiente = completarDia(estado, hoy);
        if (siguiente === estado) return; // ya estaba marcado hoy
        dispatch({ tipo: 'COMPLETAR_DIA', hoy });
        marcarRegistro(estado.userId, {
          fecha: siguiente.ultimoDiaCompletado,
          reto: reto ?? null,
          rachaActual: siguiente.rachaActual,
          mejorRacha: siguiente.mejorRacha,
        });
      },

      guardarLogro: (texto) => {
        dispatch({ tipo: 'GUARDAR_LOGRO', texto, hoy });
        subirLogro(estado.userId, { fecha: claveDia(hoy), texto });
      },

      // Después de entrar o de crear cuenta: los datos cambiaron de dueño,
      // hay que volver a traerlos enteros.
      refrescarSesion: async () => {
        dispatch({ tipo: 'REHIDRATAR' });
        await hidratar();
      },

      // "Cerrar sesión" del Perfil. Con cuenta, los datos siguen en la nube
      // y vuelven al entrar; lo que se borra es la copia de este teléfono.
      reiniciar: async () => {
        await salirDeLaCuenta();
        dispatch({ tipo: 'REHIDRATAR' });
        await hidratar();
      },
    };
  }, [estado, hidratar, hoy]);

  return <UsuarioContext.Provider value={valor}>{children}</UsuarioContext.Provider>;
}

export function useUsuario() {
  const ctx = useContext(UsuarioContext);
  if (!ctx) throw new Error('useUsuario debe usarse dentro de UsuarioProvider');
  return ctx;
}
