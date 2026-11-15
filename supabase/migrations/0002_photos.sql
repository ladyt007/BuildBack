-- Photos: profile pictures and business galleries.
-- Run after 0001_initial_schema.sql (SQL Editor -> New query -> paste -> Run).

alter table public.profiles add column avatar_url text;
alter table public.businesses add column photos text[] not null default '{}'
  check (cardinality(photos) <= 6);

grant update (avatar_url) on public.profiles to authenticated;
grant insert (photos), update (photos) on public.businesses to authenticated;

-- Public bucket: anyone can view photos, people can only add or change files in their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Members upload to their own photo folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Members update their own photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Members delete their own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
