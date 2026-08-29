// Training analytics derived from finished sessions. Weights here are always in
// pounds (the storage unit); screens convert for display.
//
// Load modes:
//   'external'   — `weight` is the load on the bar/stack (the default).
//   'bodyweight' — `weight` is the ADDED load: 0 = just bodyweight, +25 = a
//                  weighted pull-up, −25 = an assisted one. There is no stored
//                  bodyweight number, so bodyweight lifts are ranked by added
//                  load then reps rather than by an estimated 1RM.

// Estimated one-rep max (Epley). Only meaningful up to ~12 reps, which is the
// range this app's rep targets live in.
export function epley(weight, reps) {
  if (!weight || !reps) return 0
  return weight * (1 + reps / 30)
}

// Canonical key for matching the same exercise across sessions despite casing
// or spacing differences in the free-text names.
export function exerciseKey(name) {
  return String(name).trim().toLowerCase().replace(/\s+/g, ' ')
}

// Stable identity for a lift across sessions: its library id when present,
// otherwise a normalized-name fallback.
export function liftKey(lift) {
  return lift.exerciseId ?? `name:${exerciseKey(lift.name ?? '')}`
}

// Volume contribution of one logged set (pounds). Bodyweight sets count only
// their positive added load, so a plain "BW × 10" adds 0 and doesn't distort
// totals.
export function setVolume(weight, reps, loadMode) {
  const w = loadMode === 'bodyweight' ? Math.max(0, Number(weight) || 0) : Number(weight) || 0
  return w * (Number(reps) || 0)
}

// The standout set from a list of { weight, reps }. External → highest est. 1RM.
// Bodyweight → most added load, then most reps.
export function bestSet(sets, loadMode = 'external') {
  let best = null
  for (const s of sets) {
    const weight = Number(s.weight)
    const reps = Number(s.reps)
    if (!reps) continue
    if (loadMode === 'bodyweight') {
      const added = Number.isFinite(weight) ? weight : 0
      if (!best || added > best.added || (added === best.added && reps > best.reps)) {
        best = { weight: added, added, reps, e1rm: 0, bodyweight: true }
      }
    } else {
      if (!weight) continue
      const e1rm = epley(weight, reps)
      if (!best || e1rm > best.e1rm) best = { weight, reps, e1rm, added: 0, bodyweight: false }
    }
  }
  return best
}

// Roll history (loadLogs output) into a per-exercise time series, oldest point
// first so charts read left → right in time.
export function exerciseProgress(logs) {
  const map = new Map()
  for (const session of [...logs].reverse()) {
    for (const lift of session.lifts ?? []) {
      const loadMode = lift.loadMode ?? 'external'
      const done = (lift.sets ?? []).filter(
        (s) => Number(s.reps) && (loadMode === 'bodyweight' || Number(s.weight)),
      )
      if (!done.length) continue
      const best = bestSet(done, loadMode)
      if (!best) continue
      const key = liftKey(lift)
      if (!map.has(key)) map.set(key, { key, name: lift.name, loadMode, points: [] })
      const entry = map.get(key)
      entry.name = lift.name // last name wins
      entry.points.push({
        date: session.performedOn,
        e1rm: best.e1rm,
        score: loadMode === 'bodyweight' ? best.reps : best.e1rm,
        topWeight: Math.max(...done.map((s) => Number(s.weight) || 0)),
        weight: best.weight,
        reps: best.reps,
        added: best.added,
        volume: done.reduce((n, s) => n + setVolume(s.weight, s.reps, loadMode), 0),
      })
    }
  }

  return [...map.values()]
    .map((ex) => {
      const bw = ex.loadMode === 'bodyweight'
      // "better than" comparator between two points for this exercise.
      const better = bw
        ? (p, m) => p.added > m.added || (p.added === m.added && p.reps > m.reps)
        : (p, m) => p.e1rm > m.e1rm
      const prPoint = ex.points.reduce((m, p) => (better(p, m) ? p : m), ex.points[0])
      return {
        ...ex,
        sessions: ex.points.length,
        prE1rm: prPoint,
        prWeight: bw
          ? prPoint
          : ex.points.reduce((m, p) => (p.topWeight > m.topWeight ? p : m), ex.points[0]),
      }
    })
    .sort((a, b) => {
      if (b.sessions !== a.sessions) return b.sessions - a.sessions
      return a.name.localeCompare(b.name)
    })
}

// Records to beat, keyed by liftKey. { e1rm, weight } for external lifts;
// { added, reps } for bodyweight ones. `loadMode` disambiguates.
export function prBaseline(logs) {
  const map = new Map()
  for (const ex of exerciseProgress(logs)) {
    map.set(ex.key, {
      loadMode: ex.loadMode,
      e1rm: ex.prE1rm.e1rm,
      weight: ex.prWeight.topWeight,
      added: ex.prE1rm.added,
      reps: ex.prE1rm.reps,
    })
  }
  return map
}

// Compare a just-finished workout (plan + log from useWorkout) against a
// baseline and return the exercises that set a new record.
export function sessionPRs(plan, log, baseline) {
  const out = []
  plan.forEach((ex, i) => {
    const loadMode = ex.loadMode ?? 'external'
    const done = (log[i] ?? []).filter((s) => s.done)
    if (!done.length) return
    const best = bestSet(done, loadMode)
    if (!best) return
    const base = baseline.get(ex.exerciseId ?? `name:${exerciseKey(ex.name)}`) ?? {}
    const hits = []

    if (loadMode === 'bodyweight') {
      const bAdded = base.added ?? -Infinity
      const bReps = base.reps ?? 0
      if (best.added > bAdded || (best.added === bAdded && best.reps > bReps)) {
        hits.push({ kind: 'bw', reps: best.reps, added: best.added })
      }
    } else {
      const topWeight = Math.max(...done.map((s) => Number(s.weight)))
      if (best.e1rm > (base.e1rm ?? 0) + 0.01) {
        hits.push({ kind: 'e1rm', value: best.e1rm, weight: best.weight, reps: best.reps })
      }
      if (topWeight > (base.weight ?? 0) + 0.01) {
        hits.push({ kind: 'weight', value: topWeight })
      }
    }
    if (hits.length) out.push({ name: ex.name, hits })
  })
  return out
}
