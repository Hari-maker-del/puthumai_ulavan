create table if not exists public.notification_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 weather boolean not null default true,
 crop boolean not null default true,
 expense boolean not null default true,
 market boolean not null default true,
 schemes boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
drop policy if exists notification_preferences_own on public.notification_preferences;
create policy notification_preferences_own on public.notification_preferences
for all using (user_id=auth.uid()) with check (user_id=auth.uid());
