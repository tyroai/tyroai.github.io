// Matris (şartname "Proje & Kaynak Matrisi" + "Kişi & Proje Takvimi"): proje bazlı ya da kişi
// bazlı gün, hafta ya da ay ızgarası. Salt okunur; hücre durumları plandan gelir.
import { capOf } from "@/lib/rm/engine/capacity"
import { isoWeek, monthEnd, monthStart, toIso, weekday, yearMonth } from "@/lib/rm/engine/dates"
import { day, monthLabel } from "./format"

export const ZOOMS = ["day", "week", "month"]
// Pencere geniş (kap içinde kayar): 6 hafta iş günü, 26 hafta, 12 ay. Adım pencerenin yarısı kadar.
const SPAN = { day: 30, week: 26, month: 12 }
const STEP = { day: 28, week: 13 * 7, month: 6 }

/** Pencerenin başı: gün ve hafta görünümünde bu haftanın pazartesisi, ay görünümünde bu ay. */
export function anchorFor(zoom, n) {
  return zoom === "month" ? monthStart(n) : n - weekday(n)
}

/** Pencereyi bir adım kaydırır (ileri +1, geri −1). */
export function shiftAnchor(zoom, anchor, dir) {
  if (zoom === "month") {
    const [y, m] = yearMonth(anchor)
    return Math.round(Date.UTC(y, m + dir * STEP.month, 1) / 864e5)
  }
  return anchor + dir * STEP[zoom]
}

/** Sütunlar: her biri bir gün, hafta ya da ay; `days` o sütundaki planlı iş günleri. */
export function columnsFor(plan, zoom, anchor) {
  const inPlan = (a, b) => plan.days.filter((n) => n >= a && n <= b)
  if (zoom === "day") {
    const cols = []
    for (let n = anchor; cols.length < SPAN.day && n < anchor + 90; n++) {
      if (weekday(n) > 4) continue
      cols.push({ key: String(n), from: n, to: n, days: inPlan(n, n), type: plan.DT[n] ?? null })
    }
    return cols
  }
  if (zoom === "week") {
    return Array.from({ length: SPAN.week }, (_, i) => {
      const from = anchor + i * 7
      return { key: String(from), from, to: from + 6, days: inPlan(from, from + 6), type: null }
    })
  }
  const cols = []
  let from = anchor
  for (let i = 0; i < SPAN.month; i++) {
    const to = monthEnd(from)
    cols.push({ key: String(from), from, to, days: inPlan(from, to), type: null })
    from = to + 1
  }
  return cols
}

function sumDays(map, days) {
  let s = 0
  for (const n of days) s += map?.[n] || 0
  return s
}

/** Kişinin sütundaki proje kapasitesi ve bütün projelerdeki yükü. */
function personLoad(st, plan, r, col) {
  let cap = 0
  for (const n of col.days) cap += capOf(st, plan, r, n)
  const load = sumDays(plan.RD[r.id], col.days)
  return { cap, load, over: load > cap + 1e-9 }
}

/**
 * Proje × kişi hücresi: saat, kişinin o sütundaki kapasitesi ve toplam yükü (`lo`: ısı ve aşım);
 * gün görünümünde durum işaretleri de taşır.
 */
function memberCell(plan, p, rid, col, end, lo) {
  const pa = plan.PA[p.id]?.[rid]
  const h = sumDays(pa, col.days)
  if (col.from !== col.to) return { h, ...lo }
  const n = col.from
  const fx = plan.OV[rid]?.[n]?.[p.id]
  const ch = plan.holC[plan.pCountry[p.id]]?.[toIso(n)]
  return {
    h,
    ...lo,
    manual: fx?.src === "o",
    closing: (plan.CL[rid]?.[n] || 0) > 0,
    countryHoliday: ch ?? null,
    afterEnd: end != null && n > end && h > 0,
  }
}

/** Proje bazlı satırlar: proje başlığı (toplamlar) ve altında ekip. */
export function projectMatrix(st, plan, cols, { projects }) {
  const names = new Map(st.resources.map((r) => [r.id, r]))
  // Kişinin yükü bütün projelerinde aynı: bir kez hesaplanır.
  const loads = new Map()
  const loadOf = (r) => {
    if (!loads.has(r.id))
      loads.set(
        r.id,
        cols.map((c) => personLoad(st, plan, r, c)),
      )
    return loads.get(r.id)
  }
  return projects
    .map((row) => {
      const p = st.projects.find((x) => x.id === row.id)
      const rids = Object.keys(plan.PA[p.id] || {})
      const members = rids
        .map((rid) => names.get(rid))
        .filter(Boolean)
        .map((r) => {
          const lo = loadOf(r)
          return { r, cells: cols.map((c, i) => memberCell(plan, p, r.id, c, row.end, lo[i])) }
        })
        .filter((m) => m.cells.some((c) => c.h > 0))
      const totals = cols.map((c) => sumDays(plan.PD[p.id], c.days))
      return { row, members, totals }
    })
    .filter((x) => x.members.length > 0)
}

/** Kişi bazlı satırlar: kişinin günlük toplamı ve kapasitesi, altında projeleri. */
export function personMatrix(st, plan, cols, { people, rows }) {
  const byId = new Map(rows.map((r) => [r.id, r]))
  return people.map((r) => {
    const lo = cols.map((c) => personLoad(st, plan, r, c))
    const cells = cols.map((c, i) => {
      const closing = c.from === c.to && (plan.CL[r.id]?.[c.from] || 0) > 0
      return { h: lo[i].load, cap: lo[i].cap, over: lo[i].over, closing }
    })
    const projects = st.projects
      .filter((p) => plan.PA[p.id]?.[r.id])
      .map((p) => ({
        row: byId.get(p.id),
        cells: cols.map((c, i) => memberCell(plan, p, r.id, c, byId.get(p.id)?.end ?? null, lo[i])),
      }))
      .filter((x) => x.row && x.cells.some((c) => c.h > 0))
    return { r, cells, projects }
  })
}

/**
 * Ekip bazlı satırlar: ekibin sütun toplamı ve kapasitesi, altında üyeleri (kişinin toplamı ve
 * kapasitesi). Ekip sırası planın ekip listesinden (`order`), listede olmayan sona.
 */
export function teamMatrix(st, plan, cols, { people, rows, order = [] }) {
  const rank = (t) => (order.indexOf(t) < 0 ? 99 : order.indexOf(t))
  const pm = personMatrix(st, plan, cols, { people, rows })
  const teams = [...new Set(pm.map((x) => x.r.team))].sort((a, b) => rank(a) - rank(b))
  return teams.map((team) => {
    const members = pm.filter((x) => x.r.team === team)
    const cells = cols.map((_, i) => {
      let h = 0
      let cap = 0
      for (const m of members) {
        h += m.cells[i].h
        cap += m.cells[i].cap
      }
      return { h, cap, over: h > cap + 1e-9 }
    })
    return { team, members, cells }
  })
}

/**
 * Üst başlık bantları: ardışık sütunlar aynı anahtarda birleşir (gün görünümünde ay ve hafta, hafta
 * görünümünde ay, ay görünümünde yıl). Döner: [{ key, span, from }] — etiketi bileşen biçimler.
 */
export function bandsFor(cols, keyOf) {
  const out = []
  for (const c of cols) {
    const k = keyOf(c)
    const last = out[out.length - 1]
    if (last && last.key === k) last.span += 1
    else out.push({ key: k, span: 1, from: c.from })
  }
  return out
}

/** Sütunun ayı ("2026-9") ve yılı: bantların anahtarı. */
export const monthKey = (c) => yearMonth(c.from).join("-")
export const yearKey = (c) => String(yearMonth(c.from)[0])
/** Gün sütununun haftası: haftanın pazartesisi. */
export const weekKey = (c) => String(c.from - weekday(c.from))

/** Sütunun uzun adı (ipucu ve Excel başlığı): tarih, hafta ve aralığı ya da ay ve yıl. */
export function colTitle(c, zoom, locale, rt) {
  if (zoom === "day") return day(c.from, locale, { year: true })
  if (zoom === "week") {
    return `${rt("rm.matrix.week", { n: isoWeek(c.from) })} · ${day(c.from, locale)} – ${day(c.to, locale)}`
  }
  const [y, m] = yearMonth(c.from)
  return monthLabel(y, m, locale, { long: true })
}
