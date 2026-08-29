import { useEffect, useRef, useState } from 'react'
import { STARTER_ROUTINES } from '../lib/seed.js'
import { fromInputWeight, toInputWeight } from '../lib/format.js'

function blankRow(unit) {
  return { name: '', targetSets: 3, targetReps: 8, weight: toInputWeight(45, unit) }
}

function rowsFrom(routine, unit) {
  const src = routine?.exercises?.length ? routine.exercises : null
  if (!src) return [blankRow(unit)]
  return src.map((e) => ({
    name: e.name,
    targetSets: e.targetSets,
    targetReps: e.targetReps,
    weight: toInputWeight(e.startWeightLb, unit),
  }))
}

export default function RoutineEditorScreen({
  initial,
  unit,
  onToggleUnit,
  onSave,
  onCancel,
  onDelete,
}) {
  const editing = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [rows, setRows] = useState(() => rowsFrom(initial, unit))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Keep the weight fields meaningful if the unit is switched mid-edit:
  // re-express each value in the new unit (round-tripping through pounds).
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

  function patch(i, key, value) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [key]: value } : r)))
  }
  function addRow() {
    setRows((prev) => [...prev, blankRow(unit)])
  }
  function removeRow(i) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev))
  }
  function applyStarter(s) {
    setName(s.name)
    setRows(
      s.exercises.map((e) => ({
        name: e.name,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        weight: toInputWeight(e.startWeightLb, unit),
      })),
    )
  }

  async function save() {
    const cleaned = rows
      .map((r) => ({
        name: r.name.trim(),
        targetSets: Number(r.targetSets) || 1,
        targetReps: Number(r.targetReps) || 1,
        startWeightLb: fromInputWeight(r.weight, unit), // stored in pounds
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

  const numInput = 'input !w-[72px] text-center tabular-nums px-[6px]'
  const unitBtn = (u) =>
    'px-[8px] h-[24px] text-[12px] uppercase tracking-[0.08em] ' +
    (unit === u ? 'bg-accent text-white' : 'text-neutral-600 hover:text-accent-700')

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[10px]">
        <div className="text-[13px] uppercase tracking-[0.14em] text-neutral-600">
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
          <div className="text-[12px] uppercase tracking-[0.14em] text-neutral-600">
            Start from a template
          </div>
          <div className="flex flex-wrap gap-[10px]">
            {STARTER_ROUTINES.map((s) => (
              <button
                type="button"
                key={s.name}
                onClick={() => applyStarter(s)}
                className="px-[14px] py-[10px] min-h-[44px] flex items-center rounded-[2px] border border-neutral-400 text-neutral-800 text-[15px] hover:border-accent hover:text-accent-700"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-[12px]">
        <div className="grid grid-cols-[1fr_72px_72px_96px_32px] gap-[10px] items-center text-[12px] uppercase tracking-[0.14em] text-neutral-600">
          <div>Exercise</div>
          <div className="text-center">Sets</div>
          <div className="text-center">Reps</div>
          <div className="flex justify-center">
            {/* Weights are entered in whichever unit is active; the lb/kg
                switch here (and the one in the top bar) flips it and converts
                the values already typed. Storage is always pounds. */}
            <div className="inline-flex overflow-hidden rounded-[2px] border border-divider">
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

        {rows.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_72px_72px_96px_32px] gap-[10px] items-center"
          >
            <input
              className="input"
              placeholder="Bench Press"
              value={r.name}
              onChange={(e) => patch(i, 'name', e.target.value)}
            />
            <input
              className={numInput}
              type="number"
              min="1"
              inputMode="numeric"
              value={r.targetSets}
              onChange={(e) => patch(i, 'targetSets', e.target.value)}
            />
            <input
              className={numInput}
              type="number"
              min="1"
              inputMode="numeric"
              value={r.targetReps}
              onChange={(e) => patch(i, 'targetReps', e.target.value)}
            />
            <div className="flex items-center gap-[4px]">
              <input
                className="input !w-[68px] text-center tabular-nums px-[6px]"
                type="number"
                min="0"
                step={unit === 'kg' ? '2.5' : '5'}
                inputMode="decimal"
                value={r.weight}
                onChange={(e) => patch(i, 'weight', e.target.value)}
              />
              <span className="text-[13px] text-neutral-600">{unit}</span>
            </div>
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
        ))}

        <button
          type="button"
          onClick={addRow}
          className="self-start text-[13px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600"
        >
          + Add exercise
        </button>
      </div>

      <p className="text-[13px] text-neutral-600">
        Enter your working weight in {unit === 'kg' ? 'kilograms' : 'pounds'} — the
        app carries it forward each session and you bump it from the workout
        screen. Stored in pounds; the lb/kg toggle only changes what you see.
      </p>

      {error ? <div className="text-[14px] text-magenta-700">{error}</div> : null}

      <div className="flex flex-wrap items-center gap-[12px] pt-[4px]">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="bg-accent text-white text-[20px] font-semibold rounded-[2px] min-h-[56px] px-[24px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700 disabled:opacity-50"
        >
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Create day'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] uppercase tracking-[0.12em] text-neutral-600 min-h-[44px] flex items-center hover:text-accent-700"
        >
          Cancel
        </button>
        {editing ? (
          <button
            type="button"
            onClick={() => onDelete(initial.id)}
            className="ml-auto text-[13px] uppercase tracking-[0.12em] text-neutral-600 min-h-[44px] flex items-center hover:text-magenta-700"
          >
            Delete day
          </button>
        ) : null}
      </div>
    </div>
  )
}
