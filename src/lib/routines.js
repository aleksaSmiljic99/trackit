import { supabase } from './supabase.js'

// A routine plus its ordered exercises.
export async function listRoutines(userId) {
  const { data, error } = await supabase
    .from('routines')
    .select(
      'id, name, position, created_at, ' +
        'routine_exercises (id, name, position, target_sets, target_reps, start_weight_lb)',
    )
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    position: r.position,
    exercises: (r.routine_exercises ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((e) => ({
        id: e.id,
        name: e.name,
        targetSets: e.target_sets,
        targetReps: e.target_reps,
        startWeightLb: Number(e.start_weight_lb),
      })),
  }))
}

// exercises: [{ name, targetSets, targetReps, startWeightLb }]
export async function createRoutine(userId, { name, position, exercises }) {
  const { data: routine, error } = await supabase
    .from('routines')
    .insert({ user_id: userId, name, position: position ?? 0 })
    .select('id')
    .single()
  if (error) throw error

  await replaceExercises(userId, routine.id, exercises)
  return routine.id
}

export async function updateRoutine(userId, routineId, { name, exercises }) {
  const { error } = await supabase
    .from('routines')
    .update({ name })
    .eq('id', routineId)
    .eq('user_id', userId)
  if (error) throw error

  await replaceExercises(userId, routineId, exercises)
}

export async function deleteRoutine(userId, routineId) {
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId)
    .eq('user_id', userId)
  if (error) throw error
}

// Simplest correct approach: wipe the routine's exercises and reinsert in order.
async function replaceExercises(userId, routineId, exercises) {
  const { error: delError } = await supabase
    .from('routine_exercises')
    .delete()
    .eq('routine_id', routineId)
  if (delError) throw delError

  const rows = exercises
    .filter((e) => e.name.trim())
    .map((e, i) => ({
      routine_id: routineId,
      user_id: userId,
      name: e.name.trim(),
      position: i,
      target_sets: clampInt(e.targetSets, 1, 20, 3),
      target_reps: clampInt(e.targetReps, 1, 100, 8),
      start_weight_lb: Math.max(0, Number(e.startWeightLb) || 0),
    }))

  if (rows.length) {
    const { error } = await supabase.from('routine_exercises').insert(rows)
    if (error) throw error
  }
}

function clampInt(v, min, max, fallback) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
