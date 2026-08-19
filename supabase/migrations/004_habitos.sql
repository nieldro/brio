-- Hábitos: los que la persona lleva, y los días que los hizo.
--
-- Van en dos sitios distintos a propósito:
--   profiles.habitos   qué lleva ahora mismo. Cambia poco, y es parte de
--                      quién es la persona hoy.
--   habitos_hechos     qué hizo cada día. Solo crece, nunca se reescribe.
--
-- No hay columna de racha, y no la va a haber. Una racha por hábito son tres
-- contadores que se pueden poner en cero el mismo día, y para quien ya
-- abandonó otras apps eso es la puerta de salida.
--
-- Pegar en el SQL Editor de Supabase. Se puede correr dos veces sin romper.

alter table profiles
  add column if not exists habitos text[] default '{}';

comment on column profiles.habitos is
  'Hasta tres claves de hábitos que la persona lleva ahora. Ver src/data/habitos.js';

create table if not exists habitos_hechos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  habito text not null,
  fecha date not null default current_date,
  unique (user_id, habito, fecha)
);

alter table habitos_hechos enable row level security;

drop policy if exists "propios habitos" on habitos_hechos;
create policy "propios habitos" on habitos_hechos
  for all using (auth.uid() = user_id);
