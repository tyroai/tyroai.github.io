import { useState } from "react"
import { AnimatedCounter } from "@/components/common/AnimatedCounter"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { PeriodMenu, ToolsMenu } from "../period/PeriodMenu"
import { SummarySheet } from "./SummarySheet"
import { useSummaryTiles } from "./useSummaryTiles"
import "./phoneStats.css"

/**
 * TELEFONUN ÖZETİ — üstte dönem seçicisi ("2026 ▾") ve "⋯" (Yenile, Dışa aktar); altında tek
 * kartta üç değer (izin bakiyesi · masraflar · avanslar): yalnız ad + büyük değer. Alt bilgiler
 * (öteki para birimleri, sonraki hak ediş, toplam dışılar) değere dokununca açılan çekmecede
 * (`SummarySheet`, yalnız o değerin ayrıntısı). Veri geniş özet kartıyla aynı (`useSummaryTiles`).
 */
export function PhoneSummary({
  data,
  summary,
  year,
  accrual = null,
  years,
  onYear,
  updatedAt,
  onRefresh,
  busy,
  onExport,
  exportCount,
  className,
}) {
  const { t, locale } = useLocale()
  // Açıkken hangi değer: kapanırken içerik değişmesin diye kimlik kapanışta silinmez.
  const [sheet, setSheet] = useState({ open: false, only: null })
  const box = useSummaryTiles({ data, summary, year, accrual })
  return (
    <section
      aria-label={t("selfService.summary.label")}
      data-tour="ss-summary"
      className={cn("min-w-0", className)}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <PeriodMenu years={years} year={year} onYear={onYear} />
        <ToolsMenu
          updatedAt={updatedAt}
          onRefresh={onRefresh}
          busy={busy}
          onExport={onExport}
          exportCount={exportCount}
        />
      </div>
      <div className="ss-stats ms-surface">
        {box.tiles.map((tile) => (
          <button
            key={tile.tab.id}
            type="button"
            data-ss-stat={tile.tab.id}
            aria-haspopup="dialog"
            onClick={() => setSheet({ open: true, only: tile.tab.id })}
            className="ss-stat"
          >
            <span className="ss-stat-label">{tile.short ?? tile.title}</span>
            <span title={tile.full} data-private="" className="ss-stat-value">
              <span aria-hidden={tile.full ? "true" : undefined}>
                {tile.counter ? (
                  <AnimatedCounter {...tile.counter} locale={locale} fallback={tile.value} />
                ) : (
                  tile.value
                )}
              </span>
              {tile.full && <span className="sr-only">{tile.full}</span>}
            </span>
          </button>
        ))}
      </div>
      <SummarySheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        summary={box}
        accrual={accrual}
        only={sheet.only}
      />
    </section>
  )
}
