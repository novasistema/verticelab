-- =====================================================================
-- Vértice Lab · Base de datos de la plataforma
-- Pegar completo en Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar más de una vez sin romper nada.
-- Requiere que ya exista la tabla public.accesos (creada antes).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. ACCESOS (ya existe): solo ajustamos permisos
--    Los visitantes sin sesión no pueden ni leerla.
-- ---------------------------------------------------------------------
revoke all on public.accesos from anon;


-- Función auxiliar: ¿el usuario logueado tiene acceso vigente a este producto?
-- Se usa en las reglas de seguridad de abajo.
create or replace function public.tiene_acceso(p_slug text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.accesos a
    where a.user_id = (select auth.uid())
      and a.app_slug = p_slug
      and a.estado = 'activo'
      and (a.vence_el is null or a.vence_el > now())
  );
$$;


-- ---------------------------------------------------------------------
-- 2. PRODUCTOS: el catálogo que muestra la web
--    Cualquiera puede ver los productos activos. Nadie puede modificarlos
--    desde la web: se editan desde el panel de Supabase (Table Editor).
-- ---------------------------------------------------------------------
create table if not exists public.productos (
  slug text primary key,
  tipo text not null check (tipo in ('app', 'ebook')),
  nombre text not null,
  descripcion text not null default '',
  precio numeric(12, 2),              -- vacío = "Consultar"
  moneda text not null default 'ARS',
  archivo text,                       -- solo ebooks: ruta del PDF en el bucket "ebooks"
  activo boolean not null default true,
  orden integer not null default 100,
  creado_el timestamptz not null default now()
);

alter table public.productos enable row level security;

drop policy if exists "Catálogo público" on public.productos;
create policy "Catálogo público"
  on public.productos
  for select
  to anon, authenticated
  using (activo = true);

revoke insert, update, delete on public.productos from anon, authenticated;
grant select on public.productos to anon, authenticated;

-- Primer producto: Mi Dinero
insert into public.productos (slug, tipo, nombre, descripcion, orden)
values (
  'midinero',
  'app',
  'Mi Dinero',
  'Controlá tus cuentas, ingresos, gastos, presupuestos y metas de ahorro en un solo lugar. Escaneá tickets con IA y mirá a dónde se va tu dinero.',
  10
)
on conflict (slug) do nothing;


-- ---------------------------------------------------------------------
-- 3. DATOS_APP: los datos de cada cliente dentro de cada app
--    Una fila por usuario y por app. Cada usuario solo ve y guarda
--    sus propios datos, y solo en apps a las que tiene acceso vigente.
-- ---------------------------------------------------------------------
create table if not exists public.datos_app (
  user_id uuid not null references auth.users (id) on delete cascade,
  app_slug text not null,
  data jsonb not null default '{}'::jsonb,
  actualizado_el timestamptz not null default now(),
  primary key (user_id, app_slug)
);

alter table public.datos_app enable row level security;

drop policy if exists "Leer mis datos" on public.datos_app;
create policy "Leer mis datos"
  on public.datos_app
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Crear mis datos" on public.datos_app;
create policy "Crear mis datos"
  on public.datos_app
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id and public.tiene_acceso(app_slug));

drop policy if exists "Actualizar mis datos" on public.datos_app;
create policy "Actualizar mis datos"
  on public.datos_app
  for update
  to authenticated
  using ((select auth.uid()) = user_id and public.tiene_acceso(app_slug))
  with check ((select auth.uid()) = user_id and public.tiene_acceso(app_slug));

revoke all on public.datos_app from anon;
revoke delete on public.datos_app from authenticated;
grant select, insert, update on public.datos_app to authenticated;

-- Fecha de actualización automática
create or replace function public.marcar_actualizado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.actualizado_el := now();
  return new;
end;
$$;

drop trigger if exists datos_app_actualizado on public.datos_app;
create trigger datos_app_actualizado
  before update on public.datos_app
  for each row execute function public.marcar_actualizado();


-- ---------------------------------------------------------------------
-- 4. SUSCRIPTORES: emails que deja la gente en "Empezá gratis"
--    Cualquiera puede anotarse, pero nadie puede leer la lista desde la web.
--    La ves vos en Table Editor → suscriptores.
-- ---------------------------------------------------------------------
create table if not exists public.suscriptores (
  id bigint generated always as identity primary key,
  email text not null unique check (char_length(email) between 5 and 254 and email like '%_@_%._%'),
  origen text not null default 'web' check (char_length(origen) <= 40),
  creado_el timestamptz not null default now()
);

alter table public.suscriptores enable row level security;

drop policy if exists "Anotarse" on public.suscriptores;
create policy "Anotarse"
  on public.suscriptores
  for insert
  to anon, authenticated
  with check (true);

revoke all on public.suscriptores from anon, authenticated;
grant insert (email, origen) on public.suscriptores to anon, authenticated;


-- ---------------------------------------------------------------------
-- 5. EBOOKS: carpeta privada para los PDF
--    Cada ebook va dentro de una carpeta con su slug,
--    por ejemplo: ebooks/precios-que-rinden/precios-que-rinden.pdf
--    Solo quien compró ese ebook puede generar el link de descarga.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('ebooks', 'ebooks', false)
on conflict (id) do update set public = false;

drop policy if exists "Descargar ebooks comprados" on storage.objects;
create policy "Descargar ebooks comprados"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'ebooks'
    and public.tiene_acceso((storage.foldername(name))[1])
  );
