// Sahte Dataverse Web API: başlatıcı ortamı (`tyro_*`) ve İK/F&O ortamı (`mserp_*`).
// Sözleşme `scratchpad/spec-dataverse.md`'ye göre: okumalar JSON `{value}`, yazmalar 201/204 saplaması.
// Sunucu süzgeçleri uygulanmaz (uygulama kendi süzer); yalnız takım sorguları için takma adlar okunur.
import { PERSONA } from "../persona.js"
import { EVERYONE, byMail, MANAGER, REPORTS } from "../org.js"
import { authorizedRow, catalogRows } from "../catalog.js"
import {
  FV,
  advances,
  allowanceRow,
  expenses,
  ownLeaves,
  roster,
  teamLeaves,
  workerRow,
} from "./hr.js"
import { json, logUnhandled, noContent, parseBody, uid } from "./util.js"

const ODATA = (host) => `https://${host}/api/data/v9.2/$metadata`

/** `$filter` içindeki `alanAdı eq 'değer'` değerleri. */
function eqValues(url, field) {
  const f = url.searchParams.get("$filter") ?? ""
  const out = []
  for (const m of f.matchAll(new RegExp(`${field}\\s+eq\\s+'([^']*)'`, "gi"))) out.push(m[1])
  return out
}

const personByAlias = (alias) => byMail(alias) ?? null

function ensure(ctx) {
  if (ctx.dv) return ctx.dv
  const now = new Date()
  const ex = expenses(now)
  ctx.dv = {
    catalog: catalogRows(ctx.dataset),
    auth: authorizedRow(ctx.dataset),
    leaves: ownLeaves(now),
    teamLeaves: teamLeaves(now),
    expenseLines: ex.lines,
    expenseHeaders: ex.headers,
    advances: advances(now),
    roster: roster(now),
    requests: [],
    seq: 62400,
  }
  return ctx.dv
}

const list = (host, rows, extra = {}) => json({ "@odata.context": ODATA(host), value: rows, ...extra })

export async function handleDataverse({ url, method, headers, body, ctx }) {
  const dv = ensure(ctx)
  const host = url.hostname
  const rest = url.pathname.replace(/^\/api\/data\/v9\.\d+\//, "")
  const m = rest.match(/^([A-Za-z0-9_]+)(?:\(([^)]*)\))?(?:\/(.+))?$/)
  if (!m) {
    logUnhandled("Dataverse", method, url)
    return list(host, [])
  }
  const [, set, key, sub] = m
  const data = parseBody(body)
  const wantsRepr = /return=representation/i.test(headers?.get?.("Prefer") ?? "")
  const idColumn = `${set.replace(/s$/, "")}id`

  // ───────── yazmalar ─────────
  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    if (set === "tyro_chatfiles") {
      if (method === "POST") return json({ tyro_chatfileid: uid("file") }, 201)
      return noContent()
    }
    if (set === "mserp_tryaiemployeexpenseentities" && method === "POST") {
      const no = `HRMS-${String(++dv.seq).padStart(6, "0")}`
      const id = uid("exp")
      dv.expenseHeaders.unshift({
        mserp_expnumber: no,
        mserp_workflowstatus: 200000000,
        [`mserp_workflowstatus${FV}`]: "Not submitted",
        mserp_transdate: data?.mserp_transdate ?? new Date().toISOString().slice(0, 10),
        mserp_explanation: data?.mserp_explanation ?? "",
      })
      return json({ mserp_expnumber: no, mserp_tryaiemployeexpenseentityid: id }, 201, {
        "OData-EntityId": `https://${host}/api/data/v9.2/${set}(${id})`,
      })
    }
    if (set === "mserp_tryaiboraxallowancetransselfentities" && method === "POST") {
      const id = uid("leave")
      dv.leaves.push({
        mserp_boraxallowancetransselfserviceentityid: id,
        mserp_boraxoldemplid: workerRow().mserp_borax_oldemplid,
        mserp_startdate: `${data?.mserp_startdate ?? ""}T00:00:00Z`,
        mserp_enddate: `${data?.mserp_enddate ?? ""}T00:00:00Z`,
        mserp_allowancetypeid: data?.mserp_allowancetypeid ?? "TR01",
        mserp_noofdays: 1,
        mserp_noofhours: 8,
        mserp_description: data?.mserp_description ?? "",
        mserp_status: 200000001,
        [`mserp_status${FV}`]: "First manager approvement",
      })
      return new Response(null, {
        status: 204,
        headers: { "OData-EntityId": `https://${host}/api/data/v9.2/${set}(${id})` },
      })
    }
    if (method === "POST") {
      const id = uid("rec")
      const row = { [idColumn]: id, ...(data ?? {}), createdon: new Date().toISOString() }
      if (set === "tyro_launcherapps" || set === "tyro_authorizedapps" || set === "tyro_requestapps") {
        return json(row, 201, { "OData-EntityId": `https://${host}/api/data/v9.2/${set}(${id})` })
      }
      return new Response(null, {
        status: 204,
        headers: { "OData-EntityId": `https://${host}/api/data/v9.2/${set}(${id})` },
      })
    }
    if (method === "PATCH" && wantsRepr) return json({ [idColumn]: key, ...(data ?? {}) })
    return noContent()
  }

  // ───────── okumalar: başlatıcı ortamı ─────────
  switch (set) {
    case "tyro_launcherapps":
      return list(host, dv.catalog)
    case "tyro_authorizedapps":
      return list(host, [dv.auth])
    case "tyro_requestapps":
      return url.searchParams.get("$count") === "true"
        ? json({ "@odata.count": 0, value: [] })
        : list(host, [])
    case "tyro_rmdocs":
      return list(host, [])
  }

  // ───────── okumalar: İK / F&O ortamı ─────────
  switch (set) {
    case "mserp_tryaiworkersentities": {
      const aliases = eqValues(url, "mserp_userinfo_networkalias")
      const people = aliases.length ? aliases.map((a) => personByAlias(a.toLowerCase())).filter(Boolean) : []
      const rows = people.length ? people.map((p) => workerRow(p)) : [workerRow()]
      return list(host, rows)
    }
    case "mserp_tryaiallowancesummaryentities": {
      const aliases = eqValues(url, "mserp_networkalias")
      const people = aliases.map((a) => personByAlias(a.toLowerCase())).filter(Boolean)
      return list(host, (people.length ? people : [byMail(PERSONA.mail)]).map((p) => allowanceRow(p)))
    }
    case "mserp_boraxallowancetransselfserviceentities": {
      const f = url.searchParams.get("$filter") ?? ""
      const ids = [...f.matchAll(/mserp_boraxoldemplid eq '([^']+)'/g)].map((x) => x[1])
      const mine = workerRow().mserp_borax_oldemplid
      if (ids.length && ids.every((id) => id !== mine)) return list(host, dv.teamLeaves)
      if (ids.length > 1) return list(host, [...dv.leaves, ...dv.teamLeaves])
      return list(host, dv.leaves)
    }
    case "mserp_tryaiworkflowtrackingstatustableentities":
      return list(host, [])
    case "mserp_tryaiemployeexpensetransentities":
      return list(host, dv.expenseLines)
    case "mserp_tryaiemployeexpenseentities":
      return list(host, dv.expenseHeaders)
    case "mserp_trvcashadvanceentities":
      return list(host, dv.advances)
    case "mserp_hcmemploymententities":
      return list(host, [
        { mserp_personnelnumber: workerRow().mserp_borax_oldemplid, mserp_legalentityid: "TYTC", mserp_employmentstartdate: "2022-03-14T00:00:00Z" },
      ])
    case "mserp_tryhcmemploymentdetaildomesticactiveviewentities": {
      const mails = eqValues(url, "mserp_mail").map((x) => x.toLowerCase())
      const pns = eqValues(url, "mserp_personnelnumber")
      let rows = dv.roster
      if (mails.length) rows = rows.filter((r) => mails.includes(r.mserp_mail.toLowerCase()))
      else if (pns.length) rows = rows.filter((r) => pns.includes(r.mserp_personnelnumber))
      return list(host, rows)
    }
    case "mserp_tryaiexpensedelegationentities":
      return list(host, [])
  }

  logUnhandled("Dataverse", method, url)
  return list(host, [])
}
