import { useCallback, useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { cachedDirectory, loadCompanyDirectory } from "@/lib/companyDirectory"
import { STATUS } from "@/lib/graph"
import { indexPeople } from "@/lib/peopleIndex"

// Aynı liste için arama dizini bir kez kurulur (birden çok bileşen aynı rehberi okuyor).
const indexes = new WeakMap()
function indexOf(people) {
  if (!people) return []
  if (!indexes.has(people)) indexes.set(people, indexPeople(people))
  return indexes.get(people)
}

/**
 * Şirket rehberi (`lib/companyDirectory.js`): `{ status, people, index, limited, refreshing,
 * retry }`. `enabled` false iken istek yok; önbellekte varsa ANINDA hazır. `retry` yeniden okur;
 * eldeki liste yenisi gelene kadar (ya da yenileme düşerse) yerinde kalır.
 */
export function useCompanyDirectory(enabled = true) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState(null) // { attempt, res } — son okumanın cevabı

  const cached = cachedDirectory(account)
  useEffect(() => {
    if (!enabled || (attempt === 0 && cachedDirectory(account))) return undefined
    let live = true
    loadCompanyDirectory(instance, account, { force: attempt > 0 }).then((res) => {
      if (live) setLoaded({ attempt, res })
    })
    return () => {
      live = false
    }
  }, [enabled, instance, account, attempt])

  const answered = loaded?.attempt === attempt
  const state = cached ?? (answered ? loaded.res : { status: enabled ? "loading" : "idle" })
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const people = state.status === STATUS.ready ? state.people : null
  return {
    ...state,
    people,
    index: indexOf(people),
    refreshing: Boolean(cached) && attempt > 0 && !answered,
    retry,
  }
}
