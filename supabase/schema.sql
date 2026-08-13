-- Brío — modelo de datos.
-- Pegar completo en el SQL Editor de Supabase y ejecutar una sola vez.
-- Antes de esto, activa el acceso anónimo:
--   Authentication > Sign In / Providers > Anonymous sign-ins > On

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text,
  edad int,
  peso numeric,
  estatura numeric,
  objetivo text,
  porque text,
  lugar text,
  tiempo_min int,
  hora_recordatorio time,
  nivel text default 'inicio',
  racha_actual int default 0,
  mejor_racha int default 0,
  push_token text,
  creado_en timestamptz default now()
);

create table planes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  semana int not null,
  plan jsonb not null,
  cumplimiento numeric default 0,
  creado_en timestamptz default now()
);

create table registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  fecha date not null default current_date,
  completado boolean default false,
  reto text,
  unique (user_id, fecha)
);

create table diario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  fecha date default current_date,
  texto text not null
);

create table mensajes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  rol text check (rol in ('user','brio')),
  texto text not null,
  creado_en timestamptz default now()
);

alter table profiles enable row level security;
alter table planes enable row level security;
alter table registros enable row level security;
alter table diario enable row level security;
alter table mensajes enable row level security;

create policy "propio perfil" on profiles for all using (auth.uid() = id);
create policy "propios planes" on planes for all using (auth.uid() = user_id);
create policy "propios registros" on registros for all using (auth.uid() = user_id);
create policy "propio diario" on diario for all using (auth.uid() = user_id);
create policy "propios mensajes" on mensajes for all using (auth.uid() = user_id);
