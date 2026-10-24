-- ============================================================================
-- SURVIVOR / LAST MAN STANDING GAME
-- ============================================================================
-- Run this whole file once in the Supabase SQL Editor.
--
-- How the game works:
--   1. Admin creates a POOL (entry fee, rake %, entries/user) and opens it.
--   2. Players join by paying the entry fee (debited from `wallets` atomically).
--   3. Admin creates ROUNDS (gameweeks) with MATCHES inside each round.
--   4. Each surviving entry picks ONE team per round to WIN (no repeats of
--      the same team within a pool). Picks can be changed until the round
--      deadline. Only HOME / AWAY picks — a draw eliminates you.
--   5. Admin enters scores per match (outcome HOME/DRAW/AWAY), then settles
--      the round: losing picks + no-shows are eliminated. If EVERY remaining
--      player loses in the same round, everyone survives (all-survive rule).
--      Settlement refuses to run while any fixture is still pending —
--      finish or void every match first (void = picks graded PUSH, safe).
--   6. When one entry remains (or admin forces a split), the pot is paid:
--      prize = total collected * (1 - rake_pct/100), credited to `wallets`.
--      The rake stays with the platform.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

create table if not exists public.survivor_pools (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  entry_fee            numeric(12,2) not null default 100 check (entry_fee >= 0),
  rake_pct             numeric(5,2)  not null default 15  check (rake_pct between 0 and 50),
  max_entries_per_user int           not null default 1   check (max_entries_per_user between 1 and 5),
  status               text not null default 'draft'
                       check (status in ('draft','open','closed','settled')),
  closes_at            timestamptz,            -- entry deadline (nullable = open until closed manually)
  created_at           timestamptz not null default now()
);

create table if not exists public.survivor_rounds (
  id           uuid primary key default gen_random_uuid(),
  pool_id      uuid not null references public.survivor_pools(id) on delete cascade,
  round_number int  not null,
  closes_at    timestamptz not null,             -- pick deadline for this round
  status       text not null default 'open' check (status in ('open','closed','settled')),
  created_at   timestamptz not null default now(),
  unique (pool_id, round_number)
);

create table if not exists public.survivor_round_matches (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references public.survivor_rounds(id) on delete cascade,
  event_id   bigint,                              -- optional external (bzzoiro) event id
  home_team  text not null,
  away_team  text not null,
  match_time timestamptz,
  home_score int,
  away_score int,
  outcome    text check (outcome in ('HOME','DRAW','AWAY')),
  status     text not null default 'pending' check (status in ('pending','finished','void'))
);

create table if not exists public.survivor_players (
  id               uuid primary key default gen_random_uuid(),
  pool_id          uuid not null references public.survivor_pools(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  entry_number     int    not null default 1,
  entry_fee        numeric(12,2) not null,
  reference        text,                          -- audit ref (svy_<pool>_<user>_<ts>)
  alive            boolean not null default true,
  eliminated_round int,
  created_at       timestamptz not null default now(),
  unique (pool_id, user_id, entry_number)
);

create table if not exists public.survivor_picks (
  id         uuid primary key default gen_random_uuid(),
  pool_id    uuid not null references public.survivor_pools(id) on delete cascade,
  round_id   uuid not null references public.survivor_rounds(id) on delete cascade,
  player_id  uuid not null references public.survivor_players(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  match_id   uuid not null references public.survivor_round_matches(id) on delete cascade,
  selection  text not null check (selection in ('HOME','AWAY')),
  team_name  text not null,                       -- derived from match + selection server-side
  result     text check (result in ('WON','LOST','PUSH')),
  created_at timestamptz not null default now(),
  unique (player_id, round_id),                    -- one pick per entry per round (upsert allowed)
  unique (player_id, team_name)                    -- NO-REPEAT RULE within a pool
);

create index if not exists idx_survivor_rounds_pool    on public.survivor_rounds (pool_id, round_number);
create index if not exists idx_survivor_matches_round  on public.survivor_round_matches (round_id);
create index if not exists idx_survivor_players_pool   on public.survivor_players (pool_id, alive);
create index if not exists idx_survivor_players_user   on public.survivor_players (user_id);
create index if not exists idx_survivor_picks_round    on public.survivor_picks (round_id);
create index if not exists idx_survivor_picks_player   on public.survivor_picks (player_id);
create index if not exists idx_survivor_picks_pool     on public.survivor_picks (pool_id);

-- ----------------------------------------------------------------------------
-- 2. HELPERS
-- ----------------------------------------------------------------------------

-- Admin check used by settlement RPCs and RLS write policies.
-- Mirrors ProtectedAdmin (requiredRole="admin"); 'superadmin' accepted too.
create or replace function public.survivor_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','superadmin')
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC: join_survivor_pool
-- Atomically debits the entry fee and creates the player entry.
-- Returns: SUCCESS | NOT_AUTHENTICATED | POOL_NOT_FOUND | POOL_NOT_OPEN |
--          POOL_CLOSED | MAX_ENTRIES_REACHED | INSUFFICIENT_BALANCE |
--          WALLET_NOT_FOUND
-- ----------------------------------------------------------------------------
create or replace function public.join_survivor_pool(p_pool_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user       uuid := auth.uid();
  v_pool       public.survivor_pools;
  v_entry_count int;
begin
  if v_user is null then
    return 'NOT_AUTHENTICATED';
  end if;

  select * into v_pool from public.survivor_pools where id = p_pool_id;
  if v_pool.id is null then
    return 'POOL_NOT_FOUND';
  end if;

  if v_pool.status <> 'open' then
    return 'POOL_NOT_OPEN';
  end if;

  if v_pool.closes_at is not null and now() > v_pool.closes_at then
    return 'POOL_CLOSED';
  end if;

  select count(*) into v_entry_count
    from public.survivor_players
   where pool_id = p_pool_id and user_id = v_user;

  if v_entry_count >= v_pool.max_entries_per_user then
    return 'MAX_ENTRIES_REACHED';
  end if;

  -- Atomic debit: only succeeds if the balance covers the fee
  update public.wallets
     set balance = balance - v_pool.entry_fee
   where user_id = v_user
     and balance >= v_pool.entry_fee;

  if not found then
    if exists (select 1 from public.wallets where user_id = v_user) then
      return 'INSUFFICIENT_BALANCE';
    end if;
    return 'WALLET_NOT_FOUND';
  end if;

  begin
    insert into public.survivor_players (pool_id, user_id, entry_number, entry_fee, reference)
    values (
      p_pool_id,
      v_user,
      v_entry_count + 1,
      v_pool.entry_fee,
      'svy_' || substr(p_pool_id::text, 1, 8) || '_' || substr(v_user::text, 1, 8) || '_' ||
      extract(epoch from now())::bigint
    );
  exception
    when unique_violation then
      -- Lost a race on the per-user entry limit — refund the debit
      update public.wallets
         set balance = balance + v_pool.entry_fee
       where user_id = v_user;
      return 'MAX_ENTRIES_REACHED';
  end;

  return 'SUCCESS';
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC: submit_survivor_pick
-- Creates or updates the pick for (entry, round). Re-picking before the
-- deadline is allowed (upsert). The picked team name is derived server-side.
-- Returns: SUCCESS | NOT_AUTHENTICATED | INVALID_SELECTION | ROUND_NOT_FOUND |
--          ROUND_CLOSED | ENTRY_NOT_FOUND | PLAYER_ELIMINATED | INVALID_MATCH |
--          MATCH_LOCKED | TEAM_ALREADY_USED
-- ----------------------------------------------------------------------------
create or replace function public.submit_survivor_pick(
  p_pool_id    uuid,
  p_round_id   uuid,
  p_player_id  uuid,
  p_match_id   uuid,
  p_selection  text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_round  public.survivor_rounds;
  v_player public.survivor_players;
  v_match  public.survivor_round_matches;
  v_team   text;
begin
  if v_user is null then
    return 'NOT_AUTHENTICATED';
  end if;

  if p_selection not in ('HOME','AWAY') then
    return 'INVALID_SELECTION';
  end if;

  select * into v_round from public.survivor_rounds
   where id = p_round_id and pool_id = p_pool_id;
  if v_round.id is null then
    return 'ROUND_NOT_FOUND';
  end if;

  if v_round.status <> 'open' or now() > v_round.closes_at then
    return 'ROUND_CLOSED';
  end if;

  select * into v_player from public.survivor_players
   where id = p_player_id and pool_id = p_pool_id and user_id = v_user;
  if v_player.id is null then
    return 'ENTRY_NOT_FOUND';
  end if;
  if not v_player.alive then
    return 'PLAYER_ELIMINATED';
  end if;

  select * into v_match from public.survivor_round_matches
   where id = p_match_id and round_id = p_round_id;
  if v_match.id is null then
    return 'INVALID_MATCH';
  end if;
  if v_match.status <> 'pending' then
    return 'MATCH_LOCKED';
  end if;

  v_team := case when p_selection = 'HOME' then v_match.home_team else v_match.away_team end;

  -- No-repeat rule: this entry can never pick the same team twice in a pool.
  -- (Current round excluded so the pick can be changed freely before kickoff.)
  if exists (
    select 1 from public.survivor_picks
     where player_id = p_player_id
       and team_name = v_team
       and round_id <> p_round_id
  ) then
    return 'TEAM_ALREADY_USED';
  end if;

  insert into public.survivor_picks (pool_id, round_id, player_id, user_id, match_id, selection, team_name)
  values (p_pool_id, p_round_id, p_player_id, v_user, p_match_id, p_selection, v_team)
  on conflict (player_id, round_id) do update
    set match_id  = excluded.match_id,
        selection = excluded.selection,
        team_name = excluded.team_name;

  return 'SUCCESS';
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. RPC: settle_survivor_round  (admin only)
-- Grades all picks in the round from match outcomes, eliminates losers and
-- no-shows, applies the all-survive rule, marks the round settled.
-- Refuses to run while any fixture in the round is still 'pending' —
-- finish or void every match first (prevents accidental early settlement).
-- Re-running is safe: already-graded picks are never regraded.
-- Returns: 'SETTLED: <graded> picks, <eliminated> eliminated, <restored> restored'
--          or an error code.
-- ----------------------------------------------------------------------------
create or replace function public.settle_survivor_round(p_round_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round        public.survivor_rounds;
  v_alive_before int;
  v_graded       int;
  v_eliminated   int;
  v_no_shows     int;
  v_restored     int := 0;
begin
  if not public.survivor_is_admin() then
    return 'NOT_AUTHORIZED';
  end if;

  select * into v_round from public.survivor_rounds where id = p_round_id;
  if v_round.id is null then
    return 'ROUND_NOT_FOUND';
  end if;
  if v_round.status = 'settled' then
    return 'ALREADY_SETTLED';
  end if;

  -- Safety: every fixture must be finished or void before grading.
  if exists (
    select 1 from public.survivor_round_matches
     where round_id = p_round_id and status = 'pending'
  ) then
    return 'MATCHES_PENDING';
  end if;

  -- Snapshot of the field size BEFORE any elimination (drives the all-survive rule)
  select count(*) into v_alive_before
    from public.survivor_players
   where pool_id = v_round.pool_id and alive = true;

  -- 1. Grade picks that have not been graded yet
  update public.survivor_picks p
     set result = case
       when m.status = 'void' or m.outcome is null then 'PUSH'
       when m.outcome = p.selection then 'WON'
       else 'LOST'
     end
    from public.survivor_round_matches m
   where m.id = p.match_id
     and p.round_id = p_round_id
     and p.result is null;

  get diagnostics v_graded = row_count;

  -- 2. Eliminate entries whose pick LOST
  update public.survivor_players sp
     set alive = false,
         eliminated_round = v_round.round_number
   where sp.pool_id = v_round.pool_id
     and sp.alive = true
     and exists (
       select 1 from public.survivor_picks p
        where p.player_id = sp.id
          and p.round_id = p_round_id
          and p.result = 'LOST'
     );

  get diagnostics v_eliminated = row_count;

  -- 3. Eliminate alive entries that did NOT pick this round (no-show rule)
  update public.survivor_players sp
     set alive = false,
         eliminated_round = v_round.round_number
   where sp.pool_id = v_round.pool_id
     and sp.alive = true
     and not exists (
       select 1 from public.survivor_picks p
        where p.player_id = sp.id
          and p.round_id = p_round_id
     );

  get diagnostics v_no_shows = row_count;
  v_eliminated := v_eliminated + v_no_shows;

  -- 4. All-survive rule: if nobody is left alive, everyone eliminated THIS
  --    round is restored and the pool rolls on.
  if v_alive_before > 0
     and not exists (
       select 1 from public.survivor_players
        where pool_id = v_round.pool_id and alive = true
     )
  then
    update public.survivor_players
       set alive = true,
           eliminated_round = null
     where pool_id = v_round.pool_id
       and eliminated_round = v_round.round_number;

    get diagnostics v_restored = row_count;
  end if;

  update public.survivor_rounds
     set status = 'settled'
   where id = p_round_id;

  return format('SETTLED: %s picks graded, %s eliminated, %s restored (all-survive)',
                v_graded, v_eliminated, v_restored);
end;
$$;

-- Grant on the helper used by RLS policies
grant execute on function public.survivor_is_admin() to authenticated, anon;

-- ----------------------------------------------------------------------------
-- 6. RPC: payout_survivor_pool  (admin only)
-- Pays the pot to the surviving entry/entries. If more than one entry is
-- still alive, pass p_force_split => true to split it evenly.
-- Returns a human-readable summary or an error code.
-- ----------------------------------------------------------------------------
create or replace function public.payout_survivor_pool(
  p_pool_id     uuid,
  p_force_split boolean default false
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pool        public.survivor_pools;
  v_alive_count int;
  v_total       numeric(14,2);
  v_prize       numeric(14,2);
  v_rake        numeric(14,2);
  v_share       numeric(14,2);
  v_missing     int := 0;
  v_rec         record;
begin
  if not public.survivor_is_admin() then
    return 'NOT_AUTHORIZED';
  end if;

  select * into v_pool from public.survivor_pools where id = p_pool_id;
  if v_pool.id is null then
    return 'POOL_NOT_FOUND';
  end if;
  if v_pool.status = 'settled' then
    return 'ALREADY_SETTLED';
  end if;

  select count(*) into v_alive_count
    from public.survivor_players
   where pool_id = p_pool_id and alive = true;

  if v_alive_count = 0 then
    return 'NO_SURVIVORS';
  end if;

  if v_alive_count > 1 and not p_force_split then
    return 'MULTIPLE_SURVIVORS';
  end if;

  select coalesce(sum(entry_fee), 0) into v_total
    from public.survivor_players
   where pool_id = p_pool_id;

  v_prize := round(v_total * (1 - v_pool.rake_pct / 100.0), 2);
  v_rake  := v_total - v_prize;
  v_share := floor((v_prize / v_alive_count) * 100) / 100;

  for v_rec in
    select user_id
      from public.survivor_players
     where pool_id = p_pool_id and alive = true
  loop
    update public.wallets
       set balance = balance + v_share
     where user_id = v_rec.user_id;

    if not found then
      v_missing := v_missing + 1;
    end if;
  end loop;

  update public.survivor_pools
     set status = 'settled'
   where id = p_pool_id;

  return format('PAID: KSh %s to %s survivor(s) (KSh %s each). Platform rake: KSh %s.%s',
                v_prize, v_alive_count, v_share, v_rake,
                case when v_missing > 0 then format(' WARNING: %s winner(s) had no wallet row.', v_missing)
                     else '' end);
end;
$$;

grant execute on function public.join_survivor_pool(uuid)                          to authenticated;
grant execute on function public.submit_survivor_pick(uuid,uuid,uuid,uuid,text)    to authenticated;
grant execute on function public.settle_survivor_round(uuid)                       to authenticated;
grant execute on function public.payout_survivor_pool(uuid,boolean)                to authenticated;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- Reads are public (lobby/standings are visible to everyone).
-- Config tables (pools/rounds/matches) are writable by admins only.
-- players/picks are written EXCLUSIVELY through the SECURITY DEFINER RPCs.
-- ----------------------------------------------------------------------------

alter table public.survivor_pools         enable row level security;
alter table public.survivor_rounds        enable row level security;
alter table public.survivor_round_matches enable row level security;
alter table public.survivor_players       enable row level security;
alter table public.survivor_picks         enable row level security;

-- Reads
drop policy if exists survivor_pools_read on public.survivor_pools;
create policy survivor_pools_read on public.survivor_pools for select using (true);

drop policy if exists survivor_rounds_read on public.survivor_rounds;
create policy survivor_rounds_read on public.survivor_rounds for select using (true);

drop policy if exists survivor_matches_read on public.survivor_round_matches;
create policy survivor_matches_read on public.survivor_round_matches for select using (true);

drop policy if exists survivor_players_read on public.survivor_players;
create policy survivor_players_read on public.survivor_players for select using (true);

drop policy if exists survivor_picks_read on public.survivor_picks;
create policy survivor_picks_read on public.survivor_picks for select using (true);

-- Admin writes (direct client inserts/updates from SurvivorAdmin)
drop policy if exists survivor_pools_admin_write on public.survivor_pools;
create policy survivor_pools_admin_write on public.survivor_pools
  for all to authenticated
  using (public.survivor_is_admin())
  with check (public.survivor_is_admin());

drop policy if exists survivor_rounds_admin_write on public.survivor_rounds;
create policy survivor_rounds_admin_write on public.survivor_rounds
  for all to authenticated
  using (public.survivor_is_admin())
  with check (public.survivor_is_admin());

drop policy if exists survivor_matches_admin_write on public.survivor_round_matches;
create policy survivor_matches_admin_write on public.survivor_round_matches
  for all to authenticated
  using (public.survivor_is_admin())
  with check (public.survivor_is_admin());
