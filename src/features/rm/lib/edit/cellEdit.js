// Matris hücresine yazma (şartname v5.8 inlineEdit): gün hücresi o günü, hafta hücresi haftanın
// proje tarihleri içindeki her iş gününü yazar. Saat 0–24; 0 da yazılır (o gün kuralı ezer).
import { toDay } from "@/lib/rm/engine/dates"

/**
 * Hücrenin yazılacağı günler ve şimdiki saat. `col.days` planlı iş günleri (tatil dahil değil);
 * proje tarihleri dışındaki günler düşer. Döner: { days, cur } ya da { error: "outside" }.
 */
export function cellTarget(plan, p, rid, col) {
  const s = toDay(p.start)
  const e = toDay(p.end)
  const days = col.days.filter((n) => n >= s && n <= e && plan.DT[n] !== "Tatil")
  if (!days.length) return { error: "outside" }
  const cur = plan.PA[p.id]?.[rid]?.[days[0]] || 0
  return { days, cur, week: col.from !== col.to }
}

/** Girilen metin → saat (boş = 0) ya da null (geçersiz). */
export function parseHours(v) {
  const t = String(v ?? "").trim()
  if (t === "") return 0
  const h = Math.round(+t)
  return Number.isNaN(h) || h < 0 || h > 24 ? null : h
}

/** Yazılacak saatin yükü: aşım varsa { ot, peak, cap } (onay ister), yoksa null. */
export function cellOverload(kit, pid, rid, days, h) {
  const map = {}
  for (const n of days) if (h > 0) map[n] = h
  const L = kit.evalLoad(pid, rid, map)
  if (!L.ot) return null
  const r = kit.rById.get(rid)
  return { ot: L.ot, peak: L.peak, cap: kit.capN(r, days[0]) }
}
