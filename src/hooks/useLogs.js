import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { loadLogs } from '../lib/workouts.js'

export function useLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setLogs(await loadLogs(user.id))
      setError(null)
    } catch (e) {
      setError(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { logs, loading, error, refresh }
}
