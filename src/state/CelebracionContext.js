import { createContext, useCallback, useContext, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Celebracion from '../screens/Celebracion';

// La celebración vive por encima del navegador, no es una pestaña.
// Cualquier pantalla la dispara con useCelebracion().celebrar({ titulo, sub }).

const CelebracionContext = createContext({ celebrar: () => {} });

export function CelebracionProvider({ children }) {
  const [mensaje, setMensaje] = useState(null);

  const celebrar = useCallback((texto) => setMensaje(texto ?? {}), []);
  const cerrar = useCallback(() => setMensaje(null), []);

  return (
    <CelebracionContext.Provider value={{ celebrar }}>
      <View style={styles.raiz}>
        {children}
        {mensaje && <Celebracion mensaje={mensaje} onFin={cerrar} />}
      </View>
    </CelebracionContext.Provider>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
});

export function useCelebracion() {
  return useContext(CelebracionContext);
}
