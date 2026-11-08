import { useCallback, useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { STATUS } from "@/lib/graph"
import { loadChain, loadReports } from "@/features/feed/lib/orgChart"

const NO_SESSION = { status: STATUS.unauthenticated }

/**
 * Bir kişinin organizasyondaki yeri (`features/feed/lib/orgChart.js`): `{ chain, reports, retry }` —
 * `chain` `{ status, person, chain }`, `reports` `{ status, people }`; cevap gelene kadar `null`.
 * `withReports` false iken bağlılar sorulmaz (ekip arkadaşları açılınca sorulur).
 */
export function useOrgChart(id, { withChain = true, withReports = true } = {}) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const [attempt, setAttempt] = useState(0)
  const [answers, setAnswers] = useState({}) // "<kind>:<id>:<attempt>" → cevap

  useEffect(() => {
    if (!id || !account) return undefined
    let live = true
    const save = (kind) => (res) => {
      if (live) setAnswers((a) => ({ ...a, [`${kind}:${id}:${attempt}`]: res }))
    }
    if (withChain) loadChain(instance, account, id).then(save("c"))
    if (withReports) loadReports(instance, account, id).then(save("r"))
    return () => {
      live = false
    }
  }, [id, instance, account, attempt, withChain, withReports])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  if (!account) return { chain: NO_SESSION, reports: NO_SESSION, retry }
  return {
    chain: answers[`c:${id}:${attempt}`] ?? null,
    reports: answers[`r:${id}:${attempt}`] ?? null,
    retry,
  }
}
