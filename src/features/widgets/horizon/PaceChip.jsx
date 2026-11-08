import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const TONE = {
  ok: "bg-success/12 text-success-ink",
  risk: "bg-warning/12 text-warning-ink",
}

/**
 * Hedefin tempo işareti (`paceOf`): "Yolunda" · "Riskte". Gecikmişte çizilmez — kalan sürenin
 * cümlesi zaten "3 gün gecikti" der, kırmızıyla. Renk tek ipucu değil: işaret yazıyla.
 */
export function PaceChip({ pace, className }) {
  const { t } = useLocale()
  if (!pace || !TONE[pace.kind]) return null
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
        TONE[pace.kind],
        className,
      )}
    >
      {t(`widgets.horizon.pace.${pace.kind}`)}
    </span>
  )
}
