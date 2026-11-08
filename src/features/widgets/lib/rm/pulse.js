import { level, periodRange } from "@/lib/rm/metrics"
import { peopleLoad } from "@/lib/rm/overviewDetails"
import { overview, projectRows, teamGrid } from "@/lib/rm/portfolio"

/**
 * tyroRM nabzı (Anasayfa kartı): bu ayın ve gelecek ayın proje doluluğu (Genel Bakış'ın aynı
 * hesabı — `overview`), kapasiteyi aşanlar (Aşırı yüklenen kartının sırası — `peopleLoad`) ve
 * takvim riskindeki açık projeler (geciken ya da biteceği tarihi aşmış).
 */
export function rmPulse(st, plan, today) {
  const rows = projectRows(st, plan, today)
  const { from, to } = periodRange(st, plan, "6", today)
  const grid = teamGrid(st, plan, from, to, "project")
  const ov = overview(st, plan, today, rows, grid)
  const load = peopleLoad(st, plan, today)
  const risky = rows
    .filter((r) => r.phase !== "done" && r.signals.some((s) => s === "overdue" || s === "late"))
    .sort((a, b) => (a.end ?? Infinity) - (b.end ?? Infinity))
  return {
    month: grid.months[0] ?? null,
    next: grid.months[1] ?? null,
    util: ov.utilNow,
    utilNext: ov.utilNext,
    tone: level(ov.utilNow),
    over: load.over.map((o) => ({ id: o.r.id, name: o.r.name || "" })),
    risky: risky.map((r) => ({ id: r.id, name: r.name, overdue: r.signals.includes("overdue") })),
  }
}
