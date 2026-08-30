import { dateline, loadLabel, longClock, toDisplayVolume, toDisplayWeight } from '../lib/format.js'
import { setVolume } from '../lib/stats.js'

function prLabel(hit, unit) {
  if (hit.kind === 'e1rm') {
    return `est. 1RM ${toDisplayWeight(Math.round(hit.value), unit)} (${toDisplayWeight(
      hit.weight,
      unit,
    )} × ${hit.reps})`
  }
  if (hit.kind === 'bw') {
    return `${loadLabel(hit.added, unit, 'bodyweight')} × ${hit.reps}`
  }
  return `heaviest set ${toDisplayWeight(hit.value, unit)}`
}

export default function DoneScreen({ wk, prefs }) {
  const loggedSets = wk.log.flat().filter((s) => s.done)
  const volume = wk.log.reduce(
    (sum, liftSets, i) =>
      sum +
      liftSets
        .filter((s) => s.done)
        .reduce((n, s) => n + setVolume(s.weight, s.reps, wk.plan[i]?.loadMode), 0),
    0,
  )

  const rows = wk.plan.map((e, i) => {
    const done = wk.log[i].filter((s) => s.done)
    const ref = done.at(-1)
    return {
      name: e.name,
      detail: ref
        ? `${done.length} × ${ref.reps} @ ${loadLabel(ref.weight, prefs.unit, e.loadMode)}`
        : 'not logged',
    }
  })

  return (
    <div className="flex flex-col gap-[30px]">
      <div className="text-[13px] tracking-[0.02em] text-neutral-600">
        {dateline()} · logged
      </div>

      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[34px] font-semibold leading-[1.02]">{wk.routineName}</h1>
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

      {wk.prs.length ? (
        <div className="flex flex-col gap-[10px] border border-accent-700 rounded p-[16px]">
          <div className="text-[13px] tracking-[0.02em] text-accent-700">
            New personal record{wk.prs.length > 1 ? 's' : ''}
          </div>
          {wk.prs.map((pr) => (
            <div key={pr.name} className="text-[16px] tabular-nums">
              <span className="font-semibold">{pr.name}</span>
              <span className="text-neutral-700">
                {' — '}
                {pr.hits.map((h) => prLabel(h, prefs.unit)).join(' · ')}
              </span>
            </div>
          ))}
        </div>
      ) : null}

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
        className="bg-accent text-white text-[20px] font-semibold rounded min-h-[56px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700"
      >
        Back to today
      </button>
    </div>
  )
}
