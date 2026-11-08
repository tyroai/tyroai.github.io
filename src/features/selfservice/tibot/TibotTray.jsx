import { useLocale } from "@/hooks/useLocale"
import { PeriodBar } from "../period/PeriodBar"
import { TileTray } from "../summary/TileTray"
import { useTibotTiles } from "./useTibotTiles"

/**
 * Ticket'ın özet tepsisi — Self Servis'in tepsisiyle aynı (`TileTray`, dört kutu): üstte dönem
 * çubuğu (yıllar + Tümü, son okuma, tek Yenile: liste ve yıl sayıları; dışa aktarma yok). Geniş
 * kartta gradyanın beyaz tepsisinde (`bare`), dar kapta kartın altında (`below`).
 */
export function TibotTray({ list, years, year, onYear, onRefresh, below = false }) {
  const { t } = useLocale()
  const period = year ?? t("selfService.allYears")
  const summary = useTibotTiles(list, year, String(period))
  const tray = (
    <TileTray
      cols={4}
      bare={!below}
      className={below ? undefined : "flex h-full flex-col"}
      tiles={summary.tiles}
      summary={summary}
      loading={list.status === "loading"}
      header={
        <PeriodBar
          className="ss-tray-bar px-2.5 pt-0.5"
          years={years}
          year={year}
          onYear={onYear}
          updatedAt={list.at ?? null}
          onRefresh={onRefresh}
          busy={list.busy}
        />
      }
    />
  )
  return below ? <div className="ss-tray-below mt-4">{tray}</div> : tray
}
