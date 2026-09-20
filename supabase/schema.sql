-- ============================================================
-- KayPhone OS — Supabase schema
-- Run this once in your project's SQL Editor (Supabase Dashboard
-- → SQL Editor → New query → paste all of this → Run).
-- Safe to re-run: everything is IF NOT EXISTS / OR REPLACE.
-- ============================================================

-- ---------- PROFILES ----------
-- One row per Kay account. Kay ID is the public identity; auth.users.id
-- remains the private UUID used by Row Level Security.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Guest' check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists kay_id text;
alter table public.profiles add column if not exists recovery_email text;
create unique index if not exists profiles_kay_id_unique_idx
  on public.profiles (kay_id) where kay_id is not null;

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
drop policy if exists "users can view their own profile" on public.profiles;
create policy "users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

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
-- Safe to re-run: Supabase errors if a table is already in the publication.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;

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
-- Kay ID auth is required for cloud data. Dashboard → Authentication →
-- Providers → Email: enable password sign-ins and disable Confirm email
-- for the current no-domain/no-email-provider setup. KayPhone maps a
-- public name.kay ID to a hidden Supabase Auth email internally.
-- ============================================================

-- ============================================================
-- KAY SOCIAL: KayBook, KayTok, KayTube, and KayGram
-- Run this section after the profile/auth sections above.
-- ============================================================
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  network text not null check (network in ('kaybook','kaytok','kaytube','kaygram')),
  content text not null check (char_length(content) between 1 and 2000),
  media_url text,
  created_at timestamptz not null default now()
);
create index if not exists social_posts_feed_idx on public.social_posts (network, created_at desc);
alter table public.social_posts enable row level security;
drop policy if exists "signed in users can read social posts" on public.social_posts;
create policy "signed in users can read social posts" on public.social_posts for select using (auth.uid() is not null);
drop policy if exists "users can create their own social posts" on public.social_posts;
create policy "users can create their own social posts" on public.social_posts for insert with check (auth.uid() = author_id);
drop policy if exists "users can edit their own social posts" on public.social_posts;
create policy "users can edit their own social posts" on public.social_posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "users can delete their own social posts" on public.social_posts;
create policy "users can delete their own social posts" on public.social_posts for delete using (auth.uid() = author_id);

create table if not exists public.social_likes (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.social_likes enable row level security;
drop policy if exists "signed in users can read social likes" on public.social_likes;
create policy "signed in users can read social likes" on public.social_likes for select using (auth.uid() is not null);
drop policy if exists "users can like as themselves" on public.social_likes;
create policy "users can like as themselves" on public.social_likes for insert with check (auth.uid() = user_id);
drop policy if exists "users can remove their own likes" on public.social_likes;
create policy "users can remove their own likes" on public.social_likes for delete using (auth.uid() = user_id);

create table if not exists public.social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists social_comments_post_idx on public.social_comments (post_id, created_at);
alter table public.social_comments enable row level security;
drop policy if exists "signed in users can read social comments" on public.social_comments;
create policy "signed in users can read social comments" on public.social_comments for select using (auth.uid() is not null);
drop policy if exists "users can create their own social comments" on public.social_comments;
create policy "users can create their own social comments" on public.social_comments for insert with check (auth.uid() = author_id);
drop policy if exists "users can delete their own social comments" on public.social_comments;
create policy "users can delete their own social comments" on public.social_comments for delete using (auth.uid() = author_id);

create table if not exists public.social_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.social_follows enable row level security;
drop policy if exists "signed in users can read follows" on public.social_follows;
create policy "signed in users can read follows" on public.social_follows for select using (auth.uid() is not null);
drop policy if exists "users can follow as themselves" on public.social_follows;
create policy "users can follow as themselves" on public.social_follows for insert with check (auth.uid() = follower_id);
drop policy if exists "users can unfollow as themselves" on public.social_follows;
create policy "users can unfollow as themselves" on public.social_follows for delete using (auth.uid() = follower_id);

-- Safe to re-run if Realtime is already enabled for any table.
do $$
declare t text;
begin
  foreach t in array array['social_posts','social_likes','social_comments','social_follows'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Public social profile projection: never exposes recovery_email.
drop view if exists public.social_profiles;
create view public.social_profiles as
  select id, kay_id, display_name
  from public.profiles;
grant select on public.social_profiles to authenticated;
