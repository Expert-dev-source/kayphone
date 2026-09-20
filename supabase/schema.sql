-- ============================================================
-- KayPhone OS — Supabase schema
-- Run this once in your project's SQL Editor (Supabase Dashboard
-- → SQL Editor → New query → paste all of this → Run).
-- Safe to re-run: everything is IF NOT EXISTS / OR REPLACE.
-- ============================================================

-- ---------- PROFILES ----------
-- One row per visitor (anonymous auth user). Holds the display
-- name shown in chat. Row is created client-side on first launch.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Guest' check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------- CONVERSATIONS (Messages app) ----------
-- A conversation is a named room. Anyone with the room code
-- (or picked from the public list) can join and chat — this is
-- what makes Messages a genuine 2-way chat: open the site in two
-- tabs/devices, join the same room name, and messages sync live.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name ~ '^[a-z0-9_-]{1,60}$'),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

drop policy if exists "conversations are viewable by everyone" on public.conversations;
create policy "conversations are viewable by everyone"
  on public.conversations for select
  using (true);

drop policy if exists "authenticated users can create conversations" on public.conversations;
create policy "authenticated users can create conversations"
  on public.conversations for insert
  with check (auth.uid() is not null);

-- ---------- MESSAGES ----------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  sender_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages are viewable by everyone" on public.messages;
create policy "messages are viewable by everyone"
  on public.messages for select
  using (true);

drop policy if exists "users can send messages as themselves" on public.messages;
create policy "users can send messages as themselves"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Enable Realtime so chat updates arrive live without polling.
alter publication supabase_realtime add table public.messages;

-- ---------- NOTES ----------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  body text not null default '',
  pinned boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

drop policy if exists "users manage their own notes" on public.notes;
create policy "users manage their own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- REMINDERS ----------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reminders enable row level security;

drop policy if exists "users manage their own reminders" on public.reminders;
create policy "users manage their own reminders"
  on public.reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- CALENDAR EVENTS ----------
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  event_date date not null,
  event_time text not null default 'All Day',
  created_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;

drop policy if exists "users manage their own events" on public.calendar_events;
create policy "users manage their own events"
  on public.calendar_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- VOICE MEMOS (metadata; audio itself lives in Storage) ----------
create table if not exists public.voice_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  name text not null,
  duration_seconds numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.voice_memos enable row level security;

drop policy if exists "users manage their own voice memos" on public.voice_memos;
create policy "users manage their own voice memos"
  on public.voice_memos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- Run these, then set the policies below. Buckets are private —
-- access is enforced per-user via the folder-name-equals-uid rule,
-- same pattern as the row-level tables above.
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('photos', 'photos', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('voice-memos', 'voice-memos', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('files', 'files', false)
  on conflict (id) do nothing;

-- Each user may only read/write objects under a folder named
-- after their own auth.uid(), e.g. photos/<uid>/2026-08-15.jpg
drop policy if exists "users manage their own photos" on storage.objects;
create policy "users manage their own photos"
  on storage.objects for all
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users manage their own voice memo files" on storage.objects;
create policy "users manage their own voice memo files"
  on storage.objects for all
  using (bucket_id = 'voice-memos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'voice-memos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users manage their own generic files" on storage.objects;
create policy "users manage their own generic files"
  on storage.objects for all
  using (bucket_id = 'files' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'files' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Anonymous auth must be enabled: Dashboard → Authentication →
-- Providers → Anonymous Sign-Ins → Enable.
-- This gives every visitor a real auth.uid() (no email/password
-- friction) so RLS above has something to key off of, and their
-- Notes/Reminders/Calendar/Photos persist across visits on the
-- same browser via the session Supabase stores locally.
-- ============================================================
