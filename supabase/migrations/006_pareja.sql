-- Retos en pareja: dos personas que se acompañan en una misma cosa.
--
-- Pegar en el SQL Editor de Supabase, después de schema.sql. Se puede correr
-- dos veces sin romper nada.
--
-- LO QUE NO HAY EN ESTE ESQUEMA, Y ES LO QUE LO DEFINE
-- No hay columna de puntos, ni de posición, ni un contador por persona. El
-- avance del reto es contar las filas de `pareja_aportes`, y esa cuenta no
-- distingue de quién es cada una. `user_id` está ahí por dos razones concretas
-- y ninguna es un marcador: sostiene el "una vez por persona y día" y permite
-- saber que el otro estuvo. La app nunca agrupa por esa columna, y
-- src/services/pareja.js ni siquiera tiene una función que lo haga.
--
-- Tampoco hay nada que registre ausencias. Un "ultimo_visto" acabaría, tarde o
-- temprano, en un "lleva tres días sin aparecer", y eso convierte el
-- acompañamiento en vigilancia.

-- --------------------------------------------------------------------------
-- Tablas
-- --------------------------------------------------------------------------

create table if not exists retos_pareja (
  id uuid primary key default gen_random_uuid(),
  -- Clave del catálogo de src/services/pareja.js ('caminar', 'agua', ...).
  reto text not null,
  -- Meta CONJUNTA. Se copia del catálogo al crear el reto para que cambiarlo
  -- mañana no le mueva la meta a quien ya iba a mitad de camino.
  meta int not null check (meta > 0),
  -- El código de invitación. Se apaga (queda en null) en cuanto entra el
  -- segundo: la puerta se cierra sola. `unique` con nulos permite muchos
  -- retos cerrados y garantiza que un código vivo apunta a uno solo.
  codigo text unique,
  codigo_desde date default current_date,
  creado_por uuid references profiles on delete cascade,
  creado_en timestamptz default now()
);

create table if not exists pareja_miembros (
  reto_id uuid references retos_pareja on delete cascade,
  user_id uuid references profiles on delete cascade,
  entro_en timestamptz default now(),
  primary key (reto_id, user_id)
);

-- Máximo una pareja a la vez. Dos ya es una red social, y una red social es
-- un sitio donde compararse. Al salirse se borra la fila y queda libre.
create unique index if not exists una_pareja_a_la_vez on pareja_miembros (user_id);

create table if not exists pareja_aportes (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid references retos_pareja on delete cascade,
  user_id uuid references profiles on delete cascade,
  fecha date not null default current_date,
  -- Una vez por persona y día: marcar dos veces no infla el reto.
  unique (reto_id, user_id, fecha)
);

create index if not exists pareja_aportes_reto on pareja_aportes (reto_id, fecha desc);

comment on table pareja_aportes is
  'Un aporte por persona y dia. Se cuentan TODOS juntos: el avance es del reto, no de cada quien.';

-- --------------------------------------------------------------------------
-- Quién ve qué
-- --------------------------------------------------------------------------
--
-- El requisito es exacto: las dos personas leen el mismo reto, y nadie más.
-- Escrito de la forma obvia, eso se muerde la cola:
--
--   retos_pareja  se puede ver si soy miembro   -> mira pareja_miembros
--   pareja_miembros  se puede ver si es mi reto -> mira retos_pareja
--
-- Postgres evalúa la política de cada tabla al consultarla, así que una
-- política que consulta la otra tabla dispara la política de la otra tabla, y
-- Supabase responde "infinite recursion detected in policy". Peor todavía:
-- una política de `pareja_miembros` que consulte `pareja_miembros` se muerde
-- la cola ella sola.
--
-- La salida es sacar la pregunta de dentro de RLS. `es_mi_reto` es
-- `security definer`: corre como el dueño de la función, que no pasa por RLS,
-- así que responde sin volver a disparar ninguna política. La función es lo
-- bastante estrecha para que eso no abra nada: recibe un id de reto, lo compara
-- contra el usuario de la sesión y devuelve verdadero o falso. No devuelve
-- filas, no acepta otro usuario y no se puede usar para pescar.
--
-- `set search_path` va fijo a propósito: sin eso, una función definer se puede
-- engañar creando tablas con el mismo nombre en otro esquema.

create or replace function es_mi_reto(p_reto uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from pareja_miembros
    where reto_id = p_reto and user_id = auth.uid()
  );
$$;

alter table retos_pareja enable row level security;
alter table pareja_miembros enable row level security;
alter table pareja_aportes enable row level security;

-- Leer: los dos miembros, y nadie más. Ni siquiera se puede buscar un reto
-- por su código desde el cliente; para eso está `unirse_a_reto`.
drop policy if exists "el reto de los dos" on retos_pareja;
create policy "el reto de los dos" on retos_pareja
  for select using (es_mi_reto(id));

drop policy if exists "quienes estan en mi reto" on pareja_miembros;
create policy "quienes estan en mi reto" on pareja_miembros
  for select using (es_mi_reto(reto_id));

drop policy if exists "los aportes de mi reto" on pareja_aportes;
create policy "los aportes de mi reto" on pareja_aportes
  for select using (es_mi_reto(reto_id));

-- Sumar: solo lo propio, y solo en el reto en el que se está. Nadie puede
-- sumar en nombre de otro, ni siquiera de su pareja.
drop policy if exists "sumo lo mio" on pareja_aportes;
create policy "sumo lo mio" on pareja_aportes
  for insert with check (user_id = auth.uid() and es_mi_reto(reto_id));

-- Salir: en un toque, y solo uno mismo. Sin política de update ni de delete
-- sobre las otras tablas, así que nadie puede sacar a nadie ni cambiarle el
-- reto por debajo.
drop policy if exists "salgo yo" on pareja_miembros;
create policy "salgo yo" on pareja_miembros
  for delete using (user_id = auth.uid());

-- Los aportes no se borran ni se editan: lo que llevan es de los dos, y si
-- alguien se va, lo que hicieron juntos se queda para quien se queda.

-- --------------------------------------------------------------------------
-- Crear y entrar
-- --------------------------------------------------------------------------
--
-- Las dos operaciones pasan por funciones y NO por `insert` directo, porque
-- las dos necesitan hacer algo que el cliente no puede tener permiso de hacer:
--
--   crear   escribir la fila del reto y la primera membresía como una sola
--           cosa. A medias quedaría un reto sin dueño que nadie podría leer.
--   entrar  buscar un reto POR SU CÓDIGO. Si el cliente pudiera hacer ese
--           select, podría probar códigos hasta encontrar uno; aquí solo
--           recibe sí o no, y el reto no aparece si el código no es exacto.

-- Limpia el código igual que normalizarCodigo() en src/services/pareja.js. Un
-- código viaja dictado por teléfono y vuelve con guion, espacios o en
-- minúscula; el servidor no puede confiar en que el cliente ya lo arregló.
create or replace function codigo_limpio(p_codigo text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

create or replace function crear_reto_pareja(p_reto text, p_meta int, p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'sin sesion';
  end if;

  -- Una pareja a la vez: el índice único lo impediría de todos modos, pero
  -- así el error que llega a la app es uno que se puede traducir a la voz de
  -- Brío en vez de un choque de índice.
  if exists (select 1 from pareja_miembros where user_id = auth.uid()) then
    raise exception 'ya tiene reto';
  end if;

  insert into retos_pareja (reto, meta, codigo, creado_por)
  values (p_reto, p_meta, codigo_limpio(p_codigo), auth.uid())
  returning id into v_id;

  insert into pareja_miembros (reto_id, user_id) values (v_id, auth.uid());

  return v_id;
end;
$$;

-- Días que vive una invitación. Es el mismo número que DIAS_INVITACION en
-- src/services/pareja.js, y está en los dos sitios a propósito: el cliente lo
-- explica, el servidor lo obliga.
create or replace function unirse_a_reto(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_desde date;
begin
  if auth.uid() is null then
    raise exception 'sin sesion';
  end if;

  if exists (select 1 from pareja_miembros where user_id = auth.uid()) then
    raise exception 'ya tiene reto';
  end if;

  -- `for update` bloquea la fila del reto mientras se decide. Sin eso, dos
  -- personas que peguen el código en el mismo segundo pasan las dos la
  -- comprobación de "¿ya son dos?" antes de que ninguna haya entrado, y el
  -- reto acaba con tres. Con el bloqueo, la segunda espera y se encuentra el
  -- código ya apagado.
  --
  -- La vigencia se mira DESPUÉS y no dentro del where a propósito. Metida en
  -- el filtro, un código vencido y uno inventado devuelven los dos cero filas
  -- y el único error posible es "no existe": el cliente tiene el buen mensaje
  -- ("Ese código ya venció. Pídele uno nuevo y seguimos.") y jamás podría
  -- mostrarlo. Quien pega un código bueno pero viejo merece que le digan que
  -- pida otro, no que le insinúen que lo escribió mal.
  select id, codigo_desde into v_id, v_desde
  from retos_pareja
  where codigo = codigo_limpio(p_codigo)
  for update;

  if v_id is null then
    raise exception 'codigo no valido';
  end if;

  if v_desde is null or v_desde < current_date - 7 then
    raise exception 'codigo vencido';
  end if;

  -- Dos y no más.
  if (select count(*) from pareja_miembros where reto_id = v_id) >= 2 then
    raise exception 'reto lleno';
  end if;

  insert into pareja_miembros (reto_id, user_id) values (v_id, auth.uid());
  update retos_pareja set codigo = null where id = v_id;

  return v_id;
end;
$$;

-- Un código nuevo cuando el anterior venció, o para volver a invitar después
-- de que alguien se fue. Solo puede pedirlo quien está en el reto, y solo si
-- hay sitio: renovar no reabre un reto que ya tiene a dos.
create or replace function renovar_codigo_pareja(p_reto uuid, p_codigo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not es_mi_reto(p_reto) then
    raise exception 'no es tu reto';
  end if;

  if (select count(*) from pareja_miembros where reto_id = p_reto) >= 2 then
    raise exception 'reto lleno';
  end if;

  update retos_pareja
  set codigo = codigo_limpio(p_codigo), codigo_desde = current_date
  where id = p_reto;
end;
$$;

-- Cuando se va la última persona, el reto se va con ella. Un reto sin nadie
-- dentro no lo puede leer ni borrar nadie: sería basura invisible para
-- siempre, con un código ocupando el índice único.
create or replace function limpiar_reto_vacio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from retos_pareja r
  where r.id = old.reto_id
    and not exists (select 1 from pareja_miembros m where m.reto_id = r.id);
  return old;
end;
$$;

drop trigger if exists pareja_sin_nadie on pareja_miembros;
create trigger pareja_sin_nadie
  after delete on pareja_miembros
  for each row execute function limpiar_reto_vacio();

-- Las funciones definer las llama la app con la sesión de la persona; el rol
-- anónimo (sin entrar) no tiene nada que hacer aquí.
revoke all on function es_mi_reto(uuid) from public;
revoke all on function crear_reto_pareja(text, int, text) from public;
revoke all on function unirse_a_reto(text) from public;
revoke all on function renovar_codigo_pareja(uuid, text) from public;

grant execute on function es_mi_reto(uuid) to authenticated;
grant execute on function crear_reto_pareja(text, int, text) to authenticated;
grant execute on function unirse_a_reto(text) to authenticated;
grant execute on function renovar_codigo_pareja(uuid, text) to authenticated;
