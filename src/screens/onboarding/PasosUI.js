import { View, Text, TextInput, Pressable } from 'react-native';

import { useEstilos, useTema } from '../../state/TemaContext';

const OTRO = '__otro__';

const crear = ({ C, T, R, S }) => ({
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
    backgroundColor: C.coralSuave,
  },
  presionado: {
    opacity: 0.85,
  },
  opcionTexto: {
    ...T.cuerpo,
    fontWeight: '600',
  },
  opcionTextoElegida: {
    color: C.coralTexto,
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
});

// --- Opción tocable, base de varios pasos ---------------------------------

function Opcion({ etiqueta, elegida, onPress, est }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: elegida }}
      style={({ pressed }) => [
        est.opcion,
        elegida && est.opcionElegida,
        pressed && est.presionado,
      ]}
    >
      <Text style={[est.opcionTexto, elegida && est.opcionTextoElegida]}>{etiqueta}</Text>
    </Pressable>
  );
}

// --- Paso de opciones -----------------------------------------------------

export function ListaOpciones({ opciones, valor, onElegir, permiteOtro, otro, onOtro }) {
  const est = useEstilos(crear);
  const { C } = useTema();
  const enOtro = valor === OTRO;

  return (
    <View style={est.lista}>
      {opciones.map((o) => (
        <Opcion
          key={String(o.valor)}
          etiqueta={o.etiqueta}
          elegida={valor === o.valor}
          onPress={() => onElegir(o.valor)}
          est={est}
        />
      ))}

      {permiteOtro && (
        <>
          <Opcion etiqueta="Otro" elegida={enOtro} onPress={() => onElegir(OTRO)} est={est} />
          {enOtro && (
            <TextInput
              value={otro}
              onChangeText={onOtro}
              placeholder="Cuéntame en tus palabras"
              placeholderTextColor={C.apagado}
              style={est.input}
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
  const est = useEstilos(crear);
  const { C } = useTema();

  return (
    <TextInput
      value={valor}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={C.apagado}
      style={[est.input, est.inputGrande]}
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
  const est = useEstilos(crear);
  const { C } = useTema();

  return (
    <View style={est.lista}>
      {CAMPOS.map((c) => (
        <View key={c.clave}>
          <View style={est.filaDato}>
            <Text style={est.etiquetaDato}>{c.etiqueta}</Text>
            <TextInput
              value={datos[c.clave]}
              onChangeText={(t) => onChange(c.clave, t.replace(/[^0-9]/g, ''))}
              placeholder="—"
              placeholderTextColor={C.apagado}
              keyboardType="number-pad"
              maxLength={3}
              style={est.inputDato}
            />
            <Text style={est.sufijo}>{c.sufijo}</Text>
          </View>

          {/* Regla dura del producto: el peso nunca es un juicio. */}
          {c.clave === 'peso' && (
            <Text style={est.nota}>Este número no te define. Solo me calibra.</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// El selector de hora vive en components/SelectorHora.js: lo comparte Perfil.
