import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Download04Icon from "@hugeicons/core-free-icons/Download04Icon"
import { RefreshButton } from "@/components/common/RefreshButton"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { TextTabs } from "../board/TextTabs"
import { GHOST, ICON } from "../chips"
import { updatedText } from "./updatedText"

/**
 * DÖNEM ÇUBUĞU — sayfanın seçili dönemi (yıllar + Tümü; sade, altı çizili metin seçimi, oklarla
 * gezilir), son okuma saati, Yenile ve Dışa aktar (süzülmüş listenin CSV'si; ikon düğmeler;
 * `onExport` yoksa düğme yok — Ticket).
 * Özetin üst şeridi: özet, sekme sayıları, rapor ve liste bu dönemi izler. Eylemler çerçevesiz:
 * şerit sessiz kalır. Yıl çok olursa seçim kendi içinde kayar, eylemler sabit.
 */
export function PeriodBar({
  years,
  year,
  onYear,
  updatedAt,
  onRefresh,
  busy,
  onExport,
  exportCount,
  className,
}) {
  const { t, locale } = useLocale()
  const updated = updatedText(updatedAt, locale)
  const all = t("selfService.allYears")
  const options = useMemo(
    () => [...years, null].map((y) => ({ value: y, label: y ?? all })),
    [years, all],
  )
  const exportLabel = t("selfService.export.aria", { n: exportCount ?? 0 })
  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <TextTabs
        size="sm"
        label={t("selfService.period")}
        options={options}
        value={year}
        onChange={onYear}
      />
      <span className="flex-1" />
      {updated && (
        <span className="hidden shrink-0 whitespace-nowrap pe-1 text-[0.6875rem] tabular-nums text-muted-foreground @[56rem]/ss:inline">
          {t("selfService.updated", { time: updated })}
        </span>
      )}
      <RefreshButton iconOnly label={t("selfService.refresh")} busy={busy} onRefresh={onRefresh} />
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          disabled={!exportCount}
          aria-label={exportLabel}
          title={exportLabel}
          className={cn(GHOST, ICON)}
        >
          <HugeiconsIcon icon={Download04Icon} strokeWidth={1.9} />
        </button>
      )}
    </div>
  )
}
