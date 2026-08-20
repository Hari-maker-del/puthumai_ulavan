-- AI conversation threads: keeps the existing ai_conversations table and adds grouping metadata.
alter table public.ai_conversations
  add column if not exists conversation_id uuid,
  add column if not exists title text;

update public.ai_conversations
set conversation_id = id
where conversation_id is null;

alter table public.ai_conversations
  alter column conversation_id set default gen_random_uuid();

alter table public.ai_conversations
  alter column conversation_id set not null;

create index if not exists ai_conversations_thread_idx
  on public.ai_conversations(user_id, conversation_id, created_at);
