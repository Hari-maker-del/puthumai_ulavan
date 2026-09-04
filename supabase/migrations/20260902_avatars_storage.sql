-- Create the avatars storage bucket for profile pictures
-- This bucket stores one avatar per user at {user_id}/avatar.{ext}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,                              -- public so avatar URLs work without signed URLs
  2097152,                           -- 2 MB limit matches the frontend validation
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Users can upload / replace their own avatar
create policy "avatars_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read avatars (bucket is public)
create policy "avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');
