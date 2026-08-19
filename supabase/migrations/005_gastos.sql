-- Gastos y presupuesto.
--
-- Van en dos sitios distintos a propósito:
--   gastos        lo que pasó. Solo crece, y cada fila es un hecho suelto.
--   presupuestos  el tope que la persona se puso. Una fila por persona,
--                 porque es una decisión suya de ahora, no un historial.
--
-- NO HAY COLUMNA DE PUNTAJE, Y NO LA VA A HABER.
-- El semáforo del mes se calcula al vuelo en src/services/presupuesto.js y se
-- muere en la pantalla. Guardar "este mes fue rojo" es guardar un juicio, y un
-- juicio guardado se acaba mostrando en una lista de meses buenos y malos. El
-- dinero avergüenza más que la comida: aquí se anota lo que pasó y ya.
--
-- Tampoco hay tabla de facturas ni de fotos. La foto de una tirilla lleva
-- dónde estuvo la persona y a qué hora; se lee, se muestra y se va con la app.
--
-- Pegar en el SQL Editor de Supabase. Se puede correr dos veces sin romper.

-- El id es TEXT y lo pone la app ('g-1', 'g-2'...), no la base.
--
-- Es lo que permite anotar un gasto en un bus sin señal y borrarlo después sin
-- haber hablado nunca con el servidor. Con `uuid default gen_random_uuid()`
-- Postgres rechazaba 'g-1' y ningún gasto llegaba jamás a la nube.
--
-- Y la llave va con el user_id delante: 'g-1' es único DENTRO de una persona,
-- no en toda la tabla. Sin el par, el primer gasto del segundo usuario chocaba
-- con el del primero.
create table if not exists gastos (
  id text not null,
  user_id uuid not null references profiles on delete cascade,
  fecha date not null default current_date,
  monto numeric not null check (monto > 0),
  categoria text not null default 'otros'
    check (categoria in ('mercado','transporte','casa','salud','ocio','antojos','suscripciones','otros')),
  nota text,
  recurrente boolean default false,
  creado_en timestamptz default now(),
  primary key (user_id, id)
);

comment on column gastos.categoria is
  'Una de las ocho de src/services/gastos.js. Lo que no encaje entra en otros.';

comment on column gastos.recurrente is
  'Suscripción o cobro fijo. Sirve para no releerlo cada mes, no para señalarlo.';

-- En plural, como el resto del esquema y como la lee src/lib/repositorio.js.
-- En singular, guardar el tope devolvía error y la cola reintentaba para
-- siempre sin que nadie lo viera.
create table if not exists presupuestos (
  user_id uuid primary key references profiles on delete cascade,
  mensual numeric check (mensual is null or mensual > 0),
  por_categoria jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz default now()
);

comment on column presupuestos.mensual is
  'Opcional. Nulo significa sin tope, y sin tope no hay semáforo: no se le inventa una raya a nadie.';

alter table gastos enable row level security;
alter table presupuestos enable row level security;

drop policy if exists "propios gastos" on gastos;
create policy "propios gastos" on gastos
  for all using (auth.uid() = user_id);

drop policy if exists "propio presupuesto" on presupuestos;
create policy "propio presupuesto" on presupuestos
  for all using (auth.uid() = user_id);

-- La pantalla siempre pide un mes entero, del más nuevo al más viejo.
create index if not exists gastos_usuario_fecha on gastos (user_id, fecha desc);
