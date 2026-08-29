-- TrackIt schema. Run in Supabase → SQL Editor (safe to re-run).
-- Auth accounts live in Supabase's built-in `auth.users`; sign-up from the app
-- creates them. Everything below is per-user and protected by RLS.

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

-- ── Row Level Security — every table is "you only touch your own rows" ─────
alter table public.routines           enable row level security;
alter table public.routine_exercises  enable row level security;
alter table public.sessions           enable row level security;
alter table public.session_sets       enable row level security;

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
