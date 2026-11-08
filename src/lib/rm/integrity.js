// tyroRM planının veri sözleşmesi: her düzenlemeden sonra doğru kalması gereken bağlar. Birim
// testleri (CI), push öncesi tyroRM kapısı ve canlı veri denetimi aynı listeyi kullanır. Çıktıda
// ad yok: proje kodu ya da kayıt kimliği.
import { toDay } from "./engine/dates"

const num = (v) => Number.isFinite(+v) && +v >= 0
const inTeam = (p, rid) => (p?.team || []).some((t) => t.rid === rid)

/** Sözleşme ihlalleri: [{ rule, ref }] — boşsa plan tutarlı. */
export function planIssues(S) {
  const out = []
  const add = (rule, ref) => out.push({ rule, ref: String(ref ?? "") })
  const P = new Map()
  const codes = new Set()
  for (const p of S?.projects || []) {
    if (P.has(p.id)) add("project.idUnique", p.code)
    P.set(p.id, p)
    const code = String(p.code || "").toUpperCase()
    if (!code) add("project.codeRequired", p.id)
    else if (codes.has(code)) add("project.codeUnique", p.code)
    codes.add(code)
    const s = toDay(p.start)
    const e = toDay(p.end)
    if (s == null || e == null || e < s) add("project.dates", p.code)
  }
  const R = new Map()
  for (const r of S?.resources || []) {
    if (R.has(r.id)) add("person.idUnique", r.id)
    R.set(r.id, r)
    if (!String(r.name || "").trim()) add("person.nameRequired", r.id)
  }
  for (const p of S?.projects || []) {
    for (const t of p.team || []) if (!R.has(t.rid)) add("team.personExists", p.code)
  }
  for (const a of S?.asg || []) {
    const p = P.get(a.pid)
    if (!p) add("rule.projectExists", a.id)
    else if (!R.has(a.rid)) add("rule.personExists", a.id)
    else if (!inTeam(p, a.rid)) add("rule.inTeam", p.code)
    const f = toDay(a.from)
    const t = toDay(a.to)
    if (f == null || t == null || t < f) add("rule.range", a.id)
    if (!num(a.h)) add("rule.hours", a.id)
    const days = a.days ?? []
    if (!Array.isArray(days) || !days.every((d) => Number.isInteger(+d) && +d >= 0 && +d <= 4))
      add("rule.days", a.id)
  }
  for (const [k, days] of Object.entries(S?.ov || {})) {
    const [pid, rid] = k.split("|")
    const p = P.get(pid)
    if (!p || !R.has(rid)) {
      add("manual.refs", k)
      continue
    }
    if (!inTeam(p, rid)) add("manual.inTeam", p.code)
    for (const [iso, h] of Object.entries(days || {})) {
      if (toDay(iso) == null || !num(h)) add("manual.value", k)
    }
  }
  return out
}

/** Motorun tutarlılığı: sayı olmayan saat yok; kişi toplamları proje toplamlarına eşit. */
export function engineIssues(plan) {
  const out = []
  let byProject = 0
  let bad = 0
  for (const pid of Object.keys(plan.PA || {})) {
    for (const rid of Object.keys(plan.PA[pid])) {
      for (const h of Object.values(plan.PA[pid][rid])) {
        if (Number.isFinite(h)) byProject += h
        else bad += 1
      }
    }
  }
  let byPerson = 0
  for (const rid of Object.keys(plan.RD || {})) {
    for (const h of Object.values(plan.RD[rid])) byPerson += Number.isFinite(h) ? h : 0
  }
  if (bad) out.push({ rule: "engine.finite", ref: String(bad) })
  if (Math.abs(byProject - byPerson) > 0.01) {
    out.push({ rule: "engine.totals", ref: `${byPerson} ≠ ${byProject}` })
  }
  return out
}

/** `after`da olup `before`da olmayan ihlaller (eski veride kalan bir sorun düzenlemeyi durdurmasın). */
export function newIssues(before, after) {
  const seen = new Set(before.map((x) => `${x.rule}|${x.ref}`))
  return after.filter((x) => !seen.has(`${x.rule}|${x.ref}`))
}

/**
 * JSON'a kayıpsız yazılamayan değerlerin yolları: sonsuz/NaN sayı, Date, Map/Set, fonksiyon.
 * Plan Dataverse'e JSON olarak gider; bunlar sessizce null'a ya da {}'e döner.
 */
export function unsafeJson(v, path = "plan", out = []) {
  if (typeof v === "number") {
    if (!Number.isFinite(v)) out.push(path)
  } else if (typeof v === "function" || typeof v === "bigint" || typeof v === "symbol") {
    out.push(path)
  } else if (v && typeof v === "object") {
    if (v instanceof Date || v instanceof Map || v instanceof Set) out.push(path)
    else for (const [k, x] of Object.entries(v)) unsafeJson(x, `${path}.${k}`, out)
  }
  return out
}
