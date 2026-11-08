import { directoryPerson } from "@/lib/companyDirectory"
import { isTeamMember } from "@/lib/directReports"
import { errorCause } from "@/lib/errorCause"
import { graphGet, STATUS } from "@/lib/graph"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * Bul › Organizasyon — bir kişinin yönetici zinciri (en üstten kişiye) ve bağlıları. Zincir tek
 * istekte (`manager($levels=max)`, `useIsUnderManager`in sorgusu; `ConsistencyLevel` şart),
 * bağlılar `directReports`. İzin `User.Read.All` (sessiz, onaylı). Önbellek yalnız bellekte;
 * çıkışta `clearOrgChart` (`lib/sessionCache`). Kesin cevaplar önbelleğe girer, "soramadık"
 * girmez (izin verilince sonraki açılış çalışsın).
 */

const SCOPES = ["User.Read.All"]
const SELECT =
  "id,displayName,givenName,surname,jobTitle,department,officeLocation,companyName,mail,userPrincipalName"
const MAX_LEVELS = 20
const MAX_PAGES = 5

const chains = new Map() // id → { status, person, chain }
const reports = new Map() // id → { status, people }
const inflight = new Map()
let epoch = 0

export function clearOrgChart() {
  chains.clear()
  reports.clear()
  inflight.clear()
  epoch += 1
}
onSessionClear(clearOrgChart)

/** İç içe `manager` → en üstten doğrudan yöneticiye sıralı liste (döngüye karşı korumalı). */
export function chainOf(user) {
  const out = []
  const seen = new Set([user?.id])
  let m = user?.manager
  while (m && out.length < MAX_LEVELS && !seen.has(m.id)) {
    seen.add(m.id)
    const p = directoryPerson(m, false)
    if (p) out.push(p)
    m = m.manager
  }
  return out.reverse()
}

const byName = (a, b) => a.name.localeCompare(b.name, "tr")

/** Aynı anahtarın yoldaki turu paylaşılır; `live()`: çıkıştan sonra dönen cevap önbelleğe yazılmaz. */
function once(key, run) {
  if (inflight.has(key)) return inflight.get(key)
  const started = epoch
  const live = () => started === epoch
  const promise = run(live)
    .catch((err) => ({ status: STATUS.error, detail: errorCause("graph", err) }))
    .then((res) => {
      if (inflight.get(key) === promise) inflight.delete(key)
      return live() ? res : { status: STATUS.unauthenticated }
    })
  inflight.set(key, promise)
  return promise
}

/** Kişi ve yönetici zinciri: `{ status, person, chain }`. */
export function loadChain(instance, account, id) {
  if (chains.has(id)) return Promise.resolve(chains.get(id))
  return once(`c:${id}`, async (live) => {
    const res = await graphGet(instance, account, {
      path: `/users/${encodeURIComponent(id)}?$select=${SELECT}&$expand=manager($levels=max;$select=${SELECT})`,
      scopes: SCOPES,
      headers: { ConsistencyLevel: "eventual" },
      retry: 1,
    })
    if (res.status !== STATUS.ready) return res
    const person = directoryPerson(res.data, false)
    if (!person) return { status: STATUS.error }
    const value = { status: STATUS.ready, person, chain: chainOf(res.data) }
    if (live()) chains.set(id, value)
    return value
  })
}

/** Kişinin doğrudan bağlıları (açık hesaplar, ada göre): `{ status, people }`. */
export function loadReports(instance, account, id) {
  if (reports.has(id)) return Promise.resolve(reports.get(id))
  return once(`r:${id}`, async (live) => {
    const users = []
    let next = `/users/${encodeURIComponent(id)}/directReports?$select=${SELECT},accountEnabled&$top=100`
    for (let page = 0; next && page < MAX_PAGES; page += 1) {
      const res = await graphGet(instance, account, { path: next, scopes: SCOPES, retry: 1 })
      if (res.status !== STATUS.ready) {
        if (page === 0) return res
        break
      }
      users.push(...(res.data?.value ?? []))
      next = res.data?.["@odata.nextLink"] ?? null
    }
    const people = users
      .filter(isTeamMember)
      .map((u) => directoryPerson(u, false))
      .filter(Boolean)
      .sort(byName)
    const value = { status: STATUS.ready, people }
    if (live()) reports.set(id, value)
    return value
  })
}
