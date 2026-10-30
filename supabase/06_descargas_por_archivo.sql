-- =====================================================================
-- Vértice Lab · Descargas autorizadas por archivo (ya aplicado en Supabase)
-- La descarga se habilita por la ruta exacta guardada en productos.archivo,
-- así la carpeta del bucket "ebooks" puede tener cualquier nombre.
-- Si subís un PDF nuevo, copiá su ruta exacta (carpeta/archivo) en productos.archivo.
-- =====================================================================

drop policy if exists "Descargar ebooks comprados" on storage.objects;
create policy "Descargar ebooks comprados"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'ebooks'
    and exists (
      select 1 from public.productos p
      where p.archivo = storage.objects.name
        and p.activo = true
        and public.tiene_acceso(p.slug)
    )
  );
