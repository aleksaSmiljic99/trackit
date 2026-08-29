import { dateline, longClock, toDisplayVolume, toDisplayWeight } from '../lib/format.js'

export default function DoneScreen({ wk, prefs }) {
  const loggedSets = wk.log.flat().filter((s) => s.done)
  const volume = loggedSets.reduce((n, s) => n + s.weight * s.reps, 0)

  const rows = wk.plan.map((e, i) => {
    const done = wk.log[i].filter((s) => s.done)
    const ref = done.at(-1)
    return {
      name: e.name,
      detail: ref
        ? `${done.length} × ${ref.reps} @ ${toDisplayWeight(ref.weight, prefs.unit)}`
        : 'not logged',
    }
  })

  return (
    <div className="flex flex-col gap-[30px]">
      <div className="text-[13px] uppercase tracking-[0.14em] text-neutral-600">
        {dateline()} · logged
      </div>

      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[46px] font-semibold leading-[1.02]">{wk.routineName}</h1>
        <div className="text-[18px] text-neutral-700">
          {loggedSets.length} sets · {toDisplayVolume(volume, prefs.unit)} total volume ·{' '}
          {longClock(wk.elapsed)}
        </div>
        {wk.saving ? (
          <div className="text-[14px] text-neutral-600">Saving…</div>
        ) : null}
        {wk.error ? (
          <div className="text-[14px] text-magenta-700">{wk.error}</div>
        ) : null}
      </div>

      <div className="flex flex-col gap-[4px]">
        {rows.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[1fr_auto] gap-[15px] items-baseline py-[12px] border-t border-divider"
          >
            <div className="text-[19px] font-semibold">{r.name}</div>
            <div className="text-[17px] text-neutral-700 tabular-nums">{r.detail}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={wk.reset}
        className="bg-accent text-white text-[20px] font-semibold rounded-[2px] min-h-[56px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700"
      >
        Back to today
      </button>
    </div>
  )
}
