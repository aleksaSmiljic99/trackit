import { useState } from 'react'

export default function RoutinesScreen({ routines, loading, error, onNew, onEdit, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(null)

  return (
    <div className="flex flex-col gap-[30px]">
      <div className="flex flex-col gap-[10px]">
        <div className="text-[13px] uppercase tracking-[0.14em] text-neutral-600">
          Your split
        </div>
        <h1 className="text-[46px] font-semibold leading-[1.02] tracking-[-0.01em]">
          Workout days
        </h1>
        <p className="text-[17px] text-neutral-700">
          Each day is a list of exercises with target sets, reps and a starting
          weight. You can edit these any time.
        </p>
      </div>

      {loading ? (
        <div className="text-[15px] text-neutral-600">Loading…</div>
      ) : (
        <div className="flex flex-col">
          {routines.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_auto] gap-[15px] items-center py-[16px] border-t border-divider"
            >
              <div className="flex flex-col gap-[3px]">
                <div className="text-[21px] font-semibold leading-[1.2]">{r.name}</div>
                <div className="text-[14px] text-neutral-600">
                  {r.exercises.length} exercise{r.exercises.length === 1 ? '' : 's'}
                  {r.exercises.length
                    ? ` · ${r.exercises.map((e) => e.name).join(', ')}`
                    : ''}
                </div>
              </div>
              <div className="flex items-center gap-[14px]">
                <button
                  type="button"
                  onClick={() => onEdit(r)}
                  className="text-[13px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center hover:text-accent-600"
                >
                  Edit
                </button>
                {pendingDelete === r.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDelete(null)
                      onDelete(r.id)
                    }}
                    className="text-[13px] uppercase tracking-[0.12em] text-magenta-700 min-h-[44px] flex items-center"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(r.id)}
                    className="text-[13px] uppercase tracking-[0.12em] text-neutral-600 min-h-[44px] flex items-center hover:text-magenta-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {routines.length ? <div className="border-t border-divider" /> : null}
        </div>
      )}

      {error ? <div className="text-[14px] text-magenta-700">{error}</div> : null}

      <button
        type="button"
        onClick={onNew}
        className="self-start bg-accent text-white text-[20px] font-semibold rounded-[2px] min-h-[56px] px-[24px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700"
      >
        New workout day
      </button>
    </div>
  )
}
