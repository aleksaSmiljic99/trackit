const LB_PER_KG = 1 / 0.4536

// Weight is always stored in pounds. Display converts per the active unit,
// matching the prototype: round(lb * 0.4536 * 2) / 2 with a "kg" suffix.
export function lbToKg(lb) {
  return Math.round(lb * 0.4536 * 2) / 2
}

export function kgToLb(kg) {
  return Math.round(kg * LB_PER_KG * 2) / 2
}

// Bare number in the active unit — for prefilling an editable field.
export function toInputWeight(lb, unit) {
  return unit === 'kg' ? lbToKg(lb) : Math.round(lb * 2) / 2
}

// Parse what the user typed (in `unit`) back to pounds for storage.
export function fromInputWeight(value, unit) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return unit === 'kg' ? kgToLb(n) : Math.round(n * 2) / 2
}

export function toDisplayWeight(lb, unit) {
  if (unit === 'kg') return `${lbToKg(lb)} kg`
  return `${lb} lb`
}

export function toDisplayVolume(lb, unit) {
  const value =
    unit === 'kg' ? Math.round(lb * 0.4536 * 2) / 2 : Math.round(lb)
  return `${value.toLocaleString('en-US')} ${unit === 'kg' ? 'kg' : 'lb'}`
}

// m:ss clock for elapsed / rest timers.
export function clock(totalSeconds) {
  const t = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// mm:ss for the summary line (41:20).
export function longClock(totalSeconds) {
  const t = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// "Saturday 29 August"
export function dateline(date = new Date()) {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

// "Saturday 29 August" — plus the year when it isn't the current one.
export function logDate(iso, now = new Date()) {
  const d = new Date(iso)
  const base = dateline(d)
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`
}

export function shortWeekday(date) {
  return WEEKDAYS[date.getDay()].slice(0, 3)
}

export function daysAgo(fromDate, now = new Date()) {
  const ms = now.setHours(0, 0, 0, 0) - new Date(fromDate).setHours(0, 0, 0, 0)
  const days = Math.round(ms / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
