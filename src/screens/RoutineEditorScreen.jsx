import { useEffect, useRef, useState } from 'react'
import { STARTER_ROUTINES } from '../lib/seed.js'
import { fromInputWeight, toInputWeight } from '../lib/format.js'
import { exerciseKey } from '../lib/stats.js'
import ExercisePicker from '../components/ExercisePicker.jsx'

function blankRow(unit) {
  return {
    exerciseId: null,
    name: '',
    loadMode: 'external',
    supersetGroup: null,
    targetSets: 3,
    targetReps: 8,
    weight: toInputWeight(45, unit),
  }
}

function rowsFrom(routine, unit) {
  const src = routine?.exercises?.length ? routine.exercises : null
  if (!src) return [blankRow(unit)]
  return src.map((e) => ({
    exerciseId: e.exerciseId ?? null,
    name: e.name,
    loadMode: e.loadMode ?? 'external',
    supersetGroup: e.supersetGroup ?? null,
    targetSets: e.targetSets,
    targetReps: e.targetReps,
    weight: toInputWeight(e.startWeightLb, unit),
  }))
}

const groupLetter = (n) => (n == null ? null : String.fromCharCode(65 + (n % 26)))

// On save, drop any superset group left with only one member — a group of one
// isn't a superset.
function pruneGroups(rows) {
  const counts = new Map()
  for (const r of rows) {
    if (r.supersetGroup != null) counts.set(r.supersetGroup, (counts.get(r.supersetGroup) ?? 0) + 1)
  }
  return rows.map((r) =>
    r.supersetGroup != null && counts.get(r.supersetGroup) < 2
      ? { ...r, supersetGroup: null }
      : r,
  )
}

export default function RoutineEditorScreen({
  initial,
  unit,
  onToggleUnit,
  library,
  onSave,
  onCancel,
  onDelete,
}) {
  const editing = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [rows, setRows] = useState(() => rowsFrom(initial, unit))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [pickerFor, setPickerFor] = useState(null) // row index

  const prevUnit = useRef(unit)
  useEffect(() => {
    if (prevUnit.current === unit) return
    const from = prevUnit.current
    prevUnit.current = unit
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        weight: toInputWeight(fromInputWeight(r.weight, from), unit),
      })),
    )
  }, [unit])

  function patch(i, obj) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...obj } : r)))
  }
  function addRow() {
    setRows((prev) => [...prev, blankRow(unit)])
  }
  function removeRow(i) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev))
  }

  // Supersets are adjacent exercises chained together. `links` is the set of
  // boundary indices (between row i and i+1) that are joined; groups are numbered
  // left to right from it.
  function currentLinks(list) {
    const s = new Set()
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].supersetGroup != null && list[i].supersetGroup === list[i + 1].supersetGroup) {
        s.add(i)
      }
    }
    return s
  }
  function regroup(list, links) {
    const next = list.map((r) => ({ ...r, supersetGroup: null }))
    let g = 0
    for (let i = 0; i < next.length - 1; i++) {
      if (!links.has(i)) continue
      if (next[i].supersetGroup == null) {
        next[i].supersetGroup = g
        next[i + 1].supersetGroup = g
        g += 1
      } else {
        next[i + 1].supersetGroup = next[i].supersetGroup
      }
    }
    return next
  }
  function toggleLink(i) {
    setRows((prev) => {
      const links = currentLinks(prev)
      if (links.has(i)) links.delete(i)
      else links.add(i)
      return regroup(prev, links)
    })
  }

  function applyStarter(s) {
    setName(s.name)
    setRows(
      s.exercises.map((e) => {
        const lib = library?.index?.get(exerciseKey(e.name)) ?? null
        return {
          exerciseId: lib?.id ?? null,
          name: lib?.name ?? e.name,
          loadMode: lib?.loadMode ?? 'external',
          supersetGroup: null,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          weight: toInputWeight(e.startWeightLb, unit),
        }
      }),
    )
  }

  function pickExercise(i, ex) {
    patch(i, {
      exerciseId: ex.id,
      name: ex.name,
      loadMode: ex.loadMode ?? 'external',
      // Moving to a bodyweight lift: default the "added" load to 0.
      weight: ex.loadMode === 'bodyweight' && rows[i].loadMode !== 'bodyweight' ? 0 : rows[i].weight,
    })
    setPickerFor(null)
  }

  async function save() {
    const cleaned = pruneGroups(rows)
      .map((r) => ({
        name: r.name.trim(),
        exerciseId: r.exerciseId ?? null,
        loadMode: r.loadMode === 'bodyweight' ? 'bodyweight' : 'external',
        supersetGroup: r.supersetGroup,
        targetSets: Number(r.targetSets) || 1,
        targetReps: Number(r.targetReps) || 1,
        startWeightLb:
          r.loadMode === 'bodyweight' ? 0 : fromInputWeight(r.weight, unit),
      }))
      .filter((r) => r.name)

    if (!name.trim()) return setError('Give this day a name.')
    if (!cleaned.length) return setError('Add at least one exercise.')

    setBusy(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), exercises: cleaned })
    } catch (e) {
      setError(e.message ?? String(e))
      setBusy(false)
    }
  }

  const unitBtn = (u) =>
    'px-[8px] h-[24px] text-[12px] tracking-[0.02em] ' +
    (unit === u ? 'bg-accent text-white' : 'text-neutral-600 hover:text-accent-700')

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[10px]">
        <div className="text-[13px] tracking-[0.02em] text-neutral-600">
          {editing ? 'Edit day' : 'New day'}
        </div>
        <input
          className="w-full min-h-[56px] text-[28px] font-semibold bg-transparent border-b border-divider focus-visible:border-accent outline-none pb-[4px]"
          placeholder="e.g. Push A"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {!editing ? (
        <div className="flex flex-col gap-[10px]">
          <div className="text-[12px] tracking-[0.02em] text-neutral-600">
            Start from a template
          </div>
          <div className="flex flex-wrap gap-[10px]">
            {STARTER_ROUTINES.map((s) => (
              <button
                type="button"
                key={s.name}
                onClick={() => applyStarter(s)}
                className="px-[14px] py-[10px] min-h-[44px] flex items-center rounded border border-neutral-400 text-neutral-800 text-[15px] hover:border-accent hover:text-accent-700"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-[12px]">
        <div className="grid grid-cols-[72px_72px_96px_32px] sm:grid-cols-[1fr_72px_72px_96px_32px] gap-[10px] items-center text-[12px] tracking-[0.02em] text-neutral-600">
          <div className="hidden sm:block">Exercise</div>
          <div className="text-center">Sets</div>
          <div className="text-center">Reps</div>
          <div className="flex justify-start">
            <div className="inline-flex overflow-hidden rounded border border-divider">
              <button type="button" className={unitBtn('lb')} onClick={() => unit !== 'lb' && onToggleUnit()}>
                lb
              </button>
              <button type="button" className={unitBtn('kg')} onClick={() => unit !== 'kg' && onToggleUnit()}>
                kg
              </button>
            </div>
          </div>
          <div />
        </div>

        {rows.map((r, i) => {
          const bw = r.loadMode === 'bodyweight'
          const letter = groupLetter(r.supersetGroup)
          const linkedAfter =
            i < rows.length - 1 &&
            r.supersetGroup != null &&
            r.supersetGroup === rows[i + 1].supersetGroup
          return (
            <div key={i} className="flex flex-col gap-[8px]">
              <div className="grid grid-cols-[72px_72px_96px_32px] sm:grid-cols-[1fr_72px_72px_96px_32px] gap-[10px] items-center">
                <button
                  type="button"
                  onClick={() => setPickerFor(i)}
                  className="input col-span-4 sm:col-span-1 flex items-center gap-[8px] text-left hover:border-accent"
                >
                  {letter ? (
                    <span className="shrink-0 text-[13px] font-semibold text-accent-700">
                      {letter}
                    </span>
                  ) : null}
                  <span className={'truncate ' + (r.name ? '' : 'text-neutral-600')}>
                    {r.name || 'Choose exercise'}
                  </span>
                  {bw ? (
                    <span className="ml-auto shrink-0 text-[11px] tracking-[0.02em] text-neutral-600">
                      BW
                    </span>
                  ) : null}
                </button>
                <input
                  className="input !w-[72px] text-center tabular-nums px-[6px]"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={r.targetSets}
                  onChange={(e) => patch(i, { targetSets: e.target.value })}
                />
                <input
                  className="input !w-[72px] text-center tabular-nums px-[6px]"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={r.targetReps}
                  onChange={(e) => patch(i, { targetReps: e.target.value })}
                />
                {bw ? (
                  <div className="flex items-center justify-center text-[15px] text-neutral-600 tabular-nums">
                    BW
                  </div>
                ) : (
                  <div className="flex items-center gap-[4px]">
                    <input
                      className="input !w-[68px] text-center tabular-nums px-[6px]"
                      type="number"
                      min="0"
                      step={unit === 'kg' ? '2.5' : '5'}
                      inputMode="decimal"
                      value={r.weight}
                      onChange={(e) => patch(i, { weight: e.target.value })}
                    />
                    <span className="text-[13px] text-neutral-600">{unit}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label="remove exercise"
                  className="w-[32px] h-[44px] flex items-center justify-center text-[20px] text-neutral-500 hover:text-magenta-700 disabled:opacity-30"
                  disabled={rows.length === 1}
                >
                  ×
                </button>
              </div>

              {i < rows.length - 1 ? (
                <button
                  type="button"
                  onClick={() => toggleLink(i)}
                  aria-pressed={linkedAfter}
                  aria-label={linkedAfter ? 'Unlink superset' : 'Link as superset'}
                  className={
                    'self-start text-[11px] tracking-[0.02em] h-[20px] flex items-center gap-[6px] ' +
                    (linkedAfter
                      ? 'text-accent-700'
                      : 'text-neutral-400 hover:text-accent-700')
                  }
                >
                  ⛓{linkedAfter ? ' superset' : ''}
                </button>
              ) : null}
            </div>
          )
        })}

        <button
          type="button"
          onClick={addRow}
          className="self-start text-[13px] tracking-[0.02em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600"
        >
          + Add exercise
        </button>
      </div>

      <p className="text-[13px] text-neutral-600">
        Working weight is in {unit === 'kg' ? 'kilograms' : 'pounds'} and carried forward
        each session — bump it from the workout screen. Bodyweight lifts show “BW”; add
        weight or assistance live during the workout. Use the ⛓ link between two exercises
        to make them a superset (done back-to-back, no rest between).
      </p>

      {error ? <div className="text-[14px] text-magenta-700">{error}</div> : null}

      <div className="flex flex-wrap items-center gap-[12px] pt-[4px]">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="bg-accent text-white text-[20px] font-semibold rounded min-h-[56px] px-[24px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700 disabled:opacity-50"
        >
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Create day'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] tracking-[0.02em] text-neutral-600 min-h-[44px] flex items-center hover:text-accent-700"
        >
          Cancel
        </button>
        {editing ? (
          <button
            type="button"
            onClick={() => onDelete(initial.id)}
            className="ml-auto text-[13px] tracking-[0.02em] text-neutral-600 min-h-[44px] flex items-center hover:text-magenta-700"
          >
            Delete day
          </button>
        ) : null}
      </div>

      {pickerFor != null ? (
        <ExercisePicker
          exercises={library.active}
          subs={library.subs}
          byId={library.byId}
          value={rows[pickerFor].exerciseId}
          title="Choose exercise"
          onPick={(ex) => pickExercise(pickerFor, ex)}
          onClose={() => setPickerFor(null)}
          onCreate={(n) => library.create({ name: n })}
        />
      ) : null}
    </div>
  )
}
