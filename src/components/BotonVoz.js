import { useEffect, useState } from 'react';
import { Text, Pressable } from 'react-native';

import { useEstilos } from '../state/TemaContext';
import { decir, callar, hayVoz } from '../lib/voz';

const crear = ({ C, T, R, S }) => ({
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: S.sm,
    borderRadius: R.pildora,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingVertical: S.sm,
    paddingHorizontal: S.lg,
  },
  hablando: {
    borderColor: C.coral,
    backgroundColor: C.coralSuave,
  },
  texto: {
    ...T.secundario,
    fontWeight: '700',
    color: C.gris,
  },
  textoHablando: {
    color: C.coralTexto,
  },
});

// Escuchar en vez de leer.
//
// Mientras alguien sostiene una plancha no puede mirar el teléfono. Este
// botón es lo que convierte la guía en algo usable DURANTE el ejercicio y no
// solo antes.
export default function BotonVoz({ texto, etiqueta = 'Escuchar' }) {
  const est = useEstilos(crear);
  const [hablando, setHablando] = useState(false);

  // Salir de la pantalla con la voz sonando dejaría a Brío hablándole a nadie.
  useEffect(() => () => callar(), []);

  if (!hayVoz()) return null;

  const alternar = async () => {
    if (hablando) {
      callar();
      setHablando(false);
      return;
    }
    setHablando(true);
    const sono = await decir(texto, { alTerminar: () => setHablando(false) });
    if (!sono) setHablando(false);
  };

  return (
    <Pressable
      onPress={alternar}
      accessibilityRole="button"
      accessibilityLabel={hablando ? 'Parar la voz' : etiqueta}
      hitSlop={8}
      style={[est.boton, hablando && est.hablando]}
    >
      <Text style={[est.texto, hablando && est.textoHablando]}>
        {hablando ? '■  Parar' : `▶  ${etiqueta}`}
      </Text>
    </Pressable>
  );
}
