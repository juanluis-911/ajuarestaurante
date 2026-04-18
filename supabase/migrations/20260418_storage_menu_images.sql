-- Bucket público para imágenes de platillos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do nothing;

-- Lectura pública
create policy "Public can view menu images"
  on storage.objects for select
  to public
  using (bucket_id = 'menu-images');

-- Solo usuarios autenticados pueden subir/actualizar/borrar
create policy "Authenticated users can upload menu images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images');

create policy "Authenticated users can update menu images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images');

create policy "Authenticated users can delete menu images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images');
