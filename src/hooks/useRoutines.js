import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  listRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
} from '../lib/routines.js'

export function useRoutines() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setRoutines(await listRoutines(user.id))
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

  return {
    routines,
    loading,
    error,
    refresh,
    async create(routine) {
      const id = await createRoutine(user.id, {
        ...routine,
        position: routines.length,
      })
      await refresh()
      return id
    },
    async update(id, routine) {
      await updateRoutine(user.id, id, routine)
      await refresh()
    },
    async remove(id) {
      await deleteRoutine(user.id, id)
      await refresh()
    },
  }
}
