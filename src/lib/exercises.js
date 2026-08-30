import { supabase } from './supabase.js'
import { exerciseKey } from './stats.js'
import { SEED_EXERCISES } from './seed.js'

// One library row, shaped for the app.
function rowToExercise(r) {
  return {
    id: r.id,
    name: r.name,
    aliases: r.aliases ?? [],
    primaryMuscle: r.primary_muscle ?? null,
    equipment: r.equipment ?? null,
    loadMode: r.load_mode ?? 'external',
    isArchived: Boolean(r.is_archived),
  }
}

// Every exercise the user owns (archived included — screens filter as needed),
// sorted by name.
export async function listExercises(userId) {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, aliases, primary_muscle, equipment, load_mode, is_archived')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []).map(rowToExercise)
}

// Their substitution links as a Map<exerciseId, Set<substituteId>>.
export async function listSubstitutions(userId) {
  const { data, error } = await supabase
    .from('exercise_substitutions')
    .select('exercise_id, substitute_id')
    .eq('user_id', userId)
  if (error) throw error
  const map = new Map()
  for (const { exercise_id, substitute_id } of data ?? []) {
    if (!map.has(exercise_id)) map.set(exercise_id, new Set())
    map.get(exercise_id).add(substitute_id)
  }
  return map
}

// Index the library for name → id resolution (canonical name + every alias).
export function indexByKey(exercises) {
  const map = new Map()
  for (const ex of exercises) {
    map.set(exerciseKey(ex.name), ex)
    for (const a of ex.aliases) if (!map.has(exerciseKey(a))) map.set(exerciseKey(a), ex)
  }
  return map
}

// Seed the library on first use, then backfill exercise_id onto any pre-library
// routine/session rows. Idempotent: a second call is a couple of cheap queries.
export async function ensureLibrary(userId) {
  let exercises = await listExercises(userId)

  if (!exercises.length) {
    const rows = SEED_EXERCISES.map((e) => ({
      user_id: userId,
      name: e.name,
      aliases: e.aliases,
      primary_muscle: e.primaryMuscle,
      equipment: e.equipment,
      load_mode: e.loadMode,
    }))
    const { data: inserted, error } = await supabase
      .from('exercises')
      .insert(rows)
      .select('id, name, aliases, primary_muscle, equipment, load_mode, is_archived')

    // 23505 = a concurrent first load (another tab/device, or a double-fired
    // effect) already seeded. The insert is atomic, so nothing landed here —
    // re-read their rows and fall through to the backfill.
    if (error?.code === '23505') {
      exercises = await listExercises(userId)
    } else if (error) {
      throw error
    } else {
      exercises = (inserted ?? []).map(rowToExercise)

      // Turn the `alt` lists into symmetric substitution links.
      const byName = new Map(exercises.map((ex) => [ex.name, ex.id]))
      const pairs = new Set()
      for (const seed of SEED_EXERCISES) {
        const a = byName.get(seed.name)
        for (const altName of seed.alt) {
          const b = byName.get(altName)
          if (!a || !b || a === b) continue
          pairs.add(`${a}|${b}`)
          pairs.add(`${b}|${a}`)
        }
      }
      if (pairs.size) {
        const subRows = [...pairs].map((p) => {
          const [exercise_id, substitute_id] = p.split('|')
          return { user_id: userId, exercise_id, substitute_id }
        })
        const { error: subErr } = await supabase
          .from('exercise_substitutions')
          .upsert(subRows, { onConflict: 'exercise_id,substitute_id' })
        if (subErr) throw subErr
      }
    }
  }

  await backfillExerciseIds(userId, exercises)
  return exercises
}

// Point old routine_exercises / session_sets at library rows by matching their
// free-text name. Anything with no match gets a fresh (external) library row so
// the column is never left null going forward.
async function backfillExerciseIds(userId, exercises) {
  const index = indexByKey(exercises)
  const byId = new Map(exercises.map((ex) => [ex.id, ex]))

  const resolve = async (name) => {
    const hit = index.get(exerciseKey(name))
    if (hit) return hit
    const { data, error } = await supabase
      .from('exercises')
      .insert({ user_id: userId, name: name.trim() || 'Exercise' })
      .select('id, name, aliases, primary_muscle, equipment, load_mode, is_archived')
      .single()
    if (error) throw error
    const created = rowToExercise(data)
    index.set(exerciseKey(created.name), created)
    byId.set(created.id, created)
    return created
  }

  for (const table of ['routine_exercises', 'session_sets']) {
    const nameCol = table === 'routine_exercises' ? 'name' : 'lift_name'
    const { data: pending, error } = await supabase
      .from(table)
      .select(nameCol)
      .eq('user_id', userId)
      .is('exercise_id', null)
    if (error) throw error

    const names = [...new Set((pending ?? []).map((r) => r[nameCol]))]
    for (const name of names) {
      const ex = await resolve(name)
      const { error: upErr } = await supabase
        .from(table)
        .update({ exercise_id: ex.id, load_mode: ex.loadMode })
        .eq('user_id', userId)
        .eq(nameCol, name)
        .is('exercise_id', null)
      if (upErr) throw upErr
    }
  }
}

export async function createExercise(userId, { name, primaryMuscle, equipment, loadMode }) {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: userId,
      name: name.trim(),
      primary_muscle: primaryMuscle || null,
      equipment: equipment || null,
      load_mode: loadMode === 'bodyweight' ? 'bodyweight' : 'external',
    })
    .select('id, name, aliases, primary_muscle, equipment, load_mode, is_archived')
    .single()
  if (error) throw error
  return rowToExercise(data)
}

export async function updateExercise(userId, id, patch) {
  const row = {}
  if (patch.name != null) row.name = patch.name.trim()
  if (patch.primaryMuscle !== undefined) row.primary_muscle = patch.primaryMuscle || null
  if (patch.equipment !== undefined) row.equipment = patch.equipment || null
  if (patch.loadMode != null) row.load_mode = patch.loadMode === 'bodyweight' ? 'bodyweight' : 'external'
  if (patch.isArchived != null) row.is_archived = patch.isArchived
  const { error } = await supabase
    .from('exercises')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function addSubstitution(userId, exerciseId, substituteId) {
  if (exerciseId === substituteId) return
  const { error } = await supabase.from('exercise_substitutions').upsert(
    [
      { user_id: userId, exercise_id: exerciseId, substitute_id: substituteId },
      { user_id: userId, exercise_id: substituteId, substitute_id: exerciseId },
    ],
    { onConflict: 'exercise_id,substitute_id' },
  )
  if (error) throw error
}

export async function removeSubstitution(userId, exerciseId, substituteId) {
  const { error } = await supabase
    .from('exercise_substitutions')
    .delete()
    .eq('user_id', userId)
    .or(
      `and(exercise_id.eq.${exerciseId},substitute_id.eq.${substituteId}),` +
        `and(exercise_id.eq.${substituteId},substitute_id.eq.${exerciseId})`,
    )
  if (error) throw error
}
