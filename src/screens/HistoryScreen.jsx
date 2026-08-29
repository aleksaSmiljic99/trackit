import { useState } from 'react'
import { logDate, longClock, toDisplayVolume, toDisplayWeight } from '../lib/format.js'

function SessionBlock({ session, unit, open, onToggle }) {
  return (
    <div className="border-t border-divider py-[18px]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full grid grid-cols-[1fr_auto] gap-[15px] items-baseline text-left"
        aria-expanded={open}
      >
        <div className="flex flex-col gap-[4px]">
          <div className="text-[13px] uppercase tracking-[0.14em] text-neutral-600">
            {logDate(session.performedOn)}
          </div>
          <div className="text-[25px] font-semibold leading-[1.1]">{session.name}</div>
        </div>
        <div className="text-[13px] uppercase tracking-[0.12em] text-accent-700">
          {open ? 'Hide' : 'View'}
        </div>
      </button>

      <div className="text-[15px] text-neutral-700 tabular-nums mt-[6px]">
        {session.setCount} sets · {toDisplayVolume(session.volumeLb, unit)} ·{' '}
        {longClock(session.elapsedSeconds)}
      </div>

      {open ? (
        <div className="flex flex-col gap-[14px] mt-[16px]">
          {session.lifts.map((lift, i) => (
            <div key={i} className="flex flex-col gap-[6px]">
              <div className="text-[17px] font-semibold">{lift.name}</div>
              {lift.sets.length ? (
                <div className="flex flex-wrap gap-x-[16px] gap-y-[4px] text-[16px] text-neutral-800 tabular-nums">
                  {lift.sets.map((s, j) => (
                    <span key={j}>
                      {toDisplayWeight(s.weight, unit)} × {s.reps}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[15px] text-neutral-600">not logged</div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function HistoryScreen({ logs, loading, error, unit }) {
  const [openId, setOpenId] = useState(null)

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[10px]">
        <div className="text-[13px] uppercase tracking-[0.14em] text-neutral-600">
          Every session
        </div>
        <h1 className="text-[46px] font-semibold leading-[1.02] tracking-[-0.01em]">
          History
        </h1>
      </div>

      {loading ? (
        <div className="text-[15px] text-neutral-600">Loading…</div>
      ) : error ? (
        <div className="text-[14px] text-magenta-700">{error}</div>
      ) : !logs.length ? (
        <p className="text-[17px] text-neutral-700">
          No workouts logged yet. Finish a session and it shows up here.
        </p>
      ) : (
        <div className="flex flex-col">
          {logs.map((s) => (
            <SessionBlock
              key={s.id}
              session={s}
              unit={unit}
              open={openId === s.id}
              onToggle={() => setOpenId((cur) => (cur === s.id ? null : s.id))}
            />
          ))}
          <div className="border-t border-divider" />
        </div>
      )}
    </div>
  )
}
