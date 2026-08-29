import { useEffect, useRef, useState } from 'react'
import { fromInputWeight, toInputWeight } from '../lib/format.js'

function liftsFrom(session, unit) {
  return (session.lifts ?? []).map((lift) => ({
    name: lift.name,
    sets: (lift.sets ?? []).map((s) => ({
      weight: toInputWeight(s.weight, unit),
      reps: s.reps,
    })),
  }))
}

export default function SessionEditorScreen({
  session,
  unit,
  onToggleUnit,
  onSave,
  onCancel,
  onDelete,
}) {
  const [name, setName] = useState(session.name ?? '')
  const [dateStr, setDateStr] = useState(
    (session.performedOn ?? new Date().toISOString()).slice(0, 10),
  )
  const [minutes, setMinutes] = useState(
    Math.round((session.elapsedSeconds ?? 0) / 60),
  )
  const [lifts, setLifts] = useState(() => liftsFrom(session, unit))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Re-express weights if the unit is switched mid-edit (see RoutineEditor).
  const prevUnit = useRef(unit)
  useEffect(() => {
    if (prevUnit.current === unit) return
    const from = prevUnit.current
    prevUnit.current = unit
    setLifts((prev) =>
      prev.map((lift) => ({
        ...lift,
        sets: lift.sets.map((s) => ({
          ...s,
          weight: toInputWeight(fromInputWeight(s.weight, from), unit),
        })),
      })),
    )
  }, [unit])

  function patchSet(li, si, key, value) {
    setLifts((prev) =>
      prev.map((lift, j) =>
        j !== li
          ? lift
          : {
              ...lift,
              sets: lift.sets.map((s, k) => (k === si ? { ...s, [key]: value } : s)),
            },
      ),
    )
  }
  function patchName(li, value) {
    setLifts((prev) => prev.map((lift, j) => (j === li ? { ...lift, name: value } : lift)))
  }
  function addSet(li) {
    setLifts((prev) =>
      prev.map((lift, j) => {
        if (j !== li) return lift
        const ref = lift.sets[lift.sets.length - 1] ?? { weight: toInputWeight(45, unit), reps: 8 }
        return { ...lift, sets: [...lift.sets, { ...ref }] }
      }),
    )
  }
  function removeSet(li, si) {
    setLifts((prev) =>
      prev.map((lift, j) =>
        j !== li ? lift : { ...lift, sets: lift.sets.filter((_, k) => k !== si) },
      ),
    )
  }
  function removeLift(li) {
    setLifts((prev) => prev.filter((_, j) => j !== li))
  }
  function addLift() {
    setLifts((prev) => [...prev, { name: '', sets: [{ weight: toInputWeight(45, unit), reps: 8 }] }])
  }

  async function save() {
    const cleaned = lifts
      .map((lift) => ({
        name: lift.name.trim(),
        sets: lift.sets
          .map((s) => ({
            weight: fromInputWeight(s.weight, unit),
            reps: Math.max(0, Math.round(Number(s.reps) || 0)),
            done: true,
          }))
          .filter((s) => s.reps > 0),
      }))
      .filter((lift) => lift.name && lift.sets.length)

    if (!name.trim()) return setError('Give this session a name.')
    if (!cleaned.length) return setError('A session needs at least one lift with a logged set.')

    setBusy(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        performedOn: dateStr,
        elapsedSeconds: Math.max(0, Math.round(Number(minutes) || 0)) * 60,
        lifts: cleaned,
      })
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
          Edit session
        </div>
        <input
          className="w-full min-h-[56px] text-[28px] font-semibold bg-transparent border-b border-divider focus-visible:border-accent outline-none pb-[4px]"
          placeholder="Session name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-[20px]">
        <label className="field">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-neutral-600 mb-[5px]">
            Date
          </span>
          <input
            type="date"
            className="input !w-[180px]"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-neutral-600 mb-[5px]">
            Minutes
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            className="input !w-[100px] text-center tabular-nums"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <div className="inline-flex overflow-hidden rounded-[2px] border border-divider">
          <button type="button" className={unitBtn('lb')} onClick={() => unit !== 'lb' && onToggleUnit()}>
            lb
          </button>
          <button type="button" className={unitBtn('kg')} onClick={() => unit !== 'kg' && onToggleUnit()}>
            kg
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-[20px]">
        {lifts.map((lift, li) => (
          <div key={li} className="flex flex-col gap-[10px] border-t border-divider pt-[16px]">
            <div className="flex items-center gap-[10px]">
              <input
                className="input"
                placeholder="Exercise"
                value={lift.name}
                onChange={(e) => patchName(li, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeLift(li)}
                aria-label="remove lift"
                className="w-[32px] h-[44px] shrink-0 flex items-center justify-center text-[20px] text-neutral-500 hover:text-magenta-700"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-[28px_1fr_1fr_32px] gap-[10px] text-[12px] uppercase tracking-[0.12em] text-neutral-600">
              <div>Set</div>
              <div>Weight ({unit})</div>
              <div>Reps</div>
              <div />
            </div>

            {lift.sets.map((s, si) => (
              <div key={si} className="grid grid-cols-[28px_1fr_1fr_32px] gap-[10px] items-center">
                <span className="text-[15px] text-neutral-600 tabular-nums">{si + 1}</span>
                <input
                  className="input text-center tabular-nums"
                  type="number"
                  min="0"
                  step={unit === 'kg' ? '2.5' : '5'}
                  inputMode="decimal"
                  value={s.weight}
                  onChange={(e) => patchSet(li, si, 'weight', e.target.value)}
                />
                <input
                  className="input text-center tabular-nums"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={s.reps}
                  onChange={(e) => patchSet(li, si, 'reps', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeSet(li, si)}
                  aria-label="remove set"
                  className="w-[32px] h-[44px] flex items-center justify-center text-[18px] text-neutral-500 hover:text-magenta-700"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addSet(li)}
              className="self-start text-[13px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600"
            >
              + Add set
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addLift}
          className="self-start text-[13px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600 border-t border-divider pt-[16px] w-full"
        >
          + Add exercise
        </button>
      </div>

      {error ? <div className="text-[14px] text-magenta-700">{error}</div> : null}

      <div className="flex flex-wrap items-center gap-[12px] pt-[4px]">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="bg-accent text-white text-[20px] font-semibold rounded-[2px] min-h-[56px] px-[24px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] uppercase tracking-[0.12em] text-neutral-600 min-h-[44px] flex items-center hover:text-accent-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onDelete(session.id)}
          className="ml-auto text-[13px] uppercase tracking-[0.12em] text-neutral-600 min-h-[44px] flex items-center hover:text-magenta-700"
        >
          Delete session
        </button>
      </div>
    </div>
  )
}
