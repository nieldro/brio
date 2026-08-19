// Detector de riesgo y derivación profesional. Puro, sin red: se prueba solo.
//
// POR QUÉ EXISTE
// El prompt del coach ya lleva su párrafo de seguridad ("detectas tristeza
// profunda o ideas de hacerse daño: responde con calma, sugiere ayuda
// profesional"). Eso es una petición, no una garantía, y tiene dos agujeros
// que no se tapan escribiendo mejor el prompt:
//   - Un modelo puede desobedecerla, y no hay forma de comprobar que no lo
//     hará antes de que le pase a alguien.
//   - Cuando no hay red, la app contesta sola con su texto local y ahí no hay
//     ningún prompt que valga.
// Por eso esto es código, corre ANTES que la IA y la puede cortocircuitar.
// El prompt pide; esto obliga. El mismo trato que platoJson.js le da al
// validador del plato, y por la misma razón.
//
// POR QUÉ LOS FALSOS POSITIVOS PESAN TANTO COMO LOS NEGATIVOS
// "Me estoy muriendo de hambre", "me mata la pereza" y "esa rutina me mató"
// son español normal. Soltarle una línea de crisis a alguien que solo tenía
// pereza rompe la confianza y le hace cerrar la app, y quien la cierra ya no
// vuelve el día que sí lo necesite. Por eso lo primero que pasa aquí es que
// se borran las frases hechas, antes de buscar nada.

// Las líneas de Colombia, que es donde vive la persona a la que le hablamos.
// Viven aquí y no dentro de la frase para que las pruebas comprueben que
// siguen en el texto, y para cambiarlas en un solo sitio si cambian.
export const LINEAS = {
  bogota: '106',
  nacional: '192',
  opcion: '4',
};

// Los niveles que NO llegan a la IA. Los escribe este archivo entero.
export const NIVELES_QUE_CORTAN = ['ideacion', 'autolesion', 'alimentario', 'dolor'];

// Sin tildes y en minúscula: mucha gente escribe sin acentos, y quien está
// mal a las tres de la mañana escribe todavía peor. Ojo: la ñ se queda en n,
// así que los patrones de abajo dicen "dano" y "sueno" a propósito.
const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // las tildes ya separadas por NFD
    .replace(/\s+/g, ' ')
    .trim();

// Frases hechas con "morir" y "matar" que no hablan de morirse ni de matar.
// Se borran del texto antes de buscar señales: es más seguro quitarlas de
// una que intentar esquivarlas patrón por patrón.
//
// CUIDADO CON "ME MATO"
// La versión anterior borraba `(me|te|nos|le|les) (mata|matan|mato|...)` a
// secas, y con eso "me mato hoy" desaparecía del texto ANTES de buscar nada:
// la señal más grave de todas era literalmente indetectable. El modismo
// siempre trae su sujeto —delante ("esa rutina me mató") o detrás ("me mata
// la pereza")— y exigirlo es lo que separa una queja de una intención.
const MODISMOS = [
  // "me muero de hambre", "me estoy muriendo del sueno", "muertos de risa"
  /\b(me\s+)?(estoy\s+)?(muero|muere|mueres|morir|morirme|morirse|muriendo|muriendome|muerto|muerta|muertos|muertas)\b[^.,;!?]{0,12}\bdel?\s+(?:la\s+|el\s+|los\s+|las\s+)?(hambre|sed|sueno|risa|frio|calor|pereza|cansancio|ganas|amor|miedo|pena|verguenza|aburrimiento|nervios|rabia|ira|envidia)\b/g,
  // El sujeto va DETRÁS: "me mata la pereza", "me esta matando el calor".
  /\b(me|te|nos|le|les)\s+(mata|matan|mataba|estan?\s+matando|esta\s+matando)\s+(el|la|los|las|ese|esa|esos|esas|este|esta|mi|tanto|tanta|tanto\s+|lo)\b/g,
  // El sujeto va DELANTE: "esa rutina me mato", "el calor me mata".
  /\b(el|la|los|las|ese|esa|esos|esas|este|esta|mi|tu|su|aquel|aquella)\s+[a-z]+\s+(me|te|nos)\s+(mata|mato|matan|mataron|mataba)\b/g,
  // "esa clase estuvo de muerte"
  /\bde\s+muerte\b/g,
];

// Ideas de hacerse daño o de no querer seguir. El nivel más alto.
const IDEACION = [
  /\bsuicid/,
  /\bquit(arme|arse|armela)\s+la\s+vida\b/,
  /\b(quiero|quisiera|deseo|prefiero|preferiria)\s+(morir|morirme|estar\s+muerto|estar\s+muerta|no\s+existir|no\s+despertar|no\s+estar\s+aqui)\b/,
  /\bganas\s+de\s+(morir|morirme|desaparecer|no\s+existir|no\s+despertar)\b/,
  /\bme\s+quiero\s+(morir|matar)\b/,
  /\bmatarme\b/,
  // La forma proclítica, que es la MÁS común hablando, y que faltaba entera:
  // solo estaba "matarme". "Me voy a matar" devolvía null.
  /\bme\s+(voy\s+a|quiero|quisiera|pienso|deberia|tengo\s+ganas\s+de)\s+matar\b/,
  // "Me mato" sin el sujeto del modismo. Las formas de trabajar hasta
  // reventar sí se excluyen, porque esas sí son español corriente.
  /\bme\s+mato\b(?!\s+(estudiando|trabajando|entrenando|corriendo|haciendo|yendo|a\s+trabajar|a\s+estudiar|de\s+risa|del?\s))/,
  /\b(ya\s+)?no\s+quiero\s+estar\s+(en\s+este\s+mundo|mas\s+aqui|mas\s+en\s+este\s+mundo)\b/,
  /\bquiero\s+irme\s+de\s+este\s+mundo\b/,
  /\bno\s+(le\s+)?veo\s+(la\s+)?salida\b/,
  /\b(acabar|terminar)\s+con\s+(todo|mi\s+vida)\b/,
  /\bquiero\s+desaparecer\b/,
  /\bdesaparecer\s+(de\s+aqui|del\s+mundo|para\s+siempre)\b/,
  /\bdejar\s+de\s+existir\b/,
  /\bno\s+quiero\s+(vivir|existir|despertar|estar\s+aqui)\b/,
  // "No quiero seguir" a secas sí es señal. Con complemento casi nunca lo es.
  //
  // Antes esto era una lista CERRADA de verbos a excluir, y por definición
  // siempre falta uno: "no quiero seguir hablando de eso" y "no quiero seguir
  // pagando el gym" soltaban la línea 106. La regla se invierte: en vez de
  // tapar excepciones una a una, se EXIGE que la frase termine ahí o que el
  // complemento hable de la vida. Es la diferencia entre una lista que hay
  // que completar y una condición que se cumple o no.
  /\bno\s+quiero\s+seguir\b(?=\s*$|\s*[.,;:!?])/,
  /\bno\s+quiero\s+seguir\s+(viviendo|vivo|viva|con\s+vida|existiendo|despertando|en\s+este\s+mundo|aqui)\b/,
  /\b(estarian|estaria|estan|van\s+a\s+estar)\s+mejor\s+sin\s+mi\b/,
  /\bsin\s+mi\s+(estarian|estaria|van\s+a\s+estar)\b/,
  /\bnadie\s+me\s+(va\s+a\s+)?(extranar|echar\s+de\s+menos|notaria)\b/,
  /\bno\s+(le\s+)?(veo|encuentro)\s+sentido\s+a\s+(la\s+vida|vivir|nada|seguir)\b/,
  /\bla\s+vida\s+no\s+(tiene\s+sentido|vale\s+la\s+pena)\b/,
  /\bno\s+vale\s+la\s+pena\s+(vivir|seguir\s+viviendo)\b/,
  // Casi nadie lo dice en primera persona y de frente. "Sería mejor no
  // despertar" es la forma en que suele salir, y es la misma señal.
  /\b(seria|fuera|estaria)\s+mejor\s+no\s+(despertar|estar\s+aqui|existir|haber\s+nacido)\b/,
  /\bmejor\s+no\s+(despertar|existir|haber\s+nacido)\b(?!\s+(tan|temprano|antes|a\s+las))/,
  /\bojala\s+no\s+(despertara|despierte|amanezca|me\s+despierte)\b/,
  /\bsi\s+yo\s+no\s+estuviera\b/,
  /\bcansad[oa]\s+de\s+vivir\b/,
  // Mismo cambio de enfoque: o la frase se cierra ahí, o el complemento
  // habla de la vida. "¿Para qué seguir así si no veo nada?" es desánimo,
  // y el desánimo se acompaña en vez de derivarse.
  /\bpara\s+que\s+(sigo|vivo|existo|seguir|vivir|existir)\b(?=\s*$|\s*[.,;:!?])/,
  /\bpara\s+que\s+(seguir|sigo|estoy)\s+(viviendo|vivo|con\s+vida|existiendo|aqui|en\s+este\s+mundo)\b/,
  /\bno\s+aguanto\s+(mas\s+)?(la\s+vida|esta\s+vida)\b/,
  /\bmejor\s+(me\s+)?(muero|morirme)\b/,
];

// Autolesión. Aquí el cuidado está en no confundirla con una lesión del
// entrenamiento: "me hice daño en la rodilla" es lo segundo, no lo primero.
const AUTOLESION = [
  /\bautolesion/,
  /\b(hacerme|haciendome)\s+dano\b/,
  /\bme\s+(quiero|voy\s+a|suelo)\s+hacer\s+dano\b/,
  /\bme\s+hago\s+dano\b/,
  /\bme\s+hice\s+dano\b(?!\s+(en|con|haciendo|entrenando|corriendo|jugando|practicando|al|la|el))/,
  /\bganas\s+de\s+(hacerme\s+dano|cortarme|lastimarme|golpearme|quemarme)\b/,
  /\bcortarme\b(?!\s+(el\s+pelo|el\s+cabello|las\s+unas|la\s+una|la\s+barba))/,
  /\bme\s+cort[oe]\b(?!\s+(el\s+pelo|el\s+cabello|las\s+unas|la\s+una|la\s+barba|cocinando|picando|sin\s+querer|con))/,
  /\bgolpearme\b/,
  /\b(me\s+)?(cort[oe]|golpe[oe]|lastim[oe]|quem[oe])\b[^.]{0,25}\ba\s+proposito\b/,
  /\bme\s+castigo\s+(fisicamente|con\s+golpes|pegandome)\b/,
];

// Señales de trastorno alimentario. Se deriva, no se opina.
const ALIMENTARIO = [
  /\b(bulimi|anorexi)/,
  /\btrastorno\s+alimentari/,
  /\bme\s+(hago|provoco|induzco)\s+(vomitar|el\s+vomito)\b/,
  // `lo\s+que\s+com\b` era inalcanzable: "com" seguido de vocal nunca produce
  // un límite de palabra, así que "vomito lo que como" —que es señal de
  // manual— no lo veía nadie.
  /\bvomit(o|ar|e|aba|ando)\b[^.]{0,30}\b(despues\s+de\s+comer|lo\s+que\s+como|la\s+comida|para\s+no\s+engordar|para\s+no\s+subir|a\s+proposito)\b/,
  /\b(despues\s+de\s+comer|cada\s+vez\s+que\s+como)\b[^.]{0,30}\bvomit/,
  /\blaxante/,
  /\bdiuretico/,
  /\bpastillas\s+para\s+(adelgazar|bajar\s+de\s+peso)\b/,
  /\bme\s+purgo\b/,
  /\batracon/,
  /\bno\s+merezco\s+(comer|la\s+comida)\b/,
  /\bno\s+me\s+merezco\s+(comer|la\s+comida)\b/,
  // Todo este bloque estaba escrito al revés y por eso convertía logros en
  // alarmas. "No he comido nada frito esta semana" es literalmente un avance,
  // y recibía "busca a un profesional de la salud". Ahora la frase tiene que
  // CERRARSE ahí —comer, punto— o traer una ventana larga de verdad.
  /\b(dejar|deje|dejo|voy\s+a\s+dejar)\s+de\s+comer\b(?=\s*$|\s*[.,;:!?])/,
  /\b(dejar|deje|dejo|voy\s+a\s+dejar)\s+de\s+comer\s+(del\s+todo|por\s+completo|para\s+bajar|para\s+adelgazar|hasta\s+que)\b/,
  /\b(dias|semanas|un\s+dia|dos\s+dias|tres\s+dias)\s+sin\s+comer\b(?=\s*$|\s*[.,;:!?])/,
  /\bsin\s+comer\s+(hace|desde)\s+(dos|tres|cuatro|varios|muchos)\b/,
  /\bno\s+he\s+comido\s+nada\b(?=\s*$|\s*[.,;:!?])/,
  // Una ventana larga puede venir como cantidad ("dos días") o como punto de
  // partida ("desde el lunes", "desde ayer"), que es como lo dice la gente.
  /\bno\s+he\s+comido\s+(nada\s+)?(en|desde|hace)\s+(dos|tres|cuatro|varios|muchos|todo\s+el)\s+(dias?|semanas?|dia)\b/,
  /\bno\s+he\s+comido\s+(nada\s+)?(desde|hace)\s+(el\s+|la\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo|ayer|anteayer|antier|el\s+fin\s+de\s+semana)\b/,
  /\bno\s+he\s+comido\s+en\s+todo\s+el\s+dia\b/,
  /\bno\s+como\s+(hace|desde)\s+(dos|tres|cuatro|varios|muchos|ayer|el\s+lunes)\b/,
  /\bayun(o|os|ar|ando)\b[^.]{0,30}\b(dias|semana|castigo|castigarme|largo|extremo|no\s+comer)\b/,
  /\b(castigo|castigarme|castigandome)\b[^.]{0,30}\b(sin\s+comer|no\s+comer|comiendo|comida|comer|entrenando|ejercicio)\b/,
  /\b(compenso|compensar)\b[^.]{0,30}\b(lo\s+que\s+comi|la\s+comida|comi\b)/,
  /\bme\s+odio\s+(despues\s+de|cuando)\s+com/,
  /\bme\s+da\s+asco\s+comer\b/,
  /\bmiedo\s+a\s+comer\b/,
];

// Dolor agudo o lesión. No es agujetas: se pide intensidad o algo que sonó,
// se dobló o dejó de moverse. "Me duelen las piernas" al día siguiente de
// entrenar es lo normal y no puede convertirse en una alarma.
const DOLOR = [
  /\bdolor\s+(fuerte|muy\s+fuerte|agudo|intenso|punzante|insoportable|que\s+no\s+se\s+(me\s+)?quita)\b/,
  // El dolor que corta es el del cuerpo entrenando, así que se pide la parte
  // del cuerpo. Antes bastaba "me duele mucho" con una lista de excepciones,
  // y "me duele mucho la cabeza hoy" recibía "hoy paramos, que lo mire un
  // profesional". Un dolor de cabeza no es una lesión de entrenamiento.
  /\bme\s+duele\s+(mucho|muchisimo|demasiado|un\s+monton|horrible|un\s+resto|bastante)\s+(el|la)\s+(rodilla|espalda|hombro|cuello|tobillo|cadera|muneca|codo|pie|pierna|brazo|lumbar|cintura|musculo|talon|ingle|isquio)\b/,
  /\bme\s+duele\s+el\s+pecho\b/,
  /\bdolor\s+en\s+el\s+pecho\b/,
  /\bno\s+aguanto\s+el\s+dolor\b/,
  /\bno\s+puedo\s+(apoyar|caminar|pisar|mover|doblar|estirar|respirar)\b/,
  // "Se me fue" estaba en esta lista, y es de lo más común en un chat de
  // hábitos: "se me fue el día", "se me fue la hora", "se me fue la
  // motivación". Toda esa gente recibía una derivación a un profesional y su
  // mensaje ni siquiera llegaba al coach. Ahora se pide la parte del cuerpo,
  // que es lo que separa una torcedura de una excusa.
  /\bse\s+me\s+(doblo|torcio|zafo|salio|trabo|engarroto|hincho)\s+(el|la|un|una)\s+(tobillo|rodilla|hombro|cuello|espalda|muneca|codo|cadera|pie|mano|dedo|brazo|pierna|musculo|talon)\b/,
  /\b(tronido|chasquido|crujido)\b/,
  /\bme\s+(trono|crujio)\s+(la|el)\b/,
  // Nombrar la palabra "lesión" no puede dejar a nadie sin coach. Antes
  // "¿cómo evito una lesión?" o "esa lesión ya sanó" cortaban la
  // conversación y devolvían un texto enlatado que no respondía a la
  // pregunta. Se pide que sea de ahora, no de hace dos años ni hipotética.
  /\bme\s+(acabo\s+de\s+)?lesion[eo]\b(?!\s+(hace|el\s+ano|el\s+mes|en\s+\d))/,
  /\b(tengo|traigo|ando\s+con)\s+una\s+lesion\b/,
  /\b(esguince|desgarro|fractura|fisura|luxacion|tendinitis|hernia)\b/,
  /\bme\s+disloqu/,
  /\bpunzada/,
  /\bme\s+desmay/,
];

// Desánimo profundo sin ideación. Esto NO se corta: se acompaña. La IA
// responde, con una nota extra para que valide primero y no exija nada.
const DESANIMO = [
  // "No puedo más de la risa" es lo contrario de "no puedo más".
  /\bno\s+(puedo|doy)\s+mas\b(?!\s+(de|del)\s+(la\s+)?(risa|felicidad|alegria|amor|orgullo|emocion|ganas|contento|contenta))/,
  /\bya\s+no\s+puedo\b/,
  /\b(estoy|me\s+siento)\s+(muy\s+|super\s+)?(triste|vacio|vacia|hundido|hundida|deprimido|deprimida|solo|sola|perdido|perdida|agotado|agotada|abrumado|abrumada|fatal|pesimo|pesima|horrible|bajo|baja|bajoneado|bajoneada)\b/,
  /\bme\s+siento\s+(una\s+basura|un\s+asco|de\s+bajon)\b/,
  /\bdeprimi/,
  /\btodo\s+me\s+da\s+igual\b/,
  /\bnada\s+me\s+(importa|motiva|llena|hace\s+ilusion)\b/,
  /\bno\s+tengo\s+ganas\s+de\s+nada\b/,
  /\bno\s+(sirvo|valgo)\s+(para\s+nada|nada)\b/,
  /\bsoy\s+(un|una)\s+(desastre|fracaso|inutil)\b/,
  /\bme\s+(odio|detesto)\b/,
  /\bllevo\s+dias\s+(llorando|mal|sin\s+levantarme|tirado|tirada)\b/,
  /\bno\s+puedo\s+dejar\s+de\s+llorar\b/,
  /\bestoy\s+muy\s+mal\b/,
  /\bno\s+quiero\s+seguir\s+asi\b/,
  /\bno\s+le\s+encuentro\s+sentido\b/,
];

// El orden es el de gravedad. Un mensaje que dice las dos cosas se atiende
// por la más grave: quien escribe que no quiere seguir y que le duele la
// rodilla no necesita que le hablen de la rodilla.
const ESCALA = [
  ['ideacion', IDEACION],
  ['autolesion', AUTOLESION],
  ['alimentario', ALIMENTARIO],
  ['dolor', DOLOR],
  ['desanimo', DESANIMO],
];

// Devuelve solo el NIVEL, nunca el trozo de texto que disparó la señal.
// Saber qué patrón saltó ayudaría a depurar, y ese es justo el motivo por el
// que no se devuelve: acabaría copiado en un log de Azure, y lo que alguien
// escribe en su peor momento no se guarda en ninguna parte.
export function detectarRiesgo(texto) {
  let limpio = normalizar(texto);
  if (!limpio) return { nivel: null, corta: false };

  for (const modismo of MODISMOS) limpio = limpio.replace(modismo, ' ');

  for (const [nivel, patrones] of ESCALA) {
    if (patrones.some((p) => p.test(limpio))) {
      return { nivel, corta: NIVELES_QUE_CORTAN.includes(nivel) };
    }
  }

  return { nivel: null, corta: false };
}

// El nombre delante cuando lo hay, y si no, la frase con mayúscula.
const abre = (nombre, frase) => {
  const quien = typeof nombre === 'string' ? nombre.trim() : '';
  if (!quien) return frase.charAt(0).toUpperCase() + frase.slice(1);
  return `${quien}, ${frase}`;
};

// Lo que Brío responde cuando la IA no se llama. Escrito a mano, palabra por
// palabra, porque es lo único que la persona va a leer en el peor momento.
//
// Estos textos pasan de dos frases a propósito, y es la única excepción a la
// regla de voz en toda la app. La regla existe para que el coach no sermonee;
// recortar aquí significaría dejar fuera el número de teléfono, y eso sería
// obedecer el manual de estilo en contra de la persona.
export function respuestaDeRiesgo(nivel, nombre) {
  if (nivel === 'ideacion' || nivel === 'autolesion') {
    return (
      `${abre(nombre, 'gracias por contarme esto')}. Lo que sientes es real y no tienes que ` +
      `sostenerlo a solas. Si la idea de hacerte daño está ahí ahora mismo, marca la línea ` +
      `${LINEAS.bogota} si estás en Bogotá, o la línea nacional ${LINEAS.nacional} opción ` +
      `${LINEAS.opcion} desde cualquier parte del país. Del otro lado hay alguien que sabe ` +
      `escuchar justo esto. No te prometo que una llamada lo arregle todo, pero decirlo en ` +
      `voz alta, ahí o con alguien de confianza, pesa menos que guardártelo. Hoy no te pido ` +
      `nada más.`
    );
  }

  if (nivel === 'alimentario') {
    return (
      `${abre(nombre, 'te leo, y esto te lo digo de frente')}. Lo que me cuentas sobre la ` +
      `comida no lo puedo acompañar por mi cuenta, y no voy a opinar sobre tu cuerpo ni ` +
      `sobre lo que comes. Busca a un profesional de la salud que trabaje justo esta parte, ` +
      `que los hay y saben cómo acompañar esto. En Colombia la línea ${LINEAS.nacional} ` +
      `opción ${LINEAS.opcion} te orienta sobre dónde acudir, y contárselo a alguien de ` +
      `confianza también sirve. Aquí sigo para lo demás, cuando quieras.`
    );
  }

  if (nivel === 'dolor') {
    return (
      `${abre(nombre, 'hoy paramos')}. Un dolor así no se entrena por encima, y no soy quien ` +
      `para decirte qué te pasa. Deja que lo mire un profesional de la salud antes de volver. ` +
      `Cuando te digan que ya puedes, retomamos desde donde estés y sin apuro.`
    );
  }

  // Desánimo y todo lo demás lo contesta la IA. Devolver un texto aquí sería
  // ponerle una respuesta enlatada a quien vino a hablar con alguien.
  return null;
}

// Lo que se le añade al prompt cuando hay desánimo. Va al final de la
// instrucción, que es lo último que lee el modelo y lo que más le pesa.
export function notaDeRiesgo(nivel) {
  if (nivel !== 'desanimo') return '';

  return `

## Nota para esta respuesta
La persona está escribiendo desde un día emocional malo.
Valida primero lo que siente, con calma y sin apurarla.
No le pidas nada, no le propongas rutina y no le pongas metas.
Si acaso, deja abierta la versión mínima del reto por si la quiere.`;
}
