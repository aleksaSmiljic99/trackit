// Training analytics derived from finished sessions. Weights here are always in
// pounds (the storage unit); screens convert for display.

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

// The set with the highest estimated 1RM from a list of { weight, reps }.
export function bestSet(sets) {
  let best = null
  for (const s of sets) {
    const weight = Number(s.weight)
    const reps = Number(s.reps)
    if (!weight || !reps) continue
    const e1rm = epley(weight, reps)
    if (!best || e1rm > best.e1rm) best = { weight, reps, e1rm }
  }
  return best
}

// Roll history (loadLogs output) into a per-exercise time series, oldest point
// first so charts read left → right in time.
export function exerciseProgress(logs) {
  const map = new Map()
  for (const session of [...logs].reverse()) {
    for (const lift of session.lifts ?? []) {
      const done = (lift.sets ?? []).filter((s) => s.done !== false && Number(s.weight))
      if (!done.length) continue
      const best = bestSet(done)
      if (!best) continue
      const key = exerciseKey(lift.name)
      if (!map.has(key)) map.set(key, { name: lift.name, points: [] })
      map.get(key).points.push({
        date: session.performedOn,
        e1rm: best.e1rm,
        topWeight: Math.max(...done.map((s) => Number(s.weight))),
        weight: best.weight,
        reps: best.reps,
        volume: done.reduce((n, s) => n + Number(s.weight) * Number(s.reps), 0),
      })
    }
  }

  return [...map.values()]
    .map((ex) => ({
      ...ex,
      sessions: ex.points.length,
      prE1rm: ex.points.reduce((m, p) => (p.e1rm > m.e1rm ? p : m), ex.points[0]),
      prWeight: ex.points.reduce(
        (m, p) => (p.topWeight > m.topWeight ? p : m),
        ex.points[0],
      ),
    }))
    .sort((a, b) => {
      if (b.sessions !== a.sessions) return b.sessions - a.sessions
      return a.name.localeCompare(b.name)
    })
}

// Best est. 1RM and heaviest set per exercise across all of history — the
// standard to beat. Keyed by exerciseKey(name).
export function prBaseline(logs) {
  const map = new Map()
  for (const ex of exerciseProgress(logs)) {
    map.set(exerciseKey(ex.name), {
      e1rm: ex.prE1rm.e1rm,
      weight: ex.prWeight.topWeight,
    })
  }
  return map
}

// Compare a just-finished workout (plan + log from useWorkout) against a
// baseline and return the exercises that set a new record.
export function sessionPRs(plan, log, baseline) {
  const out = []
  plan.forEach((ex, i) => {
    const done = (log[i] ?? []).filter((s) => s.done)
    if (!done.length) return
    const best = bestSet(done)
    const topWeight = Math.max(...done.map((s) => Number(s.weight)))
    const base = baseline.get(exerciseKey(ex.name)) ?? { e1rm: 0, weight: 0 }
    const hits = []
    if (best && best.e1rm > base.e1rm + 0.01) {
      hits.push({ kind: 'e1rm', value: best.e1rm, weight: best.weight, reps: best.reps })
    }
    if (topWeight > base.weight + 0.01) {
      hits.push({ kind: 'weight', value: topWeight })
    }
    if (hits.length) out.push({ name: ex.name, hits })
  })
  return out
}
