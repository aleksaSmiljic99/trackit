import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_PREFS } from '../lib/seed.js'

const KEY = 'trackit.prefs'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFS
  }
}

// App settings from the handoff: unit default, showRestTimer, restSeconds.
// Per-device, so localStorage is the right home; workouts live in Supabase.
export function usePreferences() {
  const [prefs, setPrefs] = useState(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      /* private mode / storage disabled — settings just won't persist */
    }
  }, [prefs])

  // Drive the dark/light theme. 'system' leaves it to the CSS media query.
  useEffect(() => {
    const root = document.documentElement
    if (prefs.theme === 'light' || prefs.theme === 'dark') {
      root.setAttribute('data-theme', prefs.theme)
    } else {
      root.removeAttribute('data-theme')
    }
  }, [prefs.theme])

  const update = useCallback((patch) => setPrefs((p) => ({ ...p, ...patch })), [])
  const toggleUnit = useCallback(
    () => setPrefs((p) => ({ ...p, unit: p.unit === 'kg' ? 'lb' : 'kg' })),
    [],
  )

  return { prefs, update, toggleUnit }
}
