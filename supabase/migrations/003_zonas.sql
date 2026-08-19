-- Zonas del cuerpo que la persona quiere trabajar.
--
-- Va como lista de texto y NO como columnas sueltas: mañana entra "cuello" o
-- sale "hombros" y la tabla no se toca.
--
-- Vacío significa "el cuerpo entero", que es lo correcto por defecto: quien
-- no elige nada no está pidiendo un plan de brazos, está pidiendo un plan.
--
-- Pegar en el SQL Editor de Supabase. Se puede correr dos veces sin romper.

alter table profiles
  add column if not exists zonas text[] default '{}';

comment on column profiles.zonas is
  'Zonas que la persona quiere trabajar. Vacio = cuerpo entero. Solo filtra los ejercicios de fuerza.';
