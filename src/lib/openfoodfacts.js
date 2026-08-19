// Open Food Facts: la ficha de un producto empacado a partir de su código.
//
// Es una base abierta, gratis y sin llave, mantenida por voluntarios. Eso
// trae dos consecuencias que este archivo asume desde la primera línea: hay
// productos que no están, y el servidor a veces no contesta. Ninguna de las
// dos puede romper una pantalla, así que aquí nada lanza: se devuelve un
// estado y quien llama decide qué enseñar.
//
// La interpretación de lo que llega —el semáforo y qué sumarle— vive en
// services/producto.js. Aquí solo se pide y se entrega tal cual.

const BASE = 'https://world.openfoodfacts.org/api/v2/product';

// Solo los campos que services/producto.js mira.
//
// La ficha completa de un producto pasa del centenar de kilobytes y trae
// docenas de cifras que esta app no puede mostrar. No pedirlas es más rápido
// con mala señal y, sobre todo, es la forma de que ni siquiera estén ahí para
// colarse por accidente en una pantalla.
const CAMPOS = [
  'product_name',
  'product_name_es',
  'generic_name',
  'generic_name_es',
  'abbreviated_product_name',
  'nova_group',
  'nutriscore_grade',
  'nutrient_levels',
  'categories_tags',
].join(',');

// Open Food Facts pide identificarse para poder cortarle a quien abuse. Es de
// buena vecindad con un servicio que nos sale gratis.
const AGENTE = 'Brio/1.0 (app de habitos; https://openfoodfacts.org)';

// Ocho segundos. Quien está de pie en un pasillo del supermercado con el
// teléfono en alto no espera más, y esperar de más se siente como si la app
// se hubiera colgado.
const ESPERA_MS = 8000;

// Devuelve { estado, cuerpo }.
//   'ok'            llegó respuesta; el cuerpo dirá si el producto existe.
//   'sin-red'       no hubo forma de preguntar: señal, tiempo o servidor.
//   'sin-producto'  ni se preguntó, porque el código no servía.
export async function buscarProducto(codigo, { timeoutMs = ESPERA_MS } = {}) {
  if (!codigo) return { estado: 'sin-producto', cuerpo: null };

  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), timeoutMs);

  try {
    const respuesta = await fetch(
      `${BASE}/${encodeURIComponent(codigo)}.json?fields=${CAMPOS}`,
      {
        method: 'GET',
        signal: control.signal,
        headers: { 'User-Agent': AGENTE, Accept: 'application/json' },
      },
    );

    // Un 404 no es un fallo: es que el producto todavía no está en la base.
    // Se devuelve como respuesta buena para que la pantalla lo cuente como
    // tal, con su texto, en vez de culpar a la conexión.
    if (respuesta.status === 404) return { estado: 'ok', cuerpo: { status: 0 } };
    if (!respuesta.ok) return { estado: 'sin-red', cuerpo: null };

    return { estado: 'ok', cuerpo: await respuesta.json() };
  } catch {
    // Se agotó el tiempo, no hay señal o el cuerpo no era JSON legible.
    return { estado: 'sin-red', cuerpo: null };
  } finally {
    clearTimeout(corte);
  }
}
