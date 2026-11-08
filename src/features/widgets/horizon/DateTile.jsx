import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { dateParts } from "./horizonFormat"

// Karonun tonu: sıradaki hedef paletin beyaz yazılı dolgusu (rampa açık uçta beyazı AA'nın altına
// çekiyordu; parıltı CSS'te), gecikmiş kırmızımsı, biten soluk; gerisi kartın üstünde hafif
// kabarık bir cam karo (macOS'un takvim karosu gibi).
const TONE = {
  next: "bg-brand-solid text-brand-on-brand",
  late: "bg-danger/10 text-danger-ink ring-1 ring-danger/30",
  done: "bg-foreground/[0.04] text-muted-foreground ring-1 ring-border/70",
  base: "bg-card/80 text-foreground ring-1 ring-border/70",
}

/**
 * Tarih karosu, takvim yaprağı gibi: üstte ay (aralıklı büyük harf), ortada gün büyük ve eşit
 * genişlikli rakamla, altta yıl. Görsel: tarihi satırın açıklaması söylüyor.
 */
export function DateTile({ dueKey, tone = "base", size = "md", className }) {
  const { locale } = useLocale()
  const { day, month, year } = dateParts(dueKey, locale)
  return (
    <span
      aria-hidden="true"
      data-tone={tone}
      data-size={size}
      className={cn(
        "hz-tile relative grid shrink-0 content-center justify-items-center px-1 text-center",
        TONE[tone] ?? TONE.base,
        className,
      )}
    >
      <span className="hz-month max-w-full truncate font-semibold leading-none">{month}</span>
      <span className="hz-day font-bold leading-none tabular-nums">{day}</span>
      <span className="hz-year max-w-full truncate font-medium leading-none">{year}</span>
      {tone === "done" && (
        <span className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-success text-white ring-2 ring-card">
          <HugeiconsIcon icon={Tick02Icon} className="size-2.5" strokeWidth={3} />
        </span>
      )}
    </span>
  )
}
