import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  addSubstitution,
  createExercise,
  ensureLibrary,
  indexByKey,
  listExercises,
  listSubstitutions,
  removeSubstitution,
  updateExercise,
} from '../lib/exercises.js'

// The per-user exercise library plus its substitution links. Seeds + backfills
// on first load (once per browser), then just reads.
export function useExercises() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState([])
  const [subs, setSubs] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const seeding = useRef(null)

  const load = useCallback(
    async (seed) => {
      if (!user) return

      const run = async () => {
        setLoading(true)
        try {
          const seededKey = `trackit.library.v1.${user.id}`
          let list
          if (seed && !localStorage.getItem(seededKey)) {
            list = await ensureLibrary(user.id)
            try {
              localStorage.setItem(seededKey, '1')
            } catch {
              /* private mode — ensureLibrary is idempotent, so retry next load */
            }
          } else {
            list = await listExercises(user.id)
          }
          setExercises(list)
          setSubs(await listSubstitutions(user.id))
          setError(null)
        } catch (e) {
          setError(e.message ?? String(e))
        } finally {
          setLoading(false)
        }
      }

      // StrictMode double-invokes the mount effect; without this guard both
      // runs race to seed the library and each inserts the full seed. Share
      // the first seeding run's promise with any that land while it's open.
      if (!seed) return run()
      if (!seeding.current) {
        seeding.current = run().finally(() => {
          seeding.current = null
        })
      }
      return seeding.current
    },
    [user],
  )

  useEffect(() => {
    load(true)
  }, [load])

  const index = useMemo(() => indexByKey(exercises), [exercises])
  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  return {
    exercises,
    active: useMemo(() => exercises.filter((e) => !e.isArchived), [exercises]),
    subs,
    index,
    byId,
    loading,
    error,
    refresh: () => load(false),
    async create(data) {
      const ex = await createExercise(user.id, data)
      await load(false)
      return ex
    },
    async update(id, patch) {
      await updateExercise(user.id, id, patch)
      await load(false)
    },
    async linkSub(a, b) {
      await addSubstitution(user.id, a, b)
      await load(false)
    },
    async unlinkSub(a, b) {
      await removeSubstitution(user.id, a, b)
      await load(false)
    },
  }
}
