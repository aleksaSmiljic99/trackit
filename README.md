# TrackIt

Gym-lift tracker. Responsive web app — React + Vite + Tailwind, Supabase for
auth and per-user data.

## Flow

1. **Sign up / sign in** (Supabase Auth, email + password).
2. **Workout days** — each user builds their own split: a day ("Push A") is a
   list of exercises with target sets, reps and a starting weight (lb). Add,
   edit, delete any time. Templates are offered as a starting point.
3. **Today** — pick which day to train; the plan prefills from your last
   session of that day (progressive overload). Tap **Begin workout**.
4. **Active workout** — tap a set to log it at the shown numbers, adjust the
   next set with the steppers, rest timer, switch exercises with the chips.
5. **Logged** — session summary. **Back to today** returns to the picker.
6. **History** — every past session by date: expand one to see each lift with
   all its logged sets (`weight × reps`), plus set count, volume and duration.

Weights are stored in pounds; the `lb` / `kg` toggle in the top bar only
changes the display.

## Setup

1. **Create a Supabase project** at <https://supabase.com>.
2. **Run the schema** — Supabase → SQL Editor → paste all of
   `supabase/schema.sql` → run. It's safe to re-run; if you ran an earlier
   version it adds the new `routines` / `routine_exercises` tables and the
   `sessions.routine_id` column. Row-level security scopes every table to its
   owner.
3. **Auth** — Authentication → Providers → Email is on by default. For quick
   testing, turn off "Confirm email" so sign-up logs you straight in.
4. **Environment** — copy `.env.example` to `.env`:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   ```
   Both under Project Settings → API. The anon key is client-safe; RLS is what
   protects the data. Do **not** use the `service_role` key.
5. `npm install && npm run dev`

Without `.env` the app shows a "Connect Supabase" notice.

## Data model (`supabase/schema.sql`)

| table | holds |
|---|---|
| `auth.users` | accounts (Supabase built-in) |
| `routines` | a workout day |
| `routine_exercises` | the planned exercises for a day |
| `sessions` | a finished workout |
| `session_sets` | every set of a finished workout |

## Notes on the port

- The handoff's `ios-frame` bezel and prototype runtime are not ported. Layout
  is responsive web with a centered reading-width column.
- Check / empty-box marks are the `✓` / `□` glyphs from the handoff.
- Rest-timer defaults (on/off, seconds) live in `src/lib/seed.js` and are kept
  per-device in `localStorage`, along with the unit choice.
