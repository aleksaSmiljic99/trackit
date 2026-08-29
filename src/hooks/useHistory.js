import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { loadRecent } from '../lib/workouts.js'

export function useHistory() {
  const { user } = useAuth()
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setRecent(await loadRecent(user.id))
    } catch {
      setRecent([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { recent, loading, refresh }
}
