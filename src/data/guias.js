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
    figura: 'bailar',
    como: [
      'Pon la canción que te guste de verdad.',
      'Muévete como te salga: no hay paso correcto.',
      'Si te da risa, vas bien.',
    ],
    cuidado: 'Espacio libre alrededor y calzado que agarre.',
    masFacil: 'Baila una sola canción.',
  },

  {
    claves: ['zancada', 'zancadas', 'desplante', 'estocada'],
    nombre: 'Zancada',
    figura: 'zancada',
    como: [
      'De pie, da un paso largo hacia adelante.',
      'Baja la rodilla de atrás hacia el piso, sin tocarlo.',
      'Empuja con la pierna de adelante para volver.',
    ],
    cuidado: 'La rodilla de adelante no pasa la punta del pie.',
    masFacil: 'Apóyate en una pared con una mano y baja menos.',
    respira: 'Toma aire al bajar, suéltalo al subir.',
  },
  {
    claves: ['sentadilla bulgara', 'bulgara'],
    nombre: 'Sentadilla búlgara',
    figura: 'zancada',
    como: [
      'Pon el empeine de atrás sobre una silla.',
      'Baja recto, doblando la pierna de adelante.',
      'Sube empujando con el talón de adelante.',
    ],
    cuidado: 'Es más difícil de lo que parece. Empieza sin nada de peso.',
    masFacil: 'Haz la zancada normal, con los dos pies en el piso.',
  },
  {
    claves: ['flexion en el suelo', 'flexiones en el suelo', 'flexion de brazos', 'push up'],
    nombre: 'Flexiones en el suelo',
    figura: 'flexionSuelo',
    como: [
      'Manos en el piso al ancho de los hombros.',
      'Cuerpo en línea recta desde la cabeza hasta los talones.',
      'Baja el pecho doblando los codos y empuja para volver.',
    ],
    cuidado: 'Si la cadera se hunde, apoya las rodillas: cuenta igual.',
    masFacil: 'Con las rodillas en el piso, o de vuelta a la pared.',
    respira: 'Toma aire al bajar, suéltalo al empujar.',
  },
  {
    claves: ['fondo', 'fondos', 'triceps en banco', 'dips'],
    nombre: 'Fondo de tríceps',
    figura: 'fondoTriceps',
    como: [
      'Manos en el borde de una silla firme, dedos hacia adelante.',
      'Baja doblando los codos hacia atrás, no hacia los lados.',
      'Empuja hasta casi estirar los brazos.',
    ],
    cuidado: 'Si sientes tirón en el hombro, baja menos.',
    masFacil: 'Dobla las rodillas y acerca los pies al cuerpo.',
  },
  {
    claves: ['abdominal', 'abdominales', 'crunch', 'encogimiento'],
    nombre: 'Abdominal corto',
    figura: 'abdominal',
    como: [
      'Boca arriba, rodillas dobladas y pies apoyados.',
      'Despega los hombros del piso mirando al techo.',
      'Baja despacio, sin dejarte caer.',
    ],
    cuidado: 'El cuello va suelto: no te empujes la cabeza con las manos.',
    masFacil: 'Sube menos y haz la mitad de repeticiones.',
    respira: 'Suelta el aire al subir.',
  },
  {
    claves: ['superman', 'lumbar', 'lumbares', 'extension de espalda'],
    nombre: 'Superman',
    figura: 'superman',
    como: [
      'Boca abajo, brazos estirados hacia adelante.',
      'Levanta a la vez brazos, pecho y piernas, poco.',
      'Sostén un segundo y baja despacio.',
    ],
    cuidado: 'Poco recorrido. La espalda baja no necesita fuerza, necesita control.',
    masFacil: 'Levanta solo los brazos, o solo las piernas.',
  },
  {
    claves: ['peso muerto', 'bisagra', 'hip hinge'],
    nombre: 'Peso muerto',
    figura: 'pesoMuerto',
    como: [
      'De pie, rodillas apenas dobladas.',
      'Lleva la cadera hacia atrás bajando el peso pegado a las piernas.',
      'Sube apretando los glúteos.',
    ],
    cuidado: 'La espalda va recta. Si se redondea, baja menos o quita peso.',
    masFacil: 'Hazlo sin peso, solo con el movimiento de la cadera.',
    respira: 'Toma aire al bajar, suéltalo al subir.',
  },
  {
    claves: ['curl de biceps', 'curl'],
    nombre: 'Curl de bíceps',
    figura: 'curlBiceps',
    como: [
      'De pie o sentado, codos pegados al cuerpo.',
      'Sube el peso doblando solo el codo.',
      'Baja contando tres, sin soltarlo de golpe.',
    ],
    cuidado: 'Si te impulsas con la espalda, el peso es mucho.',
    masFacil: 'Menos peso y más repeticiones lentas.',
  },
  {
    claves: ['elevacion lateral', 'elevaciones laterales', 'hombros laterales'],
    nombre: 'Elevaciones laterales',
    figura: 'brazos',
    como: [
      'De pie, brazos a los lados y codos apenas doblados.',
      'Sube los brazos hasta la altura de los hombros.',
      'Baja despacio.',
    ],
    cuidado: 'No pasa de los hombros. Más arriba deja de trabajar y empieza a molestar.',
    masFacil: 'Sin peso, o con dos botellas pequeñas.',
  },
  {
    claves: ['marcha en el sitio', 'marcha estacionaria', 'trotar en el sitio'],
    nombre: 'Marcha en el sitio',
    figura: 'caminata',
    como: [
      'De pie, levanta una rodilla y luego la otra.',
      'Acompaña con los brazos, como si caminaras.',
      'Sube el ritmo hasta poder hablar entrecortado.',
    ],
    cuidado: 'Pisa con toda la planta, no de puntillas todo el rato.',
    masFacil: 'Levanta menos las rodillas y ve más lento.',
  },

  {
    claves: ['silla contra la pared', 'sentadilla isometrica', 'wall sit', 'isometrica en pared'],
    nombre: 'Silla contra la pared',
    figura: 'sillaPared',
    como: [
      'Espalda pegada a la pared, pies separados y adelantados.',
      'Baja deslizándote hasta que las rodillas queden en ángulo recto.',
      'Sostén ahí, respirando normal.',
    ],
    cuidado: 'Las rodillas quedan encima de los tobillos, no más adelante.',
    masFacil: 'Baja menos y sostén menos tiempo. Diez segundos cuentan.',
    respira: 'No aguantes el aire: respira suave todo el rato.',
  },
  {
    claves: ['plancha lateral', 'lateral de costado'],
    nombre: 'Plancha lateral',
    figura: 'planchaLateral',
    como: [
      'De costado, apoyado en el antebrazo y en el lado del pie.',
      'Sube la cadera hasta que el cuerpo quede en línea.',
      'Sostén, baja despacio y cambia de lado.',
    ],
    cuidado: 'El codo va justo debajo del hombro.',
    masFacil: 'Apoya la rodilla de abajo en el piso.',
  },
  {
    claves: ['gato y vaca', 'gato vaca', 'movilidad de espalda'],
    nombre: 'Gato y vaca',
    figura: 'cuadrupedia',
    como: [
      'A cuatro apoyos, manos bajo los hombros y rodillas bajo la cadera.',
      'Redondea la espalda mirando al ombligo.',
      'Luego húndela suave, mirando al frente.',
    ],
    cuidado: 'Es movilidad, no fuerza. Que no duela en ningún punto.',
    masFacil: 'Haz el mismo movimiento sentado en una silla.',
    respira: 'Suelta el aire al redondear, tómalo al hundir.',
  },
  {
    claves: ['patada de gluteo', 'patada atras', 'kickback'],
    nombre: 'Patada de glúteo',
    figura: 'patada',
    como: [
      'A cuatro apoyos, con el abdomen firme.',
      'Lleva un talón hacia atrás y arriba, sin arquear la espalda.',
      'Baja controlado y cambia de pierna.',
    ],
    cuidado: 'La cadera se queda mirando al piso: si se abre, es la espalda la que trabaja.',
    masFacil: 'Sube menos la pierna y haz menos repeticiones.',
  },
  {
    claves: ['rodillas al pecho', 'elevacion de rodillas', 'rodillas arriba'],
    nombre: 'Rodillas al pecho',
    figura: 'rodillas',
    como: [
      'De pie, sube una rodilla hasta la altura de la cadera.',
      'Bájala y sube la otra.',
      'Alterna a un ritmo que puedas sostener.',
    ],
    cuidado: 'Pisa con toda la planta al bajar.',
    masFacil: 'Sube menos la rodilla y apóyate en una pared.',
  },
  {
    claves: ['sentadilla sumo', 'sumo'],
    nombre: 'Sentadilla sumo',
    figura: 'sentadilla',
    como: [
      'Pies más anchos que los hombros, puntas hacia afuera.',
      'Baja manteniendo el pecho arriba.',
      'Sube apretando los glúteos.',
    ],
    cuidado: 'Las rodillas siguen la dirección de las puntas de los pies.',
    masFacil: 'Baja hasta la mitad, o hasta tocar una silla.',
  },
  {
    // La toalla salió de aquí: ya tiene guía propia, con su aviso sobre
    // comprobar la puerta antes de tirar.
    claves: ['remo con banda', 'remo de pie'],
    nombre: 'Remo con banda',
    figura: 'remoDePie',
    como: [
      'De pie, con la banda enganchada al frente a la altura del pecho.',
      'Tira llevando los codos atrás y juntando los omóplatos.',
      'Vuelve despacio sin soltar la tensión.',
    ],
    cuidado: 'Tira con la espalda, no con los brazos.',
    masFacil: 'Menos tensión: acércate al punto de anclaje.',
  },
  {
    claves: ['circulos de brazos', 'circulos con los brazos'],
    nombre: 'Círculos de brazos',
    figura: 'brazos',
    como: [
      'De pie, brazos estirados a los lados.',
      'Haz círculos pequeños hacia adelante.',
      'Cambia el sentido a la mitad del tiempo.',
    ],
    cuidado: 'Círculos pequeños. Grandes y rápidos cansan el hombro sin calentarlo.',
    masFacil: 'Un solo brazo a la vez.',
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
    figura: 'pressPecho',
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
  {
    claves: ['jalon al pecho', 'dorsalera', 'polea alta'],
    nombre: 'Jalón al pecho',
    figura: 'jalon',
    como: [
      'Sentado, agarra la barra un poco más ancho que los hombros.',
      'Tira hacia el pecho llevando los codos abajo y atrás.',
      'Sube despacio hasta estirar del todo.',
    ],
    cuidado: 'Nunca por detrás de la nuca: el hombro no está hecho para eso.',
    masFacil: 'Menos peso y para en cuanto los brazos hagan todo el trabajo.',
    respira: 'Suelta el aire al tirar.',
  },
  {
    claves: ['extension de piernas', 'cuadriceps en maquina'],
    nombre: 'Extensión de piernas',
    figura: 'extensionPiernas',
    como: [
      'Sentado, con el rodillo apoyado sobre los tobillos.',
      'Estira las piernas sin bloquear la rodilla del todo.',
      'Baja controlado.',
    ],
    cuidado: 'Si la rodilla molesta, baja el peso y recorta el recorrido.',
    masFacil: 'Menos peso y una serie menos.',
  },
  {
    claves: ['curl femoral', 'femoral', 'isquios en maquina'],
    nombre: 'Curl femoral',
    figura: 'curlFemoral',
    como: [
      'Boca abajo o sentado, según la máquina.',
      'Dobla las rodillas llevando los talones hacia atrás.',
      'Vuelve despacio, sin soltar.',
    ],
    cuidado: 'La cadera se queda pegada al banco.',
    masFacil: 'Menos peso y más repeticiones lentas.',
  },
  {
    claves: ['press de hombro', 'press militar', 'hombro en maquina'],
    nombre: 'Press de hombro',
    figura: 'pressHombro',
    como: [
      'Sentado con la espalda apoyada.',
      'Empuja el peso hacia arriba sin bloquear los codos.',
      'Baja hasta la altura de las orejas.',
    ],
    cuidado: 'Si la espalda se arquea para empujar, el peso es mucho.',
    masFacil: 'Usa la máquina en vez de mancuernas: el recorrido va guiado.',
    respira: 'Suelta el aire al empujar.',
  },
  {
    claves: ['polea de triceps', 'triceps en polea', 'extension de triceps'],
    nombre: 'Polea de tríceps',
    figura: 'tricepsPolea',
    como: [
      'De pie frente a la polea, codos pegados al cuerpo.',
      'Estira los brazos hacia abajo moviendo solo el antebrazo.',
      'Vuelve despacio.',
    ],
    cuidado: 'Los codos no se despegan del costado.',
    masFacil: 'Menos peso y para cuando los hombros quieran ayudar.',
  },
  {
    claves: ['sentadilla en maquina', 'sentadilla guiada', 'smith'],
    nombre: 'Sentadilla en máquina',
    figura: 'sentadilla',
    como: [
      'Barra apoyada en la espalda alta, no en el cuello.',
      'Pies un poco adelantados, baja como si te sentaras.',
      'Sube empujando con los talones.',
    ],
    cuidado: 'Con barra guiada empieza con la barra sola, sin discos.',
    masFacil: 'Usa la prensa de piernas: el recorrido va guiado y la espalda descansa.',
    respira: 'Toma aire al bajar, suéltalo al subir.',
  },
  {
    claves: ['abductor', 'abductores', 'maquina de abductores'],
    nombre: 'Máquina de abductores',
    figura: 'abductores',
    como: [
      'Sentado, con las piernas dentro de los apoyos.',
      'Abre las piernas empujando hacia afuera.',
      'Vuelve despacio, sin dejar que el peso te cierre de golpe.',
    ],
    cuidado: 'La espalda pegada al respaldo todo el recorrido.',
    masFacil: 'Menos peso y recorrido más corto.',
  },
  {
    claves: ['talones en maquina', 'gemelos en maquina', 'pantorrilla en maquina'],
    nombre: 'Elevación de talones en máquina',
    figura: 'talones',
    como: [
      'Hombros bajo los apoyos, punta de los pies en la plataforma.',
      'Sube los talones todo lo que puedas.',
      'Baja despacio hasta sentir el estiramiento.',
    ],
    cuidado: 'La bajada lenta es la que trabaja.',
    masFacil: 'Hazlo de pie sin máquina, apoyándote en una pared.',
  },
  {
    claves: ['polea baja', 'remo en polea', 'remo bajo'],
    nombre: 'Remo en polea baja',
    figura: 'remoDePie',
    como: [
      'Sentado o de pie, espalda firme y pecho arriba.',
      'Tira llevando los codos atrás, pegados al cuerpo.',
      'Vuelve despacio sin dejar que el peso te estire de golpe.',
    ],
    cuidado: 'La espalda no se redondea al volver.',
    masFacil: 'Menos peso y para en cuanto pierdas la postura.',
  },

  // --- Lo que se puede hacer sin bajar al suelo ---------------------------
  //
  // Los cuatro ejercicios de centro que había pedían todos tumbarse, y quien
  // no puede bajar al piso se quedaba sin ninguno. Estos cinco cierran ese
  // hueco y de paso ponen el escalón que faltaba entre la pared y el suelo.

  {
    claves: ['plancha en la mesa', 'plancha inclinada', 'plancha en la encimera'],
    nombre: 'Plancha en la mesa',
    figura: 'planchaInclinada',
    como: [
      'Manos en el borde de una mesa firme, al ancho de los hombros.',
      'Camina los pies hacia atrás hasta quedar en diagonal.',
      'Aprieta el abdomen y sostén, respirando normal.',
    ],
    cuidado: 'Si la cadera se va hacia arriba o se hunde, acerca los pies.',
    masFacil: 'Ponte más de pie: mientras más alta la mesa, más suave.',
    respira: 'No aguantes el aire. Respirar es parte del ejercicio.',
  },
  {
    claves: ['giro de tronco', 'giro sentado', 'rotacion de tronco', 'torsion'],
    nombre: 'Giro de tronco sentado',
    figura: 'giroTronco',
    como: [
      'Sentado con los pies apoyados y la espalda despegada del respaldo.',
      'Cruza los brazos al pecho y gira los hombros a un lado.',
      'Vuelve al centro y gira al otro, sin apurarte.',
    ],
    cuidado: 'Las caderas se quedan quietas. Lo que gira es el tronco.',
    masFacil: 'Gira la mitad del recorrido y descansa entre lado y lado.',
  },
  {
    claves: ['inclinacion lateral', 'flexion lateral', 'estiramiento de costado'],
    nombre: 'Inclinación lateral de pie',
    figura: 'inclinacionLateral',
    como: [
      'De pie, pies al ancho de las caderas.',
      'Sube un brazo por encima de la cabeza.',
      'Inclínate hacia el lado contrario y vuelve al centro.',
    ],
    cuidado: 'El cuerpo se dobla al lado, no hacia adelante.',
    masFacil: 'Baja menos y apoya la otra mano en la cadera.',
    respira: 'Suelta el aire al inclinarte.',
  },
  {
    claves: ['flexion en la mesa', 'flexiones en la mesa', 'flexion inclinada'],
    nombre: 'Flexiones en la mesa',
    figura: 'flexionMesa',
    como: [
      'Manos en el borde de una mesa firme, al ancho de los hombros.',
      'Cuerpo en línea recta, pies atrás.',
      'Baja el pecho hacia la mesa y empuja para volver.',
    ],
    cuidado: 'Comprueba que la mesa no se mueva antes de apoyarte.',
    masFacil: 'Vuelve a la pared, que es el mismo movimiento más suave.',
    respira: 'Toma aire al bajar, suéltalo al empujar.',
  },
  {
    claves: ['remo con toalla', 'remo de toalla', 'remo sin banda'],
    nombre: 'Remo con toalla',
    figura: 'remoDePie',
    como: [
      'Pasa una toalla por la manija de una puerta cerrada y agarra las puntas.',
      'Brazos estirados, tronco un poco atrás y talones firmes.',
      'Tira llevando los codos atrás y junta los omóplatos.',
    ],
    cuidado: 'Comprueba que la puerta esté cerrada y con seguro antes de tirar.',
    masFacil: 'Ponte más de pie: mientras menos te inclines, menos pesa.',
  },
  {
    claves: ['estiramiento de pecho', 'pecho en la puerta', 'marco de la puerta'],
    nombre: 'Estiramiento de pecho en la puerta',
    figura: 'pechoPuerta',
    como: [
      'De pie en el marco de una puerta, antebrazos apoyados a los lados.',
      'Adelanta un pie y deja que el pecho pase el marco.',
      'Sostén sin rebotar y vuelve despacio.',
    ],
    cuidado: 'Debe tirar en el pecho, nunca pinchar en el hombro.',
    masFacil: 'Baja los brazos a la altura del pecho y adelanta menos.',
    respira: 'Respira lento mientras sostienes.',
  },
  {
    claves: ['estiramiento de muslo', 'cuadriceps de pie', 'talon al gluteo'],
    nombre: 'Estiramiento de muslo de pie',
    figura: 'cuadricepsDePie',
    como: [
      'Apóyate en una pared con una mano.',
      'Dobla la otra pierna y llévate el talón hacia el glúteo.',
      'Sostén, suelta y cambia de pierna.',
    ],
    cuidado: 'Las rodillas se quedan juntas y la cadera no se va atrás.',
    masFacil: 'Sujétate el pantalón en vez del pie, o hazlo sentado de lado.',
  },
  {
    claves: ['aflojar cuello', 'cuello y hombros', 'encogimiento de hombros'],
    nombre: 'Aflojar cuello y hombros',
    figura: 'cuelloHombros',
    como: [
      'Sentado o de pie, brazos sueltos a los lados.',
      'Sube los hombros hacia las orejas y sostén un momento.',
      'Suéltalos de golpe y siente cómo caen.',
    ],
    cuidado: 'El cuello no se estira a la fuerza. Solo sube y baja.',
    masFacil: 'Hazlo sentado, apoyando la espalda.',
    respira: 'Toma aire al subir, suéltalo al soltar los hombros.',
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
