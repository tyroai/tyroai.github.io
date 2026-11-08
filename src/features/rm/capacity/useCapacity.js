import { useMemo } from "react"
import {
  isOver,
  monthsBetween,
  openManDays,
  periodRange,
  personBuckets,
  ratio,
  sumBuckets,
} from "@/lib/rm/metrics"

export const PERIODS = ["3", "6", "12", "all"]
export const MEASURES = ["project", "load"]

/**
 * Kapasite sayfasının hesabı: dönem ve ölçüye göre kişi × ay kovaları, ekip toplamları,
 * özet sayılar. Aşım ve boş adam-gün seçili ölçüye göre (proje kapasitesi ya da mesai).
 * `teamStats`: ekip filtresinden bağımsız ekip başına kişi sayısı ve dönem doluluğu (filtre
 * listesinde). Hesap tarayıcıda (188 gün × 30 kişi birkaç ms).
 */
export function useCapacity(st, plan, today, { period, measure, team }) {
  return useMemo(() => {
    const { from, to } = periodRange(st, plan, period, today)
    const months = monthsBetween(from, to)
    const order = (plan.teams.list || []).map((t) => t.name)
    const everyone = st.resources.map((r) => ({ r, pb: personBuckets(st, plan, r, months) }))
    const teamStats = new Map()
    for (const name of new Set(everyone.map((p) => p.r.team))) {
      const list = everyone.filter((p) => p.r.team === name)
      teamStats.set(name, {
        n: list.length,
        x: ratio(sumBuckets(list.map((p) => p.pb.T)), measure),
      })
    }
    const people = everyone.filter((p) => !team || p.r.team === team)
    const teams = [...new Set(people.map((p) => p.r.team))].sort((a, b) => {
      const ia = order.indexOf(a)
      const ib = order.indexOf(b)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
    const groups = teams.map((name) => {
      const members = people.filter((p) => p.r.team === name)
      const cells = months.map((m) => {
        const b = sumBuckets(members.map((p) => p.pb.M[m.key]))
        return { key: m.key, b, x: ratio(b, measure) }
      })
      const total = sumBuckets(members.map((p) => p.pb.T))
      return { name, members, cells, total, x: ratio(total, measure) }
    })
    const all = sumBuckets(people.map((p) => p.pb.T))
    const over = people.filter(({ pb }) => months.some((m) => isOver(pb.M[m.key], measure)))
    let peak = null
    for (const g of groups) {
      g.cells.forEach((c, i) => {
        if (c.x != null && Number.isFinite(c.x) && (!peak || c.x > peak.x))
          peak = { team: g.name, month: months[i], x: c.x }
      })
    }
    const dayHours = +st.settings.dayHours || 8
    return {
      from,
      to,
      months,
      groups,
      people,
      all,
      util: ratio(all, measure),
      over,
      peak,
      open: openManDays(all, dayHours, measure),
      dayHours,
      teamStats,
    }
  }, [st, plan, today, period, measure, team])
}
