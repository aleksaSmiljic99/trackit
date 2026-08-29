import { useEffect, useMemo, useRef, useState } from 'react'
import { exerciseKey } from '../lib/stats.js'

const MUSCLE_ORDER = [
  'chest',
  'back',
  'lats',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'forearms',
  'traps',
]

function matches(ex, q) {
  if (!q) return true
  const hay = [ex.name, ...(ex.aliases ?? [])].join(' ').toLowerCase()
  return hay.includes(q)
}

// Full-screen library picker. Used from the routine editor and the mid-workout
// "Swap" action. When `suggestFor` is given, that exercise's substitutes (and
// same-muscle lifts) float to the top under "Swap suggestions".
export default function ExercisePicker({
  exercises,
  subs,
  byId,
  value = null,
  suggestFor = null,
  title = 'Choose exercise',
  onPick,
  onClose,
  onCreate,
}) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.trim().toLowerCase()

  const suggestions = useMemo(() => {
    const anchor = suggestFor ? byId.get(suggestFor) : null
    if (!anchor) return []
    const ids = new Set(subs.get(suggestFor) ?? [])
    for (const ex of exercises) {
      if (ex.id !== anchor.id && ex.primaryMuscle && ex.primaryMuscle === anchor.primaryMuscle) {
        ids.add(ex.id)
      }
    }
    return [...ids]
      .map((id) => byId.get(id))
      .filter((ex) => ex && !ex.isArchived && matches(ex, q))
  }, [suggestFor, byId, subs, exercises, q])

  const groups = useMemo(() => {
    const filtered = exercises.filter((ex) => matches(ex, q))
    const map = new Map()
    for (const ex of filtered) {
      const key = ex.primaryMuscle ?? 'other'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(ex)
    }
    const order = [...MUSCLE_ORDER, 'other']
    const rank = (m) => {
      const i = order.indexOf(m)
      return i === -1 ? 999 : i
    }
    return [...map.entries()].sort((a, b) => rank(a[0]) - rank(b[0]))
  }, [exercises, q])

  const exactHit = exercises.some((ex) => exerciseKey(ex.name) === exerciseKey(query))
  const canCreate = onCreate && query.trim().length >= 2 && !exactHit

  async function create() {
    setBusy(true)
    try {
      const ex = await onCreate(query.trim())
      if (ex) onPick(ex)
    } finally {
      setBusy(false)
    }
  }

  const Row = ({ ex }) => (
    <button
      type="button"
      onClick={() => onPick(ex)}
      className={
        'w-full text-left grid grid-cols-[1fr_auto] gap-[12px] items-baseline py-[12px] ' +
        'border-t border-divider min-h-[48px] hover:bg-accent-100 ' +
        (ex.id === value ? 'text-accent-700' : '')
      }
    >
      <span className="text-[17px] font-semibold leading-[1.15]">
        {ex.name}
        {ex.loadMode === 'bodyweight' ? (
          <span className="ml-[8px] text-[12px] uppercase tracking-[0.1em] text-neutral-600">
            BW
          </span>
        ) : null}
      </span>
      <span className="text-[13px] text-neutral-600 whitespace-nowrap">
        {[ex.equipment, ex.primaryMuscle].filter(Boolean).join(' · ')}
      </span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col">
      <div className="mx-auto w-full max-w-[620px] px-6 sm:px-8 py-5 flex flex-col gap-[14px] flex-1 min-h-0">
        <div className="flex items-center justify-between gap-[15px]">
          <div className="text-[13px] uppercase tracking-[0.14em] text-neutral-600">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center"
          >
            Close
          </button>
        </div>

        <input
          ref={inputRef}
          className="input"
          placeholder="Search exercises"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
          {canCreate ? (
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="w-full text-left py-[12px] border-t border-divider text-[16px] text-accent-700 min-h-[48px] disabled:opacity-50"
            >
              {busy ? 'Adding…' : `+ Add “${query.trim()}” as a new exercise`}
            </button>
          ) : null}

          {suggestions.length ? (
            <div className="mb-[10px]">
              <div className="text-[12px] uppercase tracking-[0.14em] text-neutral-600 pt-[14px] pb-[2px]">
                Swap suggestions
              </div>
              {suggestions.map((ex) => (
                <Row key={`s-${ex.id}`} ex={ex} />
              ))}
            </div>
          ) : null}

          {groups.map(([muscle, list]) => (
            <div key={muscle}>
              <div className="text-[12px] uppercase tracking-[0.14em] text-neutral-600 pt-[14px] pb-[2px]">
                {muscle}
              </div>
              {list.map((ex) => (
                <Row key={ex.id} ex={ex} />
              ))}
            </div>
          ))}

          {!groups.length && !suggestions.length && !canCreate ? (
            <div className="text-[15px] text-neutral-600 pt-[16px]">No matches.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
