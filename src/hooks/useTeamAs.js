import { useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import {
  fetchManagerReports,
  isTeamMember,
  MEMBER_SELECT,
  memberFromGraph,
} from "@/lib/directReports"
import { graphGet, STATUS } from "@/lib/graph"
import { buildTeam, teamCounts } from "@/lib/teamCircle"

const SCOPES = ["User.Read.All"]
const IDLE = { status: "loading", people: [], failed: [], subject: null }

/**
 * TEST GÖRÜNÜMÜ — Ekibim'i başka bir kişinin gözünden kurar (yalnız uygulama yöneticisi açar;
 * kapı çağıranda): kişinin yöneticisi, aynı yöneticiye bağlılar ve kişiye bağlılar, Graph'tan
 * (`/users/{upn}` · `/manager` · `/directReports`). Veri yalnız bileşen durumunda; önbellek yok.
 * Dönüş `useMyTeam` biçiminde (`status`, `people`, `counts`, `failed`, `retry`) + `subject`.
 */
export function useTeamAs(upn, enabled = true) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const [state, setState] = useState({ upn: null, value: IDLE })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled || !upn || !account) return undefined
    let alive = true
    const get = (path) => graphGet(instance, account, { path, scopes: SCOPES })
    ;(async () => {
      const who = await get(`/users/${encodeURIComponent(upn)}?$select=${MEMBER_SELECT}`)
      if (who.status !== STATUS.ready)
        return { status: who.status, people: [], failed: [], subject: null }
      const user = who.data
      const [reports, mgr] = await Promise.all([
        fetchManagerReports(instance, account, user.id),
        get(`/users/${encodeURIComponent(user.id)}/manager?$select=${MEMBER_SELECT}`),
      ])
      const manager =
        mgr.status === STATUS.ready && isTeamMember(mgr.data) ? memberFromGraph(mgr.data) : null
      const peers = manager
        ? await fetchManagerReports(instance, account, mgr.data.id)
        : { status: STATUS.ready, people: [] }
      const people = buildTeam({
        reports: reports.people,
        manager,
        peers: peers.people,
        self: { ids: [user.id], addresses: [user.mail, user.userPrincipalName] },
      })
      const failed = [
        reports.status !== STATUS.ready && "reports",
        mgr.status !== STATUS.ready && mgr.httpStatus !== 404 && "manager",
        peers.status !== STATUS.ready && "peers",
      ].filter(Boolean)
      return { status: STATUS.ready, people, failed, subject: memberFromGraph(user) }
    })().then((value) => alive && setState({ upn, value }))
    return () => {
      alive = false
    }
  }, [enabled, upn, account, instance, attempt])

  // Oturum yoksa soru hiç sorulamaz: "yükleniyor"da kalmasın.
  const value = !account
    ? { ...IDLE, status: STATUS.unauthenticated }
    : state.upn === upn
      ? state.value
      : IDLE
  return {
    ...value,
    counts: teamCounts(value.people),
    retry: () => setAttempt((n) => n + 1),
  }
}
