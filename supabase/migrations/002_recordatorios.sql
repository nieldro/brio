-- Brío — fase 6. Ejecutar DESPUÉS de schema.sql, en el SQL Editor de Supabase.
--
-- El modelo del documento no tenía dónde guardar la zona horaria ni cuántos
-- recordatorios se enviaron hoy. Sin eso no se puede cumplir la regla dura
-- "máximo 2 notificaciones al día, a la hora que el usuario eligió":
-- `hora_recordatorio` es una hora local y el servidor vive en UTC.

alter table profiles add column if not exists zona_horaria text default 'America/Bogota';
alter table profiles add column if not exists recordatorios_fecha date;
alter table profiles add column if not exists recordatorios_enviados int default 0;

-- Índices para las consultas que hacen la app y las Azure Functions.
create index if not exists registros_usuario_fecha on registros (user_id, fecha desc);
create index if not exists mensajes_usuario_creado on mensajes (user_id, creado_en desc);
create index if not exists planes_usuario_semana on planes (user_id, semana desc);

-- El Timer Trigger recorre solo a quien pueda recibir push.
create index if not exists profiles_con_push on profiles (hora_recordatorio)
  where push_token is not null;
