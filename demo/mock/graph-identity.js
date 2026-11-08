// Graph: kimlik, organizasyon, rehber, fotoğraf, varlık (presence), gelen kutusu dışı posta ayarları.
import { EVERYONE, ME, MANAGER, REPORTS, byId, byMail, graphUser, managerOf, reportsOf } from "../org.js"
import { json, graphError } from "./util.js"
import { CTX, decode, fold, paged } from "./graph-util.js"

const NOT_FOUND_PHOTO = () => graphError(404, "ImageNotFound", "The photo wasn't found.")

const EXTRA_ME = {
  employeeId: "100245",
  employeeType: "Employee",
  employeeHireDate: "2022-03-14T00:00:00Z",
  accountEnabled: true,
  city: "İstanbul",
  country: "Türkiye",
}

const asUser = (p, extra = {}) => ({
  ...graphUser(p),
  accountEnabled: true,
  employeeId: p.id === ME.id ? EXTRA_ME.employeeId : String(100300 + EVERYONE.indexOf(p) * 7),
  employeeType: "Employee",
  employeeHireDate: p.id === ME.id ? EXTRA_ME.employeeHireDate : "2021-06-01T00:00:00Z",
  city: "İstanbul",
  country: "Türkiye",
  ...extra,
})

/** `$expand=manager(...)`: `$levels=max` ise zincir boyunca. */
function withManager(p, url) {
  const u = asUser(p)
  const exp = url.searchParams.get("$expand") ?? ""
  if (/manager/i.test(exp)) {
    let cur = u
    let mgr = managerOf(p)
    while (mgr) {
      const m = asUser(mgr)
      cur.manager = m
      cur = m
      mgr = /levels=max/i.test(exp) ? managerOf(mgr) : null
    }
  }
  return u
}

const findPerson = (key) => byId(key) ?? byMail(key) ?? null

const availabilityOf = (p) => {
  if (p.id === ME.id) return "Available"
  const set = ["Available", "Busy", "Available", "Away", "AvailableIdle", "Offline", "Busy"]
  return set[Math.abs([...p.mail].reduce((a, c) => a + c.charCodeAt(0), 0)) % set.length]
}

export function handleIdentity({ url, method, body, path }) {
  // ───────── GET ─────────
  if (method === "GET") {
    if (path === "/me/photo" || /\/photos?\/[^/]*\$value$/.test(path) || path === "/me/photo/$value")
      return NOT_FOUND_PHOTO()
    if (/^\/users\/[^/]+\/photos?(\/|$)/.test(path)) return NOT_FOUND_PHOTO()

    if (path === "/me") return json({ "@odata.context": CTX, ...withManager(ME, url), ...EXTRA_ME })
    if (path === "/me/manager") return json({ "@odata.type": "#microsoft.graph.user", ...asUser(MANAGER) })
    if (path === "/me/directReports") return paged(url, REPORTS, (p) => ({ "@odata.type": "#microsoft.graph.user", ...asUser(p) }))
    if (path === "/me/presence") return json({ id: ME.id, availability: "Available", activity: "Available" })

    let m
    if ((m = path.match(/^\/users\/([^/]+)\/directReports$/))) {
      const p = findPerson(decode(m[1]))
      return paged(url, p ? reportsOf(p) : [], (x) => ({ "@odata.type": "#microsoft.graph.user", ...asUser(x) }))
    }
    if ((m = path.match(/^\/users\/([^/]+)\/manager$/))) {
      const mgr = findPerson(decode(m[1])) && managerOf(findPerson(decode(m[1])))
      return mgr ? json({ "@odata.type": "#microsoft.graph.user", ...asUser(mgr) }) : graphError(404, "ResourceNotFound", "No manager")
    }
    if ((m = path.match(/^\/users\/([^/]+)\/presence$/))) {
      const p = findPerson(decode(m[1]))
      return p ? json({ id: p.id, availability: availabilityOf(p), activity: availabilityOf(p) }) : graphError(404, "NotFound", "No presence")
    }
    if ((m = path.match(/^\/users\/([^/]+)$/))) {
      const p = findPerson(decode(m[1]))
      return p ? json({ "@odata.context": CTX, ...withManager(p, url) }) : graphError(404, "Request_ResourceNotFound", "User not found")
    }
    if (path === "/users") return usersList(url)
    if (path === "/me/people") {
      const q = fold((url.searchParams.get("$search") ?? "").replace(/"/g, ""))
      const hits = EVERYONE.filter((p) => p.id !== ME.id && (!q || fold(p.displayName).includes(q) || fold(p.mail).includes(q)))
      return json({
        value: hits.slice(0, Number(url.searchParams.get("$top") ?? 8)).map((p) => ({
          id: p.id,
          displayName: p.displayName,
          userPrincipalName: p.userPrincipalName,
          scoredEmailAddresses: [{ address: p.mail, relevanceScore: 10 }],
          personType: { class: "Person", subclass: "OrganizationUser" },
        })),
      })
    }
    if (path === "/me/memberOf") return paged(url, [])
    return null
  }

  // ───────── POST ─────────
  if (method === "POST") {
    if (/\/checkMemberGroups$/.test(path)) return json({ value: [] })
    if (path === "/$batch") {
      const reqs = body?.requests ?? []
      return json({
        responses: reqs.map((r) => ({
          id: r.id,
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: { error: { code: "ImageNotFound", message: "The photo wasn't found." } },
        })),
      })
    }
    if (path === "/communications/getPresencesByUserId") {
      const ids = body?.ids ?? []
      return json({
        value: ids.map((id) => {
          const p = byId(id)
          return { id, availability: p ? availabilityOf(p) : "PresenceUnknown", activity: "Available" }
        }),
      })
    }
    if (/\/presence\/(setUserPreferredPresence|clearUserPreferredPresence)$/.test(path)) return json({})
  }
  return null
}

function usersList(url) {
  const filter = url.searchParams.get("$filter") ?? ""
  const search = url.searchParams.get("$search") ?? ""
  let rows = EVERYONE
  let m
  if ((m = filter.match(/department eq '([^']+)'/i))) rows = rows.filter((p) => p.department === m[1])
  else if ((m = filter.match(/mail eq '([^']+)'/i))) rows = rows.filter((p) => p.mail.toLowerCase() === m[1].toLowerCase())
  else if ((m = filter.match(/displayName eq '([^']+)'/i))) rows = rows.filter((p) => p.displayName === m[1])
  else if (search) {
    const q = fold(search.replace(/^"?displayName:/i, "").replace(/"$/, ""))
    rows = rows.filter((p) => fold(p.displayName).includes(q))
  }
  return paged(url, rows, (p) => asUser(p))
}
