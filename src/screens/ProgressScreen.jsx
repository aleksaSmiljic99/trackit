import { useMemo, useState } from 'react'
import { logDate, toDisplayVolume, toDisplayWeight } from '../lib/format.js'
import { exerciseProgress } from '../lib/stats.js'

// Tiny inline line chart of estimated 1RM over time. No library — it's one path.
function Spark({ points }) {
  const w = 300
  const h = 72
  const pad = 6

  const geom = useMemo(() => {
    const vals = points.map((p) => p.e1rm)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const range = max - min || 1
    return points.map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (w - pad * 2)
      const y = h - pad - ((p.e1rm - min) / range) * (h - pad * 2)
      return [x, y]
    })
  }, [points])

  const d = geom.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(' ')
  const last = geom[geom.length - 1]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-[72px]"
      preserveAspectRatio="none"
      role="img"
      aria-label="Estimated one-rep max over time"
    >
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--color-accent)" />
    </svg>
  )
}

function ExerciseCard({ ex, unit }) {
  const latest = ex.points[ex.points.length - 1]
  const first = ex.points[0]
  const deltaLb = latest.e1rm - first.e1rm
  const trend =
    ex.points.length < 2
      ? null
      : deltaLb > 0.5
        ? `▲ ${toDisplayWeight(Math.round(deltaLb), unit)} since ${logDate(first.date)}`
        : deltaLb < -0.5
          ? `▼ ${toDisplayWeight(Math.round(-deltaLb), unit)} since ${logDate(first.date)}`
          : `level since ${logDate(first.date)}`

  return (
    <div className="flex flex-col gap-[10px] py-[20px] border-t border-divider">
      <div className="flex items-baseline justify-between gap-[15px]">
        <div className="text-[21px] font-semibold leading-[1.15]">{ex.name}</div>
        <div className="text-[14px] text-neutral-600 tabular-nums whitespace-nowrap">
          {ex.sessions} session{ex.sessions === 1 ? '' : 's'}
        </div>
      </div>

      {ex.points.length >= 2 ? (
        <Spark points={ex.points} />
      ) : (
        <div className="text-[14px] text-neutral-600">
          One session so far — log another for a trend line.
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-[15px] gap-y-[6px] text-[15px] tabular-nums">
        <div className="text-neutral-600">Est. 1RM now</div>
        <div className="text-right font-semibold">
          {toDisplayWeight(Math.round(latest.e1rm), unit)}
        </div>
        <div className="text-neutral-600">Best est. 1RM</div>
        <div className="text-right">
          {toDisplayWeight(Math.round(ex.prE1rm.e1rm), unit)} · {logDate(ex.prE1rm.date)}
        </div>
        <div className="text-neutral-600">Heaviest set</div>
        <div className="text-right">
          {toDisplayWeight(ex.prWeight.topWeight, unit)} × {ex.prWeight.reps} ·{' '}
          {logDate(ex.prWeight.date)}
        </div>
      </div>

      {trend ? <div className="text-[14px] text-accent-700 tabular-nums">{trend}</div> : null}
    </div>
  )
}

export default function ProgressScreen({ logs, loading, error, unit }) {
  const exercises = useMemo(() => exerciseProgress(logs), [logs])
  const [query, setQuery] = useState('')

  const totalVolume = logs.reduce((n, s) => n + (s.volumeLb || 0), 0)
  const filtered = query
    ? exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    : exercises

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[10px]">
        <div className="text-[13px] uppercase tracking-[0.14em] text-neutral-600">
          Strength over time
        </div>
        <h1 className="text-[46px] font-semibold leading-[1.02] tracking-[-0.01em]">
          Progress
        </h1>
      </div>

      {loading ? (
        <div className="text-[15px] text-neutral-600">Loading…</div>
      ) : error ? (
        <div className="text-[14px] text-magenta-700">{error}</div>
      ) : !exercises.length ? (
        <p className="text-[17px] text-neutral-700">
          Log a few workouts and every lift charts here — estimated 1RM, personal
          records and how much you've added since you started.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-[20px] gap-y-[4px] text-[15px] text-neutral-700 tabular-nums">
            <span>{logs.length} sessions</span>
            <span>{exercises.length} exercises tracked</span>
            <span>{toDisplayVolume(totalVolume, unit)} lifted all-time</span>
          </div>

          {exercises.length > 6 ? (
            <input
              className="input"
              placeholder="Filter exercises"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          ) : null}

          <div className="flex flex-col">
            {filtered.map((ex) => (
              <ExerciseCard key={ex.name} ex={ex} unit={unit} />
            ))}
            <div className="border-t border-divider" />
          </div>
        </>
      )}
    </div>
  )
}
