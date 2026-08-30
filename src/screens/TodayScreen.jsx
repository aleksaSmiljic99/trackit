import { useEffect, useState } from 'react'
import { dateline, since, toDisplayVolume, toDisplayWeight } from '../lib/format.js'

export default function TodayScreen({
  routines,
  routinesLoading,
  recent,
  wk,
  prefs,
  onManage,
}) {
  const [selectedId, setSelectedId] = useState(routines[0]?.id ?? null)

  const resumable = wk.resumable
  const resumeBanner = resumable ? (
    <div className="flex flex-col gap-[12px] bg-surface border border-divider rounded-xl p-[18px]">
      <div className="text-[12px] tracking-[0.02em] text-accent-700">
        Workout in progress
      </div>
      <div className="text-[21px] font-semibold leading-[1.15]">
        {resumable.routine?.name ?? 'Workout'}
      </div>
      <div className="text-[14px] text-neutral-700 tabular-nums">
        {resumable.log?.flat().filter((s) => s.done).length ?? 0} sets logged ·
        started {since(resumable.startedAt ?? resumable.savedAt)}
      </div>
      <div className="flex items-center gap-[16px]">
        <button
          type="button"
          onClick={wk.resume}
          className="bg-accent text-white text-[17px] font-semibold rounded min-h-[48px] px-[20px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700"
        >
          Resume
        </button>
        <button
          type="button"
          onClick={wk.discardSaved}
          className="text-[13px] tracking-[0.02em] text-neutral-600 min-h-[44px] flex items-center hover:text-magenta-700"
        >
          Discard
        </button>
      </div>
    </div>
  ) : null

  useEffect(() => {
    if (!routines.some((r) => r.id === selectedId)) {
      setSelectedId(routines[0]?.id ?? null)
    }
  }, [routines, selectedId])

  const selected = routines.find((r) => r.id === selectedId) ?? null

  if (routinesLoading) {
    return <div className="text-[15px] text-neutral-600">Loading…</div>
  }

  if (!routines.length) {
    return (
      <div className="flex flex-col gap-[20px]">
        {resumeBanner}
        <div className="text-[13px] tracking-[0.02em] text-neutral-600">
          {dateline()}
        </div>
        <h1 className="text-[34px] font-semibold leading-[1.02] tracking-[-0.02em]">
          Build your split
        </h1>
        <p className="text-[17px] text-neutral-700">
          Set up your workout days and their exercises once. Every session after
          that prefills from the last one, so you just tap to log.
        </p>
        <button
          type="button"
          onClick={onManage}
          className="self-start bg-accent text-white text-[20px] font-semibold rounded min-h-[56px] px-[24px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700"
        >
          Create your first day
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[30px]">
      {resumeBanner}
      <div className="flex flex-col gap-[10px]">
        <div className="text-[13px] tracking-[0.02em] text-neutral-600">
          {dateline()}
        </div>

        {/* Day picker */}
        <div className="flex flex-wrap gap-[10px] pt-[2px]">
          {routines.map((r) => {
            const active = r.id === selectedId
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={
                  active
                    ? 'px-[14px] py-[10px] min-h-[44px] flex items-center rounded bg-accent text-white text-[15px]'
                    : 'px-[14px] py-[10px] min-h-[44px] flex items-center rounded border border-neutral-400 text-neutral-800 text-[15px] hover:border-accent hover:text-accent-700'
                }
              >
                {r.name}
              </button>
            )
          })}
        </div>

        <h1 className="text-[34px] font-semibold leading-[1.02] tracking-[-0.02em] pt-[6px]">
          {selected?.name}
        </h1>
        <div className="text-[17px] text-neutral-700">
          {selected?.exercises.length
            ? `${selected.exercises.length} exercise${
                selected.exercises.length > 1 ? 's' : ''
              }`
            : 'No exercises yet'}
        </div>
      </div>

      {/* Plan list */}
      <div className="flex flex-col gap-[4px]">
        {selected?.exercises.map((e) => (
          <div
            key={e.id}
            className="grid grid-cols-[1fr_auto] gap-[15px] items-baseline py-[14px] min-h-[44px]"
          >
            <div className="text-[21px] font-semibold leading-[1.2]">{e.name}</div>
            <div className="text-[19px] text-neutral-800 whitespace-nowrap tabular-nums">
              {e.targetSets} × {e.targetReps}
              {'  ·  '}
              {toDisplayWeight(e.startWeightLb, prefs.unit)}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => selected && wk.begin(selected)}
        disabled={!selected?.exercises.length || wk.starting}
        className="bg-accent text-white text-[20px] font-semibold tracking-[0.02em] rounded min-h-[56px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700 disabled:opacity-50"
      >
        {wk.starting ? 'Loading…' : 'Begin workout'}
      </button>

      {wk.error ? (
        <div className="text-[14px] text-magenta-700">{wk.error}</div>
      ) : null}

      {!selected?.exercises.length ? (
        <button
          type="button"
          onClick={onManage}
          className="text-[13px] tracking-[0.02em] text-accent-700 min-h-[44px] flex items-center self-start hover:text-accent-600"
        >
          Add exercises to this day
        </button>
      ) : null}

      {/* Recent days */}
      {recent.length ? (
        <div className="flex flex-col gap-[15px] pt-[6px]">
          <div className="text-[13px] tracking-[0.02em] text-neutral-600">
            Recent days
          </div>
          {recent.map((day, i) => (
            <div
              key={i}
              className="grid grid-cols-[62px_1fr_auto] gap-[15px] items-baseline"
            >
              <div className="text-[14px] text-neutral-600">{day.when}</div>
              <div className="text-[17px] font-semibold">{day.name}</div>
              <div className="text-[15px] text-neutral-700 whitespace-nowrap tabular-nums">
                {toDisplayVolume(day.volumeLb, prefs.unit)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
