import { supabase } from './supabase.js'
import { shortWeekday } from './format.js'
import { setVolume } from './stats.js'

// Build the working plan for a routine: start from the routine's exercises,
// then, for each exercise, if the user has logged this routine before, carry
// the last session's weight/reps forward (progressive overload — the lifter
// nudges the weight up from the "Adjust next set" stepper when ready).
export async function loadPlan(userId, routine) {
  const base = routine.exercises.map((e) => ({
    name: e.name,
    exerciseId: e.exerciseId ?? null,
    loadMode: e.loadMode ?? 'external',
    supersetGroup: e.supersetGroup ?? null,
    sets: e.targetSets,
    reps: e.targetReps,
    weight: e.startWeightLb,
    last: null,
  }))

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, performed_on')
    .eq('user_id', userId)
    .eq('routine_id', routine.id)
    .order('performed_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error

  const last = sessions?.[0]
  if (!last) return { plan: base, lastDate: null }

  const { data: sets, error: setsError } = await supabase
    .from('session_sets')
    .select('lift_name, exercise_id, set_index, weight, reps, done')
    .eq('session_id', last.id)
  if (setsError) throw setsError

  // Match last session's sets to plan rows by library id first, then by name.
  const byId = new Map()
  const byName = new Map()
  for (const s of sets ?? []) {
    if (s.exercise_id) {
      if (!byId.has(s.exercise_id)) byId.set(s.exercise_id, [])
      byId.get(s.exercise_id).push(s)
    }
    if (!byName.has(s.lift_name)) byName.set(s.lift_name, [])
    byName.get(s.lift_name).push(s)
  }

  const plan = base.map((row) => {
    const rows = (row.exerciseId && byId.get(row.exerciseId)) || byName.get(row.name)
    if (!rows?.length) return row
    const logged = rows.filter((r) => r.done)
    const ref = (logged.length ? logged : rows).sort(
      (a, b) => b.set_index - a.set_index,
    )[0]
    return {
      ...row,
      weight: Number(ref.weight),
      reps: ref.reps,
      last: { weight: Number(ref.weight), reps: ref.reps },
    }
  })

  return { plan, lastDate: last.performed_on }
}

export async function loadRecent(userId, limit = 4) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, name, performed_on, total_volume_lb')
    .eq('user_id', userId)
    .order('performed_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error

  return (data ?? []).map((s) => ({
    when: shortWeekday(new Date(s.performed_on)),
    name: s.name,
    volumeLb: Number(s.total_volume_lb) || 0,
  }))
}

// Full history: every past session with its sets grouped by lift, newest first.
export async function loadLogs(userId, limit = 100) {
  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, name, performed_on, elapsed_seconds, total_volume_lb, set_count, ' +
        'session_sets (lift_index, lift_name, exercise_id, load_mode, superset_group, ' +
        'drop_group, set_index, weight, reps, done)',
    )
    .eq('user_id', userId)
    .order('performed_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error

  return (data ?? []).map((s) => {
    const byIndex = new Map()
    for (const set of s.session_sets ?? []) {
      if (!byIndex.has(set.lift_index)) {
        byIndex.set(set.lift_index, {
          name: set.lift_name,
          exerciseId: set.exercise_id ?? null,
          loadMode: set.load_mode ?? 'external',
          supersetGroup: set.superset_group ?? null,
          sets: [],
        })
      }
      byIndex.get(set.lift_index).sets.push({
        setIndex: set.set_index,
        weight: Number(set.weight),
        reps: set.reps,
        done: set.done,
        dropGroup: set.drop_group ?? null,
      })
    }

    const lifts = [...byIndex.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, lift]) => ({
        name: lift.name,
        exerciseId: lift.exerciseId,
        loadMode: lift.loadMode,
        supersetGroup: lift.supersetGroup,
        sets: lift.sets
          .sort((a, b) => a.setIndex - b.setIndex)
          .filter((x) => x.done),
        skipped: lift.sets.every((x) => !x.done),
      }))

    const loggedSets = (s.session_sets ?? []).filter((x) => x.done)
    return {
      id: s.id,
      name: s.name,
      performedOn: s.performed_on,
      elapsedSeconds: s.elapsed_seconds ?? 0,
      setCount: s.set_count ?? loggedSets.length,
      volumeLb:
        Number(s.total_volume_lb) ||
        loggedSets.reduce((n, x) => n + setVolume(x.weight, x.reps, x.load_mode), 0),
      lifts,
    }
  })
}

// Persist a finished session and its sets. Weights are stored in pounds.
export async function saveSession({ userId, routineId, name, plan, log, elapsed }) {
  const totalVolume = log.reduce(
    (sum, liftSets, i) =>
      sum +
      liftSets
        .filter((s) => s.done)
        .reduce((n, s) => n + setVolume(s.weight, s.reps, plan[i]?.loadMode), 0),
    0,
  )
  const loggedSets = log.flat().filter((s) => s.done)

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      routine_id: routineId,
      name,
      performed_on: new Date().toISOString().slice(0, 10),
      elapsed_seconds: elapsed,
      total_volume_lb: totalVolume,
      set_count: loggedSets.length,
    })
    .select('id')
    .single()
  if (error) throw error

  const rows = []
  log.forEach((liftSets, liftIndex) => {
    const p = plan[liftIndex]
    liftSets.forEach((s, setIndex) => {
      rows.push({
        session_id: session.id,
        user_id: userId,
        lift_index: liftIndex,
        lift_name: p.name,
        exercise_id: p.exerciseId ?? null,
        load_mode: p.loadMode === 'bodyweight' ? 'bodyweight' : 'external',
        superset_group: p.supersetGroup ?? null,
        drop_group: s.dropGroup ?? null,
        set_index: setIndex,
        weight: s.weight,
        reps: s.reps,
        target_reps: p.reps,
        done: s.done,
      })
    })
  })

  const { error: setsError } = await supabase.from('session_sets').insert(rows)
  if (setsError) throw setsError

  return session.id
}

export async function deleteSession(userId, sessionId) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId)
  if (error) throw error
}

// Rewrite a past session in place: session_sets are the source of truth, so we
// wipe and reinsert them (same approach as replaceExercises for routines).
// lifts: [{ name, sets: [{ weight, reps, done }] }] — weights in pounds.
export async function updateSession(
  userId,
  sessionId,
  { name, performedOn, elapsedSeconds, lifts },
) {
  const rows = []
  lifts.forEach((lift, liftIndex) => {
    const loadMode = lift.loadMode === 'bodyweight' ? 'bodyweight' : 'external'
    lift.sets.forEach((s, setIndex) => {
      rows.push({
        session_id: sessionId,
        user_id: userId,
        lift_index: liftIndex,
        lift_name: lift.name.trim() || `Lift ${liftIndex + 1}`,
        exercise_id: lift.exerciseId ?? null,
        load_mode: loadMode,
        superset_group: lift.supersetGroup ?? null,
        drop_group: s.dropGroup ?? null,
        set_index: setIndex,
        weight: loadMode === 'bodyweight' ? Number(s.weight) || 0 : Math.max(0, Number(s.weight) || 0),
        reps: Math.max(0, Math.round(Number(s.reps) || 0)),
        done: s.done !== false,
      })
    })
  })

  const done = rows.filter((r) => r.done)
  const totalVolume = done.reduce((n, r) => n + setVolume(r.weight, r.reps, r.load_mode), 0)

  const { error } = await supabase
    .from('sessions')
    .update({
      name: name.trim() || 'Workout',
      performed_on: performedOn,
      elapsed_seconds: Math.max(0, Math.round(Number(elapsedSeconds) || 0)),
      total_volume_lb: totalVolume,
      set_count: done.length,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
  if (error) throw error

  const { error: delError } = await supabase
    .from('session_sets')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId)
  if (delError) throw delError

  if (rows.length) {
    const { error: insError } = await supabase.from('session_sets').insert(rows)
    if (insError) throw insError
  }
}
