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
