import { useLocale } from "@/hooks/useLocale"
import { StatsList } from "./StatsList"

/**
 * Sağ panel (geniş kapta) ya da ızgaranın altı: "Takvim özeti". Satırın üstüne gelince kartı açılır (`StatsList`); telefonda (`accordion`)
 * satırın altında açılır. `hidden`: yerinde bir etkinliğin ayrıntısı açık (`DetailPanel`); özet
 * kaldırılmaz, kapanınca satırlar ve açık balonun odağı yerinde kalır.
 */
export function LeaveStatsPanel({ rows, lists, loading, actions, accordion = false, hidden }) {
  const { t } = useLocale()
  return (
    <aside className="cal-stats" aria-labelledby="cal-stats-title" hidden={hidden}>
      <header className="cal-stats-head">
        <h2 id="cal-stats-title">{t("calendar.page.stats.title")}</h2>
      </header>
      <StatsList
        rows={rows}
        lists={lists}
        loading={loading}
        actions={actions}
        accordion={accordion}
      />
    </aside>
  )
}
