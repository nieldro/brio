// Cómo se hace cada movimiento.
//
// Escritas a mano y revisadas, NO generadas por la IA en cada llamada.
// Una indicación de técnica mal inventada puede lesionar a alguien, y el
// documento es claro: nada de ejercicios de riesgo sin supervisión. El plan
// lo arma Gemini; cómo mover el cuerpo sale de aquí.
//
// Forma de cada guía:
//   claves     con qué nombres del plan hace match (en minúscula, sin tildes)
//   nombre     título que se muestra
//   figura     qué animación lo dibuja (ver components/FiguraEjercicio.js)
//   como       los pasos, cortos y en orden
//   cuidado    el error típico, dicho sin regañar
//   masFacil   la versión mínima, para el día que no se puede
//   respira    cuándo soltar el aire, cuando importa

export const GUIAS = [
  {
    claves: ['caminata', 'caminar', 'paseo', 'marcha', 'paso a paso'],
    nombre: 'Caminata',
    figura: 'caminata',
    como: [
      'Hombros sueltos y mirada al frente, no al piso.',
      'Pisa con el talón y empuja con la punta.',
      'Deja que los brazos se muevan solos.',
    ],
    cuidado: 'Si vas hablando sin ahogarte, ese es el ritmo correcto.',
    masFacil: 'Camina la mitad del tiempo y siéntate cuando quieras.',
  },
  {
    claves: ['movilidad', 'rotaciones', 'articular', 'calentamiento'],
    nombre: 'Movilidad articular',
    figura: 'brazos',
    como: [
      'Empieza por el cuello: gira despacio de un lado al otro.',
      'Sigue con hombros, cadera y tobillos, en círculos suaves.',
      'Diez movimientos por articulación alcanzan.',
    ],
    cuidado: 'Lento gana. Si algo truena sin doler, es normal.',
    masFacil: 'Haz solo cuello y hombros, sentado.',
  },
  {
    claves: ['sentadilla', 'sentadillas', 'silla', 'squat'],
    nombre: 'Sentadilla a la silla',
    figura: 'sentadilla',
    como: [
      'De pie, de espaldas a una silla, pies al ancho de las caderas.',
      'Baja como si te fueras a sentar, sacando la cola hacia atrás.',
      'Toca la silla con los glúteos y sube empujando con los talones.',
    ],
    cuidado: 'Las rodillas apuntan hacia donde miran los pies, no hacia adentro.',
    masFacil: 'Siéntate del todo y levántate con ayuda de las manos.',
    respira: 'Toma aire al bajar, suéltalo al subir.',
  },
  {
    claves: ['talon', 'talones', 'pantorrilla', 'gemelos'],
    nombre: 'Elevación de talones',
    figura: 'talones',
    como: [
      'De pie, con una pared o silla cerca para apoyarte.',
      'Sube los talones hasta quedar en punta de pies.',
      'Baja despacio, sin dejarte caer.',
    ],
    cuidado: 'La bajada lenta es la que trabaja.',
    masFacil: 'Apóyate con las dos manos y sube menos.',
  },
  {
    claves: ['flexion', 'flexiones', 'pared', 'lagartija'],
    nombre: 'Flexiones en la pared',
    figura: 'flexion',
    como: [
      'Frente a la pared, manos apoyadas al ancho de los hombros.',
      'Da un paso atrás para quedar inclinado.',
      'Dobla los codos acercando el pecho y empuja para volver.',
    ],
    cuidado: 'El cuerpo va derecho, sin sacar la cola ni hundir la cadera.',
    masFacil: 'Ponte más cerca de la pared: entre más cerca, más fácil.',
    respira: 'Toma aire al bajar, suéltalo al empujar.',
  },
  {
    claves: ['puente', 'gluteo', 'gluteos', 'cadera'],
    nombre: 'Puente de glúteos',
    figura: 'puente',
    como: [
      'Boca arriba, rodillas dobladas y pies apoyados.',
      'Empuja con los talones y sube la cadera.',
      'Aprieta arriba un segundo y baja despacio.',
    ],
    cuidado: 'La fuerza sale de los glúteos, no de la espalda baja.',
    masFacil: 'Sube solo hasta la mitad.',
    respira: 'Suelta el aire al subir.',
  },
  {
    claves: ['plancha', 'abdomen', 'core', 'isometrico'],
    nombre: 'Plancha apoyada',
    figura: 'plancha',
    como: [
      'Apoya antebrazos y rodillas en el piso.',
      'Cuerpo en línea recta desde la cabeza hasta las rodillas.',
      'Aprieta el abdomen y sostén.',
    ],
    cuidado: 'Si la cadera se hunde, para y descansa. Aguantar mal no suma.',
    masFacil: 'Sostén diez segundos, descansa, repite.',
    respira: 'No aguantes el aire: respira normal.',
  },
  {
    claves: ['estiramiento', 'estirar', 'elongacion', 'flexibilidad'],
    nombre: 'Estiramiento',
    figura: 'estiramiento',
    como: [
      'Entra al estiramiento despacio, hasta sentir tensión suave.',
      'Sostén entre veinte y treinta segundos.',
      'Sal igual de despacio.',
    ],
    cuidado: 'Estirar tira un poco. Si duele, te pasaste.',
    masFacil: 'Estira sentado en una silla.',
    respira: 'Respira normal, sin aguantar.',
  },
  {
    claves: ['escaleras', 'escalon', 'subir'],
    nombre: 'Subir escaleras',
    figura: 'escalera',
    como: [
      'Pisa el escalón completo, no solo con la punta.',
      'Sube a un ritmo que puedas sostener.',
      'Baja con calma, sin correr.',
    ],
    cuidado: 'Ten la baranda cerca. Bajar rápido es donde pasan los accidentes.',
    masFacil: 'Sube un piso, descansa, decide si sigues.',
  },
  {
    claves: ['lateral', 'laterales', 'paso lateral'],
    nombre: 'Pasos laterales',
    figura: 'lateral',
    como: [
      'De pie, da un paso ancho hacia un lado.',
      'Junta el otro pie y regresa.',
      'Alterna de lado a lado, con los brazos sueltos.',
    ],
    cuidado: 'Mira al frente, no a los pies.',
    masFacil: 'Pasos más cortos y sin brazos.',
  },
  {
    claves: ['respiracion', 'respirar', 'calma', 'relajacion'],
    nombre: 'Respiración',
    figura: 'respiracion',
    como: [
      'Sentado o acostado, una mano en el pecho y otra en la barriga.',
      'Toma aire por la nariz cuatro segundos: sube la barriga, no el pecho.',
      'Suéltalo por la boca en seis segundos.',
    ],
    cuidado: 'Si te mareas, vuelve a tu respiración normal.',
    masFacil: 'Tres respiraciones bastan.',
  },
  {
    claves: ['baile', 'bailar', 'zumba'],
    nombre: 'Bailar',
    figura: 'brazos',
    como: [
      'Pon la canción que te guste de verdad.',
      'Muévete como te salga: no hay paso correcto.',
      'Si te da risa, vas bien.',
    ],
    cuidado: 'Espacio libre alrededor y calzado que agarre.',
    masFacil: 'Baila una sola canción.',
  },

  // --- Gimnasio -----------------------------------------------------------
  {
    claves: ['prensa', 'leg press'],
    nombre: 'Prensa de piernas',
    figura: 'empuje',
    como: [
      'Ajusta el asiento para que las rodillas queden dobladas al empezar.',
      'Pies al ancho de las caderas sobre la plataforma.',
      'Empuja sin estirar del todo la rodilla y baja controlado.',
    ],
    cuidado: 'Nunca bloquees las rodillas al final del empuje.',
    masFacil: 'Baja el peso y haz más repeticiones lentas.',
    respira: 'Suelta el aire al empujar.',
  },
  {
    claves: ['remo', 'jalon', 'espalda', 'polea'],
    nombre: 'Remo en máquina',
    figura: 'remo',
    como: [
      'Pecho apoyado o espalda firme, según la máquina.',
      'Tira llevando los codos hacia atrás, juntando los omóplatos.',
      'Vuelve despacio sin soltar de golpe.',
    ],
    cuidado: 'Tira con la espalda, no con los brazos.',
    masFacil: 'Menos peso y para en cuanto pierdas la postura.',
  },
  {
    claves: ['press', 'pecho', 'banca'],
    nombre: 'Press de pecho',
    figura: 'empuje',
    como: [
      'Espalda apoyada y pies firmes en el piso.',
      'Baja controlado hasta la altura del pecho.',
      'Empuja hasta casi estirar los brazos.',
    ],
    cuidado: 'Con barra libre, nunca sin alguien que te vea.',
    masFacil: 'Usa la máquina en vez de la barra: el recorrido va guiado.',
    respira: 'Toma aire al bajar, suéltalo al empujar.',
  },
  {
    claves: ['mancuerna', 'mancuernas', 'pesas', 'biceps', 'hombro'],
    nombre: 'Trabajo con mancuernas',
    figura: 'remo',
    como: [
      'Empieza con un peso que te deje hacer todas las repeticiones.',
      'Sube contando dos, baja contando tres.',
      'Codos pegados al cuerpo salvo que el ejercicio pida otra cosa.',
    ],
    cuidado: 'Si tienes que impulsarte con la espalda, el peso es mucho.',
    masFacil: 'Baja el peso o haz una serie menos.',
  },
  {
    claves: ['eliptica', 'bicicleta', 'cinta', 'trotadora', 'cardio'],
    nombre: 'Máquina de cardio',
    figura: 'caminata',
    como: [
      'Empieza cinco minutos suaves para entrar en calor.',
      'Sube el ritmo hasta poder hablar entrecortado, no menos.',
      'Cierra con tres minutos lentos.',
    ],
    cuidado: 'Sin agarrarte fuerte de las manijas: el trabajo es de las piernas.',
    masFacil: 'Quédate en el ritmo suave todo el tiempo.',
  },
];

// Se usa cuando el ejercicio no está en la biblioteca. Nunca se inventa técnica.
export const GUIA_GENERICA = {
  nombre: null,
  como: [
    'Empieza despacio y busca la postura cómoda antes de sumar ritmo.',
    'Mejor pocas repeticiones bien hechas que muchas apuradas.',
  ],
  cuidado: 'Si algo duele de forma aguda, para. Molestia leve está bien; dolor no.',
  masFacil: 'Haz la mitad. Contar cuenta.',
};
