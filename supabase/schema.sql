-- ===========================================================================
-- Street Stumps — Supabase schema
-- Run this once in your project: Supabase Dashboard → SQL Editor → New query →
-- paste → Run. Safe to re-run (idempotent).
-- ===========================================================================

-- --- Games: matches + competitions, completed or in-progress -----------------
create table if not exists public.games (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('match', 'series', 'tournament')),
  status     text not null default 'completed'
               check (status in ('completed', 'in_progress')),
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists games_user_idx
  on public.games (user_id, updated_at desc);

alter table public.games enable row level security;

drop policy if exists "Users manage their own games" on public.games;
create policy "Users manage their own games"
  on public.games for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Accepted friends may READ each other's games (live-score sharing). This is a
-- second permissive policy, so it only widens SELECT; only the owner can write.
drop policy if exists "Friends can watch games" on public.games;
create policy "Friends can watch games"
  on public.games for select
  using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ( (f.requester_id = auth.uid() and f.addressee_id = games.user_id)
           or (f.addressee_id = auth.uid() and f.requester_id = games.user_id) )
    )
  );

-- Realtime so watchers get ball-by-ball updates as the owner auto-saves.
alter table public.games replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'games'
  ) then
    alter publication supabase_realtime add table public.games;
  end if;
end $$;

-- --- Profiles: the account's own player identity (one per user) ---------------
-- Created at onboarding right after signup. This is the user's "self" player
-- (name + batting/bowling) and the identity the friends feature will build on.
create table if not exists public.profiles (
  user_id       uuid primary key
                  references auth.users (id) on delete cascade,
  name          text not null,
  batting_hand  text not null default 'right',
  bowling_style text not null default 'Right-arm fast',
  avatar        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Added after launch: the chosen built-in profile picture id (null = initials).
alter table public.profiles add column if not exists avatar text;

alter table public.profiles enable row level security;

drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --- Players: personal roster -------------------------------------------------
create table if not exists public.players (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid()
                  references auth.users (id) on delete cascade,
  name          text not null,
  batting_hand  text not null default 'right',
  bowling_style text not null default 'Right-arm fast',
  created_at    timestamptz not null default now()
);

create index if not exists players_user_idx
  on public.players (user_id, created_at);

alter table public.players enable row level security;

drop policy if exists "Users manage their own players" on public.players;
create policy "Users manage their own players"
  on public.players for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --- Friendships: request → accept model -------------------------------------
-- A single row per relationship. `requester_id` sends the request; once the
-- `addressee_id` accepts, status flips to 'accepted' and they are mutual
-- friends (each sees the other in their friends list). The old one-directional
-- `friends` table is replaced by this.
drop table if exists public.friends cascade;

create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid()
                 references auth.users (id) on delete cascade,
  addressee_id uuid not null
                 references auth.users (id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, addressee_id),
  check (requester_id != addressee_id)
);

create index if not exists friendships_addressee_idx
  on public.friendships (addressee_id, status);
create index if not exists friendships_requester_idx
  on public.friendships (requester_id, status);

alter table public.friendships enable row level security;

drop policy if exists "See friendships involving me" on public.friendships;
create policy "See friendships involving me"
  on public.friendships for select
  using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "Create my own requests" on public.friendships;
create policy "Create my own requests"
  on public.friendships for insert
  with check (requester_id = auth.uid());

drop policy if exists "Recipient updates status" on public.friendships;
create policy "Recipient updates status"
  on public.friendships for update
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid());

drop policy if exists "Either party removes" on public.friendships;
create policy "Either party removes"
  on public.friendships for delete
  using (auth.uid() in (requester_id, addressee_id));

-- Realtime: stream friendship changes to the client (RLS still applies, so each
-- user only receives events for rows that involve them). REPLICA IDENTITY FULL
-- ensures DELETE/UPDATE events carry the old row for RLS + filtering.
alter table public.friendships replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where  pubname = 'supabase_realtime'
      and  schemaname = 'public'
      and  tablename = 'friendships'
  ) then
    alter publication supabase_realtime add table public.friendships;
  end if;
end $$;

-- --- Helper functions (security definer — can read auth.users / cross-user) ---

-- Find another user by email + my relationship to them (used for friend search).
-- status ∈ 'none' | 'outgoing' (I asked) | 'incoming' (they asked) | 'friends'.
-- (Dropped first because the return signature gained a `status` column — Postgres
--  won't let `create or replace` change an existing function's return type.)
drop function if exists public.find_profile_by_email(text);
create or replace function public.find_profile_by_email(lookup_email text)
returns table (
  user_id       uuid,
  name          text,
  batting_hand  text,
  bowling_style text,
  status        text
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  select p.user_id, p.name, p.batting_hand, p.bowling_style,
         case
           when f.status = 'accepted' then 'friends'
           when f.status = 'pending' and f.requester_id = auth.uid() then 'outgoing'
           when f.status = 'pending' then 'incoming'
           else 'none'
         end as status
  from   public.profiles p
  join   auth.users u on u.id = p.user_id
  left   join public.friendships f
         on (f.requester_id = auth.uid() and f.addressee_id = p.user_id)
         or (f.addressee_id = auth.uid() and f.requester_id = p.user_id)
  where  lower(u.email) = lower(lookup_email)
    and  p.user_id != auth.uid();
end;
$$;

-- Send a friend request. If the other person already requested me, this
-- accepts their request instead (so a mutual ask resolves to friends).
-- Returns 'requested' | 'accepted' | 'outgoing' | 'friends'.
create or replace function public.send_friend_request(addressee uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  me       uuid := auth.uid();
  existing public.friendships;
begin
  if addressee = me then
    raise exception 'cannot friend yourself';
  end if;

  select * into existing from public.friendships
   where (requester_id = me and addressee_id = addressee)
      or (requester_id = addressee and addressee_id = me)
   limit 1;

  if found then
    if existing.status = 'accepted' then
      return 'friends';
    elsif existing.requester_id = addressee then
      update public.friendships
         set status = 'accepted', responded_at = now()
       where id = existing.id;
      return 'accepted';
    else
      return 'outgoing';
    end if;
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (me, addressee, 'pending');
  return 'requested';
end;
$$;

-- Incoming pending requests, joined with the requester's profile.
create or replace function public.get_friend_requests()
returns table (
  request_id    uuid,
  user_id       uuid,
  name          text,
  batting_hand  text,
  bowling_style text,
  created_at    timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  select f.id, p.user_id, p.name, p.batting_hand, p.bowling_style, f.created_at
  from   public.friendships f
  join   public.profiles p on p.user_id = f.requester_id
  where  f.addressee_id = auth.uid()
    and  f.status = 'pending'
  order  by f.created_at desc;
end;
$$;

-- Accept an incoming request from a given user.
create or replace function public.accept_friend_request(other_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.friendships
     set status = 'accepted', responded_at = now()
   where addressee_id = auth.uid()
     and requester_id = other_id
     and status = 'pending';
end;
$$;

-- Remove any relationship between me and another user. Covers unfriend,
-- decline-incoming, and cancel-outgoing — all are "delete the row".
create or replace function public.remove_friendship(other_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare me uuid := auth.uid();
begin
  delete from public.friendships
   where (requester_id = me and addressee_id = other_id)
      or (requester_id = other_id and addressee_id = me);
end;
$$;

-- The current user's accepted friends (either direction), with their profile.
create or replace function public.get_my_friends()
returns table (
  friend_id     uuid,
  name          text,
  batting_hand  text,
  bowling_style text,
  added_at      timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  select p.user_id, p.name, p.batting_hand, p.bowling_style,
         coalesce(f.responded_at, f.created_at)
  from   public.friendships f
  join   public.profiles p
         on p.user_id = case when f.requester_id = auth.uid()
                             then f.addressee_id else f.requester_id end
  where  f.status = 'accepted'
    and  auth.uid() in (f.requester_id, f.addressee_id)
  order  by coalesce(f.responded_at, f.created_at) desc;
end;
$$;

-- Accepted friends' currently-live games (in-progress, updated recently), with
-- the owner's name + the game data so the client can render a live scorecard.
create or replace function public.get_friends_live_games()
returns table (
  game_id    uuid,
  owner_id   uuid,
  owner_name text,
  kind       text,
  data       jsonb,
  updated_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  select g.id, g.user_id, p.name, g.kind, g.data, g.updated_at
  from   public.games g
  join   public.profiles p on p.user_id = g.user_id
  join   public.friendships f
         on f.status = 'accepted'
        and ( (f.requester_id = auth.uid() and f.addressee_id = g.user_id)
           or (f.addressee_id = auth.uid() and f.requester_id = g.user_id) )
  where  g.status = 'in_progress'
    and  g.updated_at > now() - interval '3 hours'
  order  by g.updated_at desc;
end;
$$;
