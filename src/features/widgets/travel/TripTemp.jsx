import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { FORECAST_ICON } from "./forecastIcons"

/** Günün simgesi ve en yüksek/en düşük ("18° / 11°"; dar kartta "18°"); ekran okuyucuya cümle olarak. */
export function TripTemp({ day, className }) {
  const { t } = useLocale()
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 tabular-nums", className)}>
      <HugeiconsIcon
        icon={FORECAST_ICON[day.kind] ?? FORECAST_ICON.cloudy}
        aria-hidden="true"
        className="size-3.5"
        strokeWidth={1.9}
      />
      <span aria-hidden="true">
        {day.max}°{/* Dar kartta yalnız en yüksek; ikisi de cümlede (ekran okuyucu). */}
        <span className="@max-[16rem]/widget:hidden"> / {day.min}°</span>
      </span>
      <span className="sr-only">
        {t("widgets.travel.tempAria", {
          cond: t(`myspace.weather.c.${day.kind}`),
          max: day.max,
          min: day.min,
        })}
      </span>
    </span>
  )
}
