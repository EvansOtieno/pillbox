-- Afya Corner: product and category images.
-- Supabase Storage keeps file metadata in storage.objects, so file permissions are RLS policies too.
-- A public bucket serves files by URL without a key; writes still go through these policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

-- Listing/upserting through the API needs SELECT; public URLs don't.
create policy "staff list product images" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_staff()));

create policy "staff upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_staff()));

create policy "staff replace product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_staff()))
  with check (bucket_id = 'product-images' and (select public.is_staff()));

create policy "staff delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_staff()));
