import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';

import { C, S, R, T } from '../../theme';

const OTRO = '__otro__';

// --- Opción tocable, base de varios pasos ---------------------------------

function Opcion({ etiqueta, elegida, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: elegida }}
      style={({ pressed }) => [styles.opcion, elegida && styles.opcionElegida, pressed && styles.presionado]}
    >
      <Text style={[styles.opcionTexto, elegida && styles.opcionTextoElegida]}>{etiqueta}</Text>
    </Pressable>
  );
}

// --- Paso de opciones -----------------------------------------------------

export function ListaOpciones({ opciones, valor, onElegir, permiteOtro, otro, onOtro }) {
  const enOtro = valor === OTRO;

  return (
    <View style={styles.lista}>
      {opciones.map((o) => (
        <Opcion
          key={String(o.valor)}
          etiqueta={o.etiqueta}
          elegida={valor === o.valor}
          onPress={() => onElegir(o.valor)}
        />
      ))}

      {permiteOtro && (
        <>
          <Opcion etiqueta="Otro" elegida={enOtro} onPress={() => onElegir(OTRO)} />
          {enOtro && (
            <TextInput
              value={otro}
              onChangeText={onOtro}
              placeholder="Cuéntame en tus palabras"
              placeholderTextColor={C.apagado}
              style={styles.input}
              autoFocus
            />
          )}
        </>
      )}
    </View>
  );
}

ListaOpciones.OTRO = OTRO;

// --- Paso de campo único --------------------------------------------------

export function CampoUnico({ valor, onChange, placeholder }) {
  return (
    <TextInput
      value={valor}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={C.apagado}
      style={[styles.input, styles.inputGrande]}
      autoFocus
      autoCapitalize="words"
      returnKeyType="done"
    />
  );
}

// --- Paso de datos: edad, estatura, peso ----------------------------------

const CAMPOS = [
  { clave: 'edad', etiqueta: 'Edad', sufijo: 'años' },
  { clave: 'estatura', etiqueta: 'Estatura', sufijo: 'cm' },
  { clave: 'peso', etiqueta: 'Peso', sufijo: 'kg' },
];

export function CamposDatos({ datos, onChange }) {
  return (
    <View style={styles.lista}>
      {CAMPOS.map((c) => (
        <View key={c.clave}>
          <View style={styles.filaDato}>
            <Text style={styles.etiquetaDato}>{c.etiqueta}</Text>
            <TextInput
              value={datos[c.clave]}
              onChangeText={(t) => onChange(c.clave, t.replace(/[^0-9]/g, ''))}
              placeholder="—"
              placeholderTextColor={C.apagado}
              keyboardType="number-pad"
              maxLength={3}
              style={styles.inputDato}
            />
            <Text style={styles.sufijo}>{c.sufijo}</Text>
          </View>

          {/* Regla dura del producto: el peso nunca es un juicio. */}
          {c.clave === 'peso' && (
            <Text style={styles.nota}>Este número no te define. Solo me calibra.</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// --- Paso de hora ---------------------------------------------------------

const HORAS = Array.from({ length: 18 }, (_, i) => i + 5); // 5:00 a 22:00
const MINUTOS = ['00', '15', '30', '45'];

export function SelectorHora({ valor, onChange }) {
  const [horaActual = '', minutoActual = ''] = (valor || '').split(':');

  const elegir = (h, m) => onChange(`${String(h).padStart(2, '0')}:${m}`);

  return (
    <View style={styles.lista}>
      <Text style={styles.etiquetaHora}>Hora</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
        {HORAS.map((h) => {
          const texto = String(h).padStart(2, '0');
          const elegida = texto === horaActual;
          return (
            <Pressable
              key={h}
              onPress={() => elegir(h, minutoActual || '00')}
              style={[styles.chipHora, elegida && styles.chipHoraElegido]}
            >
              <Text style={[styles.chipHoraTexto, elegida && styles.chipHoraTextoElegido]}>{texto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.etiquetaHora}>Minutos</Text>
      <View style={styles.fila}>
        {MINUTOS.map((m) => {
          const elegido = m === minutoActual;
          return (
            <Pressable
              key={m}
              onPress={() => elegir(horaActual || '07', m)}
              style={[styles.chipHora, elegido && styles.chipHoraElegido]}
            >
              <Text style={[styles.chipHoraTexto, elegido && styles.chipHoraTextoElegido]}>{m}</Text>
            </Pressable>
          );
        })}
      </View>

      {!!valor && <Text style={styles.horaElegida}>Te escribo a las {valor}</Text>}
    </View>
  );
}

// --------------------------------------------------------------------------

const styles = StyleSheet.create({
  lista: {
    gap: S.md,
    marginTop: S.lg,
  },
  opcion: {
    backgroundColor: C.blanco,
    borderRadius: R.medio,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingVertical: S.lg,
    paddingHorizontal: S.lg,
  },
  opcionElegida: {
    borderColor: C.coral,
    backgroundColor: '#FDF0EC',
  },
  presionado: {
    opacity: 0.85,
  },
  opcionTexto: {
    ...T.cuerpo,
    fontWeight: '600',
  },
  opcionTextoElegida: {
    color: C.coral,
  },
  input: {
    ...T.cuerpo,
    backgroundColor: C.blanco,
    borderRadius: R.medio,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingHorizontal: S.lg,
    paddingVertical: S.lg,
  },
  inputGrande: {
    fontSize: 20,
  },
  filaDato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.blanco,
    borderRadius: R.medio,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  etiquetaDato: {
    ...T.cuerpo,
    flex: 1,
  },
  inputDato: {
    ...T.cuerpo,
    fontSize: 20,
    fontWeight: '700',
    minWidth: 58,
    textAlign: 'right',
    paddingVertical: S.sm,
  },
  sufijo: {
    ...T.secundario,
    width: 34,
  },
  nota: {
    ...T.secundario,
    marginTop: S.sm,
    marginLeft: S.xs,
  },
  etiquetaHora: {
    ...T.etiqueta,
    color: C.gris,
    marginTop: S.sm,
  },
  fila: {
    flexDirection: 'row',
    gap: S.sm,
    paddingVertical: S.xs,
  },
  chipHora: {
    backgroundColor: C.blanco,
    borderRadius: R.pildora,
    borderWidth: 1.5,
    borderColor: C.borde,
    paddingVertical: S.md,
    paddingHorizontal: S.lg,
    minWidth: 58,
    alignItems: 'center',
  },
  chipHoraElegido: {
    borderColor: C.coral,
    backgroundColor: C.coral,
  },
  chipHoraTexto: {
    ...T.cuerpo,
    fontWeight: '700',
  },
  chipHoraTextoElegido: {
    color: C.blanco,
  },
  horaElegida: {
    ...T.cuerpo,
    color: C.gris,
    marginTop: S.sm,
  },
});
