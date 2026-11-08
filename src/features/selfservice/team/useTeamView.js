import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { teamOverview } from "@/lib/selfServiceTeam"
import { soonList, windowOccasions, withOccasions } from "@/lib/teamOccasions"
import { timelineWindow } from "@/features/selfservice/lib/teamWindow"

/**
 * Ekibim'in türetilmiş verisi (`teamOverview`, bellekte): satırlar (her birinde sıradaki doğum
 * günü ve iş yıl dönümü, `occasions` — kişi bölmesi için), özet, gezinilen dönemin çizelgesi
 * (`window`: `timelineWindow`; `marks`: o dönemdeki doğum günü ve yıl dönümleri), telefonun
 * "Yaklaşanlar" listesi (`soon`: dönemin izinleri + günleri). `dates`: ekibin İK tarihleri
 * (`useTeamDates`); `nav`: `{ start, weeks }` (null başlangıç = bu hafta). Yalnız gün ya da dönem
 * değişince yeniden hesaplanır (sayfa gece açık kalsa da "bugün" kayar).
 */
export function useTeamView(team, dates, nav = {}) {
  const { t } = useLocale()
  const now = useMinuteNow()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const today = useMemo(() => new Date(y, m, d), [y, m, d])
  const start = nav.start?.getTime() ?? null
  const weeks = nav.weeks ?? 6
  return useMemo(() => {
    const range = timelineWindow(today, { start: start == null ? null : new Date(start), weeks })
    const overview = teamOverview(team.people, team.leave, { now: today, t, range })
    const rows = withOccasions(overview.rows, dates, today)
    const byKey = new Map(rows.map((r) => [r.key, r]))
    const end = range.to > range.last ? range.to : range.last
    const marks = windowOccasions(rows, dates, range.first, end, today)
    const inList = (o) => o.date >= range.from && o.date <= range.to
    const listed = rows.map((r) => ({
      key: r.key,
      occasions: (marks.get(r.key) ?? []).filter(inList),
    }))
    return {
      ...overview,
      rows,
      groups: overview.groups.map((g) => ({ ...g, rows: g.rows.map((r) => byKey.get(r.key)) })),
      soon: soonList(overview.upcoming, listed, { days: Infinity }),
      marks,
      window: range,
      today,
    }
  }, [team.people, team.leave, today, t, dates, start, weeks])
}
