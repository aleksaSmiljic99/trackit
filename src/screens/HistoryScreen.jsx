import { useState } from 'react'
import { loadLabel, logDate, longClock, toDisplayVolume } from '../lib/format.js'

const groupLetter = (n) => (n == null ? null : String.fromCharCode(65 + (n % 26)))

function SessionBlock({ session, unit, open, onToggle, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="border-t border-divider py-[18px]">
      <div className="grid grid-cols-[1fr_auto] gap-[15px] items-start">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-col gap-[4px] text-left"
          aria-expanded={open}
        >
          <span className="text-[13px] tracking-[0.02em] text-neutral-600">
            {logDate(session.performedOn)}
          </span>
          <span className="text-[25px] font-semibold leading-[1.1]">{session.name}</span>
        </button>
        <div className="flex items-center gap-[14px] pt-[2px]">
          <button
            type="button"
            onClick={onToggle}
            className="text-[13px] tracking-[0.02em] text-accent-700 min-h-[44px] flex items-center"
          >
            {open ? 'Hide' : 'View'}
          </button>
          <button
            type="button"
            onClick={() => onEdit(session)}
            className="text-[13px] tracking-[0.02em] text-neutral-600 min-h-[44px] flex items-center hover:text-accent-700"
          >
            Edit
          </button>
          {confirmDelete ? (
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false)
                onDelete(session.id)
              }}
              className="text-[13px] tracking-[0.02em] text-magenta-700 min-h-[44px] flex items-center"
            >
              Confirm
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-[13px] tracking-[0.02em] text-neutral-600 min-h-[44px] flex items-center hover:text-magenta-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="text-[15px] text-neutral-700 tabular-nums mt-[6px]">
        {session.setCount} sets · {toDisplayVolume(session.volumeLb, unit)} ·{' '}
        {longClock(session.elapsedSeconds)}
      </div>

      {open ? (
        <div className="flex flex-col gap-[14px] mt-[16px]">
          {session.lifts.map((lift, i) => {
            const gl = groupLetter(lift.supersetGroup)
            return (
              <div key={i} className="flex flex-col gap-[6px]">
                <div className="text-[17px] font-semibold">
                  {gl ? (
                    <span className="text-[13px] tracking-[0.02em] text-accent-700 mr-[6px]">
                      {gl}
                    </span>
                  ) : null}
                  {lift.name}
                </div>
                {lift.sets.length ? (
                  <div className="flex flex-wrap gap-x-[16px] gap-y-[4px] text-[16px] text-neutral-800 tabular-nums">
                    {lift.sets.map((s, j) => {
                      const drop =
                        s.dropGroup != null &&
                        j > 0 &&
                        lift.sets[j - 1].dropGroup === s.dropGroup
                      return (
                        <span key={j}>
                          {drop ? '↳ ' : ''}
                          {loadLabel(s.weight, unit, lift.loadMode)} × {s.reps}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-[15px] text-neutral-600">not logged</div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default function HistoryScreen({ logs, loading, error, unit, onEdit, onDelete }) {
  const [openId, setOpenId] = useState(null)

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[10px]">
        <div className="text-[13px] tracking-[0.02em] text-neutral-600">
          Every session
        </div>
        <h1 className="text-[34px] font-semibold leading-[1.02] tracking-[-0.02em]">
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
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          <div className="border-t border-divider" />
        </div>
      )}
    </div>
  )
}
