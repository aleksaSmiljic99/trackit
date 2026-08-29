import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { loadPlan, saveSession } from '../lib/workouts.js'
import { prBaseline, sessionPRs } from '../lib/stats.js'

const ACTIVE_KEY = 'trackit.active.v1'

function freshLog(plan) {
  return plan.map((e) =>
    Array.from({ length: e.sets }, () => ({
      done: false,
      weight: e.weight,
      reps: e.reps,
    })),
  )
}

function readActive() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function writeActive(v) {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(v))
  } catch {
    /* private mode — resume just won't be available */
  }
}
function clearActive() {
  try {
    localStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* ignore */
  }
}

// Active-workout state, ported from the prototype's `Component`.
// Driven by a routine the user picked on the Today screen. The in-progress
// session is mirrored to localStorage so a refresh or a closed tab can resume.
export function useWorkout({ prefs, logs = [], onSaved }) {
  const { user } = useAuth()

  const [screen, setScreen] = useState('today') // 'today' | 'work' | 'done'
  const [routine, setRoutine] = useState(null)
  const [plan, setPlan] = useState([])
  const [log, setLog] = useState([])
  const [lastDate, setLastDate] = useState(null)
  const [exIdx, setExIdx] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [rest, setRest] = useState(0)
  const [starting, setStarting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(readActive)

  // PRs to beat, captured when the workout starts so finishing can flag records.
  const baselineRef = useRef(new Map())

  const resumable = saved && (!saved.userId || saved.userId === user?.id) ? saved : null

  // One ticker; only advances while on the Active workout screen. Elapsed is
  // derived from the start timestamp so it stays right across a resume.
  useEffect(() => {
    if (screen !== 'work') return
    const tick = () => {
      if (startedAt) {
        setElapsed(Math.max(0, Math.round((Date.now() - startedAt) / 1000)))
      }
      setRest((r) => (r > 0 ? r - 1 : 0))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [screen, startedAt])

  // Mirror the in-progress session to localStorage on every change.
  useEffect(() => {
    if (screen !== 'work') return
    writeActive({
      userId: user?.id ?? null,
      routine,
      plan,
      log,
      exIdx,
      startedAt,
      savedAt: Date.now(),
    })
  }, [screen, user, routine, plan, log, exIdx, startedAt])

  const begin = useCallback(
    async (chosen) => {
      if (!user) return
      setStarting(true)
      setError(null)
      try {
        const { plan: p, lastDate: d } = await loadPlan(user.id, chosen)
        if (!p.length) throw new Error('Add at least one exercise to this day first.')
        baselineRef.current = prBaseline(logs)
        setRoutine(chosen)
        setPlan(p)
        setLog(freshLog(p))
        setLastDate(d)
        setExIdx(0)
        setStartedAt(Date.now())
        setElapsed(0)
        setRest(0)
        setSaved(null)
        setScreen('work')
      } catch (e) {
        setError(e.message ?? String(e))
      } finally {
        setStarting(false)
      }
    },
    [user, logs],
  )

  const resume = useCallback(() => {
    const s = readActive()
    if (!s) return
    baselineRef.current = prBaseline(logs)
    setRoutine(s.routine)
    setPlan(s.plan ?? [])
    setLog(s.log ?? [])
    setLastDate(null)
    setExIdx(s.exIdx ?? 0)
    setStartedAt(s.startedAt ?? Date.now())
    setRest(0)
    setError(null)
    setSaved(null)
    setScreen('work')
  }, [logs])

  const discardSaved = useCallback(() => {
    clearActive()
    setSaved(null)
  }, [])

  const toggleSet = useCallback(
    (i) => {
      let advanceTo = null
      setLog((prev) => {
        const next = prev.map((a) => a.map((s) => ({ ...s })))
        const row = next[exIdx][i]
        row.done = !row.done

        // Superset: when a set is completed and a grouped partner still has work
        // left, jump straight to it with no rest.
        const group = plan[exIdx]?.supersetGroup
        let supersetHop = false
        if (row.done && group != null) {
          const partner = plan.findIndex(
            (p, j) =>
              j !== exIdx && p.supersetGroup === group && next[j].some((s) => !s.done),
          )
          if (partner >= 0) {
            supersetHop = true
            advanceTo = partner
          }
        }

        // No rest between the sets of a drop set either.
        const isDrop = row.dropGroup != null
        setRest(
          row.done && !supersetHop && !isDrop && prefs.showRestTimer ? prefs.restSeconds : 0,
        )
        return next
      })
      if (advanceTo != null) setExIdx(advanceTo)
    },
    [exIdx, plan, prefs.showRestTimer, prefs.restSeconds],
  )

  const bump = useCallback(
    (field, delta) => {
      setLog((prev) => {
        const i = prev[exIdx].findIndex((s) => !s.done)
        if (i < 0) return prev
        const next = prev.map((a) => a.map((s) => ({ ...s })))
        const row = next[exIdx][i]
        // Bodyweight loads may go negative (assisted); everything else floors at 0.
        const floor =
          field === 'reps' ? 1 : plan[exIdx]?.loadMode === 'bodyweight' ? -500 : 0
        row[field] = Math.max(floor, row[field] + delta)
        return next
      })
    },
    [exIdx, plan],
  )

  // Append a lighter set right after set `i`, tied to it as a drop set (no rest).
  const addDrop = useCallback(
    (i) => {
      setLog((prev) => {
        const next = prev.map((a) => a.map((s) => ({ ...s })))
        const rows = next[exIdx]
        const src = rows[i]
        if (!src) return prev
        let group = src.dropGroup
        if (group == null) {
          group = 1 + rows.reduce((m, s) => Math.max(m, s.dropGroup ?? 0), 0)
          src.dropGroup = group
        }
        const bw = plan[exIdx]?.loadMode === 'bodyweight'
        const weight = bw ? src.weight : Math.max(0, Math.round((src.weight * 0.8) / 5) * 5)
        rows.splice(i + 1, 0, { done: false, weight, reps: src.reps, dropGroup: group })
        return next
      })
      setRest(0)
    },
    [exIdx, plan],
  )

  const selectLift = useCallback((i) => {
    setExIdx(i)
    setRest(0)
  }, [])

  // Mid-workout exercise swap. Changes the plan row (name/library id/load mode)
  // and clears any not-yet-logged sets' weight when the load style changes.
  // The routine on disk is untouched.
  const swapLift = useCallback((i, ex) => {
    const toBw = (ex.loadMode ?? 'external') === 'bodyweight'
    setPlan((prev) =>
      prev.map((p, j) =>
        j === i
          ? {
              ...p,
              name: ex.name,
              exerciseId: ex.id,
              loadMode: ex.loadMode ?? 'external',
              last: null,
              weight: toBw && p.loadMode !== 'bodyweight' ? 0 : p.weight,
            }
          : p,
      ),
    )
    setLog((prev) =>
      prev.map((rows, j) =>
        j === i
          ? rows.map((s) => (s.done ? s : { ...s, weight: toBw ? 0 : s.weight }))
          : rows,
      ),
    )
  }, [])

  const skipRest = useCallback(() => setRest(0), [])

  const finish = useCallback(async () => {
    const finalElapsed = startedAt
      ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      : elapsed
    setElapsed(finalElapsed)
    setScreen('done')
    clearActive()
    setSaved(null)
    if (!user || !routine) return
    setSaving(true)
    try {
      await saveSession({
        userId: user.id,
        routineId: routine.id,
        name: routine.name,
        plan,
        log,
        elapsed: finalElapsed,
      })
      setError(null)
      onSaved?.()
    } catch (e) {
      setError(`Couldn't save this session: ${e.message ?? e}`)
    } finally {
      setSaving(false)
    }
  }, [user, routine, plan, log, elapsed, startedAt, onSaved])

  const reset = useCallback(() => {
    clearActive()
    setScreen('today')
    setRoutine(null)
    setPlan([])
    setLog([])
    setExIdx(0)
    setStartedAt(null)
    setElapsed(0)
    setRest(0)
  }, [])

  const prs = useMemo(
    () => (screen === 'done' ? sessionPRs(plan, log, baselineRef.current) : []),
    [screen, plan, log],
  )

  return {
    screen,
    routine,
    routineName: routine?.name ?? '',
    plan,
    log,
    lastDate,
    exIdx,
    elapsed,
    rest,
    starting,
    saving,
    error,
    prs,
    resumable,
    begin,
    resume,
    discardSaved,
    finish,
    reset,
    toggleSet,
    addDrop,
    swapLift,
    bumpWeight: (d) => bump('weight', d),
    bumpReps: (d) => bump('reps', d),
    selectLift,
    skipRest,
  }
}
