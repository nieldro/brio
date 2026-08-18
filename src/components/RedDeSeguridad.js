import { Component } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { PALETAS } from '../theme';

// Lo último que queda entre un error de render y una pantalla en blanco.
//
// Tiene que ser una clase: React solo ofrece componentDidCatch así. Y por eso
// mismo no puede usar useTema(), que es un hook. Los colores se eligen con el
// modo que le pasan por prop, resuelto arriba.
//
// La voz importa especialmente aquí: alguien que ya se critica duro no
// necesita ver "Error fatal" ni un volcado de pila. Necesita saber que no
// hizo nada mal y que puede seguir.

export default class RedDeSeguridad extends Component {
  constructor(props) {
    super(props);
    this.state = { rota: false };
  }

  static getDerivedStateFromError() {
    return { rota: true };
  }

  componentDidCatch(error, info) {
    // Queda en la consola de Metro y en el log del dispositivo. No se le
    // muestra al usuario: no le sirve y lo asusta.
    console.error('Brío se rompió al pintar:', error, info?.componentStack);
  }

  reintentar = () => this.setState({ rota: false });

  render() {
    if (!this.state.rota) return this.props.children;

    const C = PALETAS[this.props.modo === 'oscuro' ? 'oscuro' : 'claro'];

    return (
      <View style={[estilos.fondo, { backgroundColor: C.crema }]}>
        <Text style={[estilos.chispa, { color: C.coral }]}>✦</Text>
        <Text style={[estilos.titulo, { color: C.cafe }]}>Algo se me enredó.</Text>
        <Text style={[estilos.sub, { color: C.gris }]}>
          No fue nada que hicieras. Toca abajo y seguimos.
        </Text>

        <Pressable
          onPress={this.reintentar}
          accessibilityRole="button"
          style={({ pressed }) => [
            estilos.boton,
            { backgroundColor: C.coral },
            pressed && estilos.presionado,
          ]}
        >
          <Text style={estilos.botonTexto}>Volver a intentar</Text>
        </Pressable>
      </View>
    );
  }
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  chispa: {
    fontSize: 48,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  boton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  presionado: {
    opacity: 0.85,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
