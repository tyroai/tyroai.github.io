// Kişinin günlük proje kapasitesi (şartname capOf/resCap, v5.3 kişiye özel değerlerle).
// Tam gün ekip: günlük saat (arife yarım). Danışman: günlük saat − destek − yazılımcıyla
// çalışma; kapanış günü 0. Tatil herkese 0.
import { toIso, weekday } from "./dates"

const num = (v, fallback) => (v != null && Number.isFinite(+v) ? +v : fallback)

/** Kişinin günlük saati, destek ve yazılımcıyla çalışma saati (kişiye özel değer önceliklidir). */
export function personHours(r, S) {
  return {
    dh: num(r?.dh, +S.dayHours),
    sup: num(r?.sup, +S.support),
    dev: num(r?.dev, +S.dev),
  }
}

/** Gün bazında proje kapasitesi (saat). */
export function capOf(st, plan, r, n) {
  const ty = plan.DT[n]
  if (ty === "Tatil") return 0
  const S = st.settings
  const half = ty === "Arife"
  const { dh, sup, dev } = personHours(r, S)
  if (plan.teams.isFullDay(r)) return Math.round(half ? dh / 2 : dh)
  if (r.closing && plan.closeSet.has(n)) return 0
  return Math.max(0, Math.round((half ? dh / 2 : dh) - (half ? Math.round(sup / 2) : sup) - dev))
}

/** Tam bir iş gününde proje kapasitesi (ör. danışman 8 − 2 − 1 = 5). */
export function resCap(st, plan, r) {
  const { dh, sup, dev } = personHours(r, st.settings)
  return plan.teams.isFullDay(r) ? dh : Math.max(0, dh - sup - dev)
}

/** (a, b] aralığındaki iş günü sayısı (hafta içi, TR tatili değil); a > b ise negatif. */
export function workdaysBetween(plan, a, b) {
  if (a == null || b == null) return null
  const sg = a <= b ? 1 : -1
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  let c = 0
  for (let n = lo + 1; n <= hi; n++) {
    if (weekday(n) < 5 && plan.hol[toIso(n)] !== "Tatil") c++
  }
  return sg * c
}
