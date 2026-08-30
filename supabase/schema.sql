-- TrackIt schema. Run in Supabase → SQL Editor (safe to re-run).
-- Auth accounts live in Supabase's built-in `auth.users`; sign-up from the app
-- creates them. Everything below is per-user and protected by RLS.

-- ── exercises (per-user library) ───────────────────────────────────────────
-- Each account gets its own copy, seeded on first load (see src/lib/exercises.js).
-- Routines and logged sets point here by id so the same lift lines up across
-- sessions even when its free-text name drifts ("Bench Press" vs "bench").
create table if not exists public.exercises (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  aliases         text[] not null default '{}',
  primary_muscle  text,
  equipment       text,
  load_mode       text not null default 'external',  -- 'external' | 'bodyweight'
  is_archived     boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists exercises_user_idx
  on public.exercises (user_id, is_archived, name);

-- ── De-duplicate the seeded library (safe to re-run — a no-op once clean) ────
-- Early loads could run the seed twice (effect double-fire under StrictMode,
-- or two tabs / devices on a fresh account), leaving every exercise doubled.
-- Collapse dupes into the oldest row, repoint everything that referenced a
-- dup, then the unique index below stops it happening again.
drop table if exists _exercise_dupes;
create temporary table _exercise_dupes as
select id as dup_id, keep_id
from (
  select id,
         first_value(id) over (
           partition by user_id,
                        lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
           order by created_at, id
         ) as keep_id
  from public.exercises
) t
where id <> keep_id;

update public.routine_exercises re set exercise_id = d.keep_id
  from _exercise_dupes d where re.exercise_id = d.dup_id;

update public.session_sets ss set exercise_id = d.keep_id
  from _exercise_dupes d where ss.exercise_id = d.dup_id;

-- Substitution links: repoint each end where it won't collide with a pair the
-- keeper already has; the rest cascade-delete with their dup exercise below.
update public.exercise_substitutions s set exercise_id = d.keep_id
  from _exercise_dupes d
  where s.exercise_id = d.dup_id
    and not exists (
      select 1 from public.exercise_substitutions t
      where t.exercise_id = d.keep_id and t.substitute_id = s.substitute_id
    );

update public.exercise_substitutions s set substitute_id = d.keep_id
  from _exercise_dupes d
  where s.substitute_id = d.dup_id
    and not exists (
      select 1 from public.exercise_substitutions t
      where t.exercise_id = s.exercise_id and t.substitute_id = d.keep_id
    );

delete from public.exercise_substitutions where exercise_id = substitute_id;

delete from public.exercises e using _exercise_dupes d where e.id = d.dup_id;

drop table _exercise_dupes;

-- One library row per name, per user (case- and whitespace-insensitive, to
-- match exerciseKey() in the app).
create unique index if not exists exercises_user_name_key
  on public.exercises (user_id, lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));

-- ── exercise_substitutions (symmetric "swap this for that" links) ───────────
-- Stored both directions so a lookup by either id is a single filter.
create table if not exists public.exercise_substitutions (
  user_id       uuid not null references auth.users (id) on delete cascade,
  exercise_id   uuid not null references public.exercises (id) on delete cascade,
  substitute_id uuid not null references public.exercises (id) on delete cascade,
  primary key (exercise_id, substitute_id)
);

create index if not exists exercise_substitutions_user_idx
  on public.exercise_substitutions (user_id, exercise_id);

-- ── routines (a "workout day", e.g. "Push A") ───────────────────────────────
create table if not exists public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists routines_user_idx
  on public.routines (user_id, position, created_at);

-- ── routine_exercises (the plan for a workout day) ──────────────────────────
create table if not exists public.routine_exercises (
  id               uuid primary key default gen_random_uuid(),
  routine_id       uuid not null references public.routines (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  name             text not null,
  position         integer not null default 0,
  target_sets      integer not null default 3,
  target_reps      integer not null default 8,
  start_weight_lb  numeric not null default 45,   -- always stored in pounds
  created_at       timestamptz not null default now()
);

create index if not exists routine_exercises_routine_idx
  on public.routine_exercises (routine_id, position);

-- Library link + how the load is entered + superset grouping.
-- exercises sharing a non-null superset_group in one routine are performed
-- back-to-back (rest only after the group).
alter table public.routine_exercises
  add column if not exists exercise_id    uuid references public.exercises (id) on delete set null,
  add column if not exists load_mode      text not null default 'external',
  add column if not exists superset_group smallint;

-- ── sessions (a finished workout) ──────────────────────────────────────────
create table if not exists public.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  routine_id       uuid references public.routines (id) on delete set null,
  name             text not null,
  performed_on     date not null default current_date,
  elapsed_seconds  integer not null default 0,
  total_volume_lb  numeric not null default 0,
  set_count        integer not null default 0,
  created_at       timestamptz not null default now()
);

-- Added for existing databases created before routines existed.
alter table public.sessions
  add column if not exists routine_id uuid references public.routines (id) on delete set null;

create index if not exists sessions_user_recent_idx
  on public.sessions (user_id, performed_on desc, created_at desc);
create index if not exists sessions_routine_idx
  on public.sessions (routine_id, performed_on desc, created_at desc);

-- ── session_sets (each set of a finished workout) ──────────────────────────
create table if not exists public.session_sets (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  lift_index   integer not null,
  lift_name    text not null,
  set_index    integer not null,
  weight       numeric not null,          -- always stored in pounds
  reps         integer not null,
  target_reps  integer,
  done         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists session_sets_session_idx
  on public.session_sets (session_id, lift_index, set_index);

-- Library link, load style, and grouping.
--   load_mode = 'bodyweight' → `weight` is the ADDED load: 0 shows as "BW",
--     +25 as "BW +25", -25 (assisted) as "BW −25".
--   superset_group → same value across lifts = performed back-to-back.
--   drop_group → same value within one lift = a drop set sequence (no rest).
alter table public.session_sets
  add column if not exists exercise_id    uuid references public.exercises (id) on delete set null,
  add column if not exists load_mode      text not null default 'external',
  add column if not exists superset_group smallint,
  add column if not exists drop_group     smallint;

create index if not exists session_sets_exercise_idx
  on public.session_sets (user_id, exercise_id);

-- ── Row Level Security — every table is "you only touch your own rows" ─────
alter table public.exercises              enable row level security;
alter table public.exercise_substitutions enable row level security;
alter table public.routines               enable row level security;
alter table public.routine_exercises      enable row level security;
alter table public.sessions               enable row level security;
alter table public.session_sets           enable row level security;

drop policy if exists "own exercises" on public.exercises;
create policy "own exercises" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own exercise_substitutions" on public.exercise_substitutions;
create policy "own exercise_substitutions" on public.exercise_substitutions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own routines" on public.routines;
create policy "own routines" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own routine_exercises" on public.routine_exercises;
create policy "own routine_exercises" on public.routine_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own sessions" on public.sessions;
create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own session_sets" on public.session_sets;
create policy "own session_sets" on public.session_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
