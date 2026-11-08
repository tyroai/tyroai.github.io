// İçe aktarma (köprü): HTML'den dışa aktarılan plan JSON'u okunur, kuru çalıştırma raporu
// çıkar (sayılar, veri uyarıları, düzeltmeler, mevcut plana göre fark) ve onaylanınca belge olur.
// Plan olduğu gibi saklanır; HTML'ye geri dönüş de kayıpsız kalsın.
import { computePlan } from "@/lib/rm/engine/compute"
import { toDay, weekday } from "@/lib/rm/engine/dates"

export const DOC_FORMAT = "tyrorm"

/** Ürün sahibinin kararı: bu ekipler danışman değil, tam gün çalışır. */
export const FULL_DAY_TEAMS = ["Oracle"]

/** Belgeden plan; eski (sarmalanmamış) biçimi de tanır. */
export function planOf(doc) {
  if (doc?.format === DOC_FORMAT) return doc.plan ?? null
  return Array.isArray(doc?.projects) ? doc : null
}

export function wrapPlan(plan, source) {
  return { format: DOC_FORMAT, v: 1, source, plan }
}

/** Metin → { ok, plan } ya da { ok: false, error: "json" | "shape" }. */
export function readPlanText(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: "json" }
  }
  const plan = planOf(data)
  const shapeOk =
    plan &&
    typeof plan.settings === "object" &&
    Array.isArray(plan.projects) &&
    Array.isArray(plan.resources) &&
    (Array.isArray(plan.asg) || typeof plan.ov === "object")
  return shapeOk ? { ok: true, plan } : { ok: false, error: "shape" }
}

function sumHours(plan) {
  let s = 0
  for (const p in plan.PD) for (const n in plan.PD[p]) s += plan.PD[p][n]
  return s
}

function fixesFor(plan) {
  const teams = plan.lk?.teams ?? []
  const fix = []
  const consFull = teams.filter((t) => FULL_DAY_TEAMS.includes(t.name) && t.grp === "cons")
  if (consFull.length) {
    fix.push({ id: "fullDayTeams", teams: consFull.map((t) => t.name), on: true })
  }
  return fix
}

/** Seçili düzeltmeleri uygular; girdiyi değiştirmez. */
export function applyFixes(plan, ids) {
  const out = structuredClone(plan)
  if (ids.includes("fullDayTeams") && out.lk?.teams) {
    out.lk.teams = out.lk.teams.map((t) =>
      FULL_DAY_TEAMS.includes(t.name) && t.grp === "cons" ? { ...t, grp: "dev" } : t,
    )
  }
  return out
}

/** Veri uyarıları (içe aktarma raporu ve düzenleyenin "düzeltilecekler" şeridi). */
export function planWarnings(plan, computed) {
  const w = []
  if (plan.planMode === "auto") w.push({ key: "autoMode" })
  const pIds = new Set(plan.projects.map((p) => p.id))
  const rIds = new Set(plan.resources.map((r) => r.id))
  const orphan = (plan.asg || []).filter((a) => !pIds.has(a.pid) || !rIds.has(a.rid))
  if (orphan.length) w.push({ key: "orphanRules", n: orphan.length })
  const heavy = plan.resources.filter((r) =>
    Object.values(computed.RD[r.id] || {}).some((h) => h > 16),
  )
  if (heavy.length) w.push({ key: "heavyDays", n: heavy.length, names: heavy.map((r) => r.name) })
  const open = plan.projects.filter((p) => p.status !== "Tamamlandı")
  const weekendEnd = open.filter((p) => toDay(p.end) != null && weekday(toDay(p.end)) > 4)
  if (weekendEnd.length) {
    w.push({ key: "weekendEnd", n: weekendEnd.length, codes: weekendEnd.map((p) => p.code) })
  }
  const noDates = open.filter((p) => toDay(p.start) == null || toDay(p.end) == null)
  if (noDates.length)
    w.push({ key: "noDates", n: noDates.length, codes: noDates.map((p) => p.code) })
  const lastHoliday = Math.max(...(plan.holidays || []).map((h) => toDay(h.date) ?? -Infinity))
  if (computed.days.length && lastHoliday < computed.days[computed.days.length - 1]) {
    w.push({ key: "holidayHorizon", day: Number.isFinite(lastHoliday) ? lastHoliday : null })
  }
  return w
}

function diffFor(next, nextComputed, current) {
  if (!current) return null
  const cur = computePlan(structuredClone(current))
  const byId = (list) => new Map(list.map((x) => [x.id, x]))
  const cp = byId(current.projects)
  const np = byId(next.projects)
  const cr = byId(current.resources)
  const nr = byId(next.resources)
  const changedDates = next.projects.filter((p) => {
    const o = cp.get(p.id)
    return o && (o.start !== p.start || o.end !== p.end)
  })
  return {
    addedProjects: next.projects.filter((p) => !cp.has(p.id)).map((p) => p.code || p.name),
    removedProjects: current.projects.filter((p) => !np.has(p.id)).map((p) => p.code || p.name),
    changedDates: changedDates.map((p) => p.code || p.name),
    addedPeople: next.resources.filter((r) => !cr.has(r.id)).map((r) => r.name),
    removedPeople: current.resources.filter((r) => !nr.has(r.id)).map((r) => r.name),
    rules: [(current.asg || []).length, (next.asg || []).length],
    hours: [sumHours(cur), sumHours(nextComputed)],
  }
}

/**
 * Kuru çalıştırma raporu. `current`: tablodaki plan (yoksa ilk yükleme). `fileModified`:
 * dosyanın değişme zamanı (ms); yüklü plandan eskiyse `older` döner.
 */
export function inspectPlan(
  plan,
  { current = null, currentSource = null, fileModified = null } = {},
) {
  const computed = computePlan(structuredClone(plan))
  const counts = {
    projects: plan.projects.length,
    people: plan.resources.length,
    rules: (plan.asg || []).length,
    holidays: (plan.holidays || []).length,
    actions: (plan.actions || []).length,
    risks: (plan.risks || []).length,
    hours: sumHours(computed),
  }
  const prev = currentSource?.modified ? Date.parse(currentSource.modified) : NaN
  return {
    counts,
    warnings: planWarnings(plan, computed),
    fixes: fixesFor(plan),
    diff: diffFor(plan, computed, current),
    older: fileModified != null && Number.isFinite(prev) && fileModified < prev,
  }
}
