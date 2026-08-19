import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useUsuario } from './UsuarioContext';
import { listarFotos } from '../lib/album';
import { estadoDelAlbum } from '../services/album';

// El álbum no vive en el estado global a propósito.
//
// Las fotos son archivos en disco, no datos que se sincronicen: meterlas en
// el reducer obligaría a mantener una copia en memoria y a persistirla, y lo
// único que hace falta es saber cuántas hay y cuál fue la última. La carpeta
// se relee al entrar a la pantalla, que es cuando pudo cambiar.
export function useAlbum() {
  const { userId, hoy } = useUsuario();
  const [fotos, setFotos] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      listarFotos(userId).then((lista) => {
        if (vivo) setFotos(lista);
      });
      return () => {
        vivo = false;
      };
    }, [userId]),
  );

  const estado = useMemo(() => estadoDelAlbum(fotos, hoy), [fotos, hoy]);

  return { fotos, estado, setFotos };
}
