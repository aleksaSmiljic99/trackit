import { useState } from 'react'
import { clock, loadLabel } from '../lib/format.js'
import ExercisePicker from '../components/ExercisePicker.jsx'

const groupLetter = (n) => (n == null ? null : String.fromCharCode(65 + (n % 26)))

function Stepper({ onDown, onUp, children, minW }) {
  const btn =
    'w-[44px] h-[44px] border border-neutral-400 rounded-[2px] flex items-center justify-center text-[22px] hover:border-accent hover:text-accent-700'
  return (
    <div className="flex items-center gap-[12px]">
      <button type="button" onClick={onDown} className={btn} aria-label="decrease">
        −
      </button>
      <div className="text-[20px] text-center tabular-nums" style={{ minWidth: minW }}>
        {children}
      </div>
      <button type="button" onClick={onUp} className={btn} aria-label="increase">
        +
      </button>
    </div>
  )
}

export default function WorkScreen({ wk, prefs, library }) {
  const [swapping, setSwapping] = useState(false)
  const rows = wk.log[wk.exIdx]
  const cur = wk.plan[wk.exIdx]
  const bw = cur.loadMode === 'bodyweight'
  const doneCount = rows.filter((s) => s.done).length
  const pendingIdx = rows.findIndex((s) => !s.done)
  const next = pendingIdx >= 0 ? rows[pendingIdx] : rows[rows.length - 1]
  const letter = groupLetter(cur.supersetGroup)

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-[15px]">
        <div className="text-[15px] uppercase tracking-[0.14em] text-neutral-700 tabular-nums">
          {clock(wk.elapsed)} elapsed
        </div>
        <button
          type="button"
          onClick={wk.finish}
          className="text-[15px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600"
        >
          Finish
        </button>
      </div>

      {/* Lift header */}
      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center justify-between gap-[12px]">
          <div className="text-[13px] uppercase tracking-[0.14em] text-neutral-600">
            Lift {wk.exIdx + 1} of {wk.plan.length}
            {letter ? <span className="text-accent-700"> · Superset {letter}</span> : null}
          </div>
          <button
            type="button"
            onClick={() => setSwapping(true)}
            className="text-[13px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600"
          >
            Swap
          </button>
        </div>
        <h2 className="text-[38px] font-semibold leading-[1.05]">{cur.name}</h2>
        <div className="text-[16px] text-neutral-700">
          {doneCount} of {rows.length} sets logged · target {cur.reps} reps
          {bw ? ' · bodyweight' : ''}
        </div>
        {cur.last ? (
          <div className="text-[15px] text-neutral-600 tabular-nums">
            Last time · {loadLabel(cur.last.weight, prefs.unit, cur.loadMode)} × {cur.last.reps}
          </div>
        ) : null}
      </div>

      {/* Set table */}
      <div className="flex flex-col">
        <div className="grid grid-cols-[34px_1fr_1fr_44px] gap-[10px] text-[12px] uppercase tracking-[0.14em] text-neutral-600 pb-[8px]">
          <div>Set</div>
          <div>Weight</div>
          <div>Reps</div>
          <div />
        </div>
        {rows.map((s, i) => {
          const drop = s.dropGroup != null && i > 0 && rows[i - 1].dropGroup === s.dropGroup
          return (
            <div key={i} className="flex flex-col">
              <button
                type="button"
                onClick={() => wk.toggleSet(i)}
                className="grid grid-cols-[34px_1fr_1fr_44px] gap-[10px] items-center min-h-[60px] text-left border-t border-divider tabular-nums hover:bg-accent-100"
              >
                <span className="text-[17px] text-neutral-600">
                  {drop ? '↳' : i + 1}
                </span>
                <span
                  className={
                    s.done
                      ? 'text-[23px] font-semibold text-ink'
                      : 'text-[23px] text-neutral-500'
                  }
                >
                  {loadLabel(s.weight, prefs.unit, cur.loadMode)}
                </span>
                <span
                  className={
                    s.done
                      ? 'text-[23px] font-semibold text-ink'
                      : 'text-[23px] text-neutral-500'
                  }
                >
                  × {s.reps}
                </span>
                <span
                  className={
                    s.done
                      ? 'flex items-center justify-end text-accent-700 text-[24px]'
                      : 'flex items-center justify-end text-neutral-400 text-[22px]'
                  }
                >
                  {s.done ? '✓' : '□'}
                </span>
              </button>
              {s.done ? (
                <button
                  type="button"
                  onClick={() => wk.addDrop(i)}
                  className="self-start text-[11px] uppercase tracking-[0.12em] text-neutral-600 min-h-[32px] flex items-center hover:text-accent-700 pl-[44px]"
                >
                  ＋ Drop set
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Adjust next set */}
      {pendingIdx >= 0 ? (
        <div className="flex flex-col gap-[12px]">
          <div className="text-[12px] uppercase tracking-[0.14em] text-neutral-600">
            Adjust next set
          </div>
          <div className="flex gap-[30px]">
            <Stepper
              onDown={() => wk.bumpWeight(prefs.unit === 'kg' ? -2.5 : -5)}
              onUp={() => wk.bumpWeight(prefs.unit === 'kg' ? 2.5 : 5)}
              minW="90px"
            >
              {loadLabel(next.weight, prefs.unit, cur.loadMode)}
            </Stepper>
            <Stepper
              onDown={() => wk.bumpReps(-1)}
              onUp={() => wk.bumpReps(1)}
              minW="54px"
            >
              {next.reps} reps
            </Stepper>
          </div>
        </div>
      ) : null}

      {/* Rest timer */}
      {wk.rest > 0 ? (
        <div className="flex items-center justify-between gap-[15px] animate-rest">
          <div className="text-[22px] font-semibold text-magenta-700 tabular-nums">
            Rest {clock(wk.rest)}
          </div>
          <button
            type="button"
            onClick={wk.skipRest}
            className="text-[14px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600"
          >
            Skip
          </button>
        </div>
      ) : null}

      {/* Lift chips */}
      <div className="flex flex-col gap-[12px] pt-[20px] border-t border-divider">
        <div className="text-[12px] uppercase tracking-[0.14em] text-neutral-600">
          Today’s lifts
        </div>
        <div className="flex flex-wrap gap-[10px]">
          {wk.plan.map((e, i) => {
            const active = i === wk.exIdx
            const count = wk.log[i].filter((s) => s.done).length
            const gl = groupLetter(e.supersetGroup)
            return (
              <button
                type="button"
                key={i}
                onClick={() => wk.selectLift(i)}
                className={
                  active
                    ? 'px-[14px] py-[10px] min-h-[44px] flex items-center rounded-[2px] bg-accent text-white text-[15px]'
                    : 'px-[14px] py-[10px] min-h-[44px] flex items-center rounded-[2px] border border-neutral-400 text-neutral-800 text-[15px] hover:border-accent hover:text-accent-700'
                }
              >
                {gl ? `${gl}· ` : ''}
                {active ? e.name : `${e.name} ${count}/${e.sets}`}
              </button>
            )
          })}
        </div>
      </div>

      {swapping && library ? (
        <ExercisePicker
          exercises={library.active}
          subs={library.subs}
          byId={library.byId}
          value={cur.exerciseId}
          suggestFor={cur.exerciseId}
          title={`Swap ${cur.name}`}
          onPick={(ex) => {
            wk.swapLift(wk.exIdx, ex)
            setSwapping(false)
          }}
          onClose={() => setSwapping(false)}
          onCreate={(n) => library.create({ name: n })}
        />
      ) : null}
    </div>
  )
}
