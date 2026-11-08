import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { exportRecords } from "../period/exportRecords"
import { PeriodBar } from "../period/PeriodBar"
import { refreshAll } from "../lib/refreshAll"
import { SummaryTiles } from "../SummaryTiles"

/**
 * Kartın beyaz tepsisi (`SelfHero`): üstte dönem çubuğu (yıllar · Tümü · güncellendi · Yenile ·
 * Dışa aktar), altında özetin üç kutusu. Veri gelene kadar kutuların yeri tutulur (zıplama yok).
 * `below`: dar ve kısa kapta kart yalnız kişi (boyu To-Do'nunkiyle aynı), aynı özet kartın hemen
 * altında sakin yüzeyde.
 */
export function HeroTray({ ss, data, view, sel, years, update, accrual, below = false }) {
  const { t } = useLocale()
  if (ss.status === "loading") {
    return (
      <div aria-hidden="true" className={cn("grid gap-3 p-2.5", below && "mt-4")}>
        <span className="ms-skeleton block h-6 w-40 rounded-full" />
        <span className="ms-skeleton block h-24 rounded-2xl" />
      </div>
    )
  }
  if (ss.status !== "ready" || !data) return null
  const tiles = (
    <SummaryTiles
      bare={!below}
      // Kartın içinde tepsi kartın boyunu alır; kutular dikeyde ortada.
      className={below ? undefined : "flex h-full flex-col"}
      data={data}
      summary={view.summary}
      year={sel.year}
      accrual={accrual}
      header={
        <PeriodBar
          className="ss-tray-bar px-2.5 pt-0.5"
          years={years}
          year={sel.year}
          onYear={(y) => update({ year: y })}
          updatedAt={ss.updatedAt}
          onRefresh={() => refreshAll(ss.refresh)}
          busy={ss.busy}
          onExport={() => exportRecords(t, { tab: sel.tab, year: sel.year, view })}
          exportCount={view.shown.length}
        />
      }
    />
  )
  // Kartın altındayken rehber turunun "özet" adımı da buraya bakar (kartın içinde tepsi taşır).
  return below ? (
    <div data-tour="ss-summary" className="ss-tray-below mt-4">
      {tiles}
    </div>
  ) : (
    tiles
  )
}
