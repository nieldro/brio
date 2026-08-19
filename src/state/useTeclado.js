import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Cuánto ocupa el teclado ahora mismo, en píxeles. 0 si está cerrado.
//
// Se hace a mano y no con KeyboardAvoidingView por una razón concreta: desde
// que Android dibuja de borde a borde, la ventana ya no se encoge al abrir el
// teclado, y `KeyboardAvoidingView` sin `behavior` en Android no hace nada.
// El resultado era que el campo de escribir del chat quedaba tapado justo
// cuando la persona iba a escribir.
//
// Escuchando el evento se sabe el alto real, y funciona igual en los dos
// sistemas.
export function useTeclado() {
  const [alto, setAlto] = useState(0);

  useEffect(() => {
    // En iOS conviene el evento "will": llega antes y la animación acompaña.
    // En Android solo existe el "did".
    const abre = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const cierra = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const alAbrir = Keyboard.addListener(abre, (e) => setAlto(e.endCoordinates?.height ?? 0));
    const alCerrar = Keyboard.addListener(cierra, () => setAlto(0));

    return () => {
      alAbrir.remove();
      alCerrar.remove();
    };
  }, []);

  return alto;
}
