import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { loadPlan, saveSession } from '../lib/workouts.js'

function freshLog(plan) {
  return plan.map((e) =>
    Array.from({ length: e.sets }, () => ({
      done: false,
      weight: e.weight,
      reps: e.reps,
    })),
  )
}

// Active-workout state, ported from the prototype's `Component`.
// Driven by a routine the user picked on the Today screen.
export function useWorkout({ prefs, onSaved }) {
  const { user } = useAuth()

  const [screen, setScreen] = useState('today') // 'today' | 'work' | 'done'
  const [routine, setRoutine] = useState(null)
  const [plan, setPlan] = useState([])
  const [log, setLog] = useState([])
  const [lastDate, setLastDate] = useState(null)
  const [exIdx, setExIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [rest, setRest] = useState(0)
  const [starting, setStarting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // One ticker; only advances while on the Active workout screen.
  useEffect(() => {
    if (screen !== 'work') return
    const id = setInterval(() => {
      setElapsed((e) => e + 1)
      setRest((r) => (r > 0 ? r - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [screen])

  const begin = useCallback(
    async (chosen) => {
      if (!user) return
      setStarting(true)
      setError(null)
      try {
        const { plan: p, lastDate: d } = await loadPlan(user.id, chosen)
        if (!p.length) throw new Error('Add at least one exercise to this day first.')
        setRoutine(chosen)
        setPlan(p)
        setLog(freshLog(p))
        setLastDate(d)
        setExIdx(0)
        setElapsed(0)
        setRest(0)
        setScreen('work')
      } catch (e) {
        setError(e.message ?? String(e))
      } finally {
        setStarting(false)
      }
    },
    [user],
  )

  const toggleSet = useCallback(
    (i) => {
      setLog((prev) => {
        const next = prev.map((a) => a.map((s) => ({ ...s })))
        const row = next[exIdx][i]
        row.done = !row.done
        setRest(row.done && prefs.showRestTimer ? prefs.restSeconds : 0)
        return next
      })
    },
    [exIdx, prefs.showRestTimer, prefs.restSeconds],
  )

  const bump = useCallback(
    (field, delta) => {
      setLog((prev) => {
        const i = prev[exIdx].findIndex((s) => !s.done)
        if (i < 0) return prev
        const next = prev.map((a) => a.map((s) => ({ ...s })))
        const row = next[exIdx][i]
        row[field] = Math.max(field === 'reps' ? 1 : 0, row[field] + delta)
        return next
      })
    },
    [exIdx],
  )

  const selectLift = useCallback((i) => {
    setExIdx(i)
    setRest(0)
  }, [])

  const skipRest = useCallback(() => setRest(0), [])

  const finish = useCallback(async () => {
    setScreen('done')
    if (!user || !routine) return
    setSaving(true)
    try {
      await saveSession({
        userId: user.id,
        routineId: routine.id,
        name: routine.name,
        plan,
        log,
        elapsed,
      })
      setError(null)
      onSaved?.()
    } catch (e) {
      setError(`Couldn't save this session: ${e.message ?? e}`)
    } finally {
      setSaving(false)
    }
  }, [user, routine, plan, log, elapsed, onSaved])

  const reset = useCallback(() => {
    setScreen('today')
    setRoutine(null)
    setPlan([])
    setLog([])
    setExIdx(0)
    setElapsed(0)
    setRest(0)
  }, [])

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
    begin,
    finish,
    reset,
    toggleSet,
    bumpWeight: (d) => bump('weight', d),
    bumpReps: (d) => bump('reps', d),
    selectLift,
    skipRest,
  }
}
