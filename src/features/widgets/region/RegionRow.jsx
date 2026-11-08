import { lazy, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { WidgetOverlay } from "../WidgetOverlay"
import { mm, ratioText, STATE_TONE } from "./regionFormat"

const RegionDetail = lazy(() => import("./RegionDetail"))

/**
 * Bölge satırı: ad ve önümüzdeki yedi günün yağışı; sağda son 30 günün normale göre yüzdesi ve
 * durumu (çok kuru · kuru · olağan · yağışlı). En dar kartta değer adın altında, tahmin ayrıntıda.
 * Basınca ayrıntı: günlük yağış, toprak nemi, tahmin.
 */
export function RegionRow({ v, tight }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const name = t(`widgets.region.name.${v.region.id}`)
  const tone = STATE_TONE[v.state] ?? "text-muted-foreground"
  const value = ratioText(v.rain, t, locale)
  const crops = v.region.crops.map((c) => t(`widgets.region.crop.${c}`)).join(" · ")
  const sub = v.ahead
    ? v.ahead.total >= 1
      ? t("widgets.region.ahead", { mm: mm(locale, v.ahead.total) })
      : t("widgets.region.aheadNone")
    : crops
  const trigger = (
    <button
      type="button"
      className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-2.5 rounded-xl px-2 text-start transition outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] font-medium">{name}</span>
        {tight ? (
          <span className="block truncate text-[0.6875rem] text-muted-foreground">
            <span className={cn("font-semibold", tone)}>{value}</span>
            {v.state && ` · ${t(`widgets.region.state.${v.state}`)}`}
          </span>
        ) : (
          <span className="block truncate text-[0.6875rem] text-muted-foreground">{sub}</span>
        )}
      </span>
      {!tight && (
        <span className="shrink-0 text-end">
          <span className={cn("block text-[0.9375rem] leading-tight font-semibold", tone)}>
            {value}
          </span>
          {v.state && (
            <span className="block text-[0.6875rem] text-muted-foreground">
              {t(`widgets.region.state.${v.state}`)}
            </span>
          )}
        </span>
      )}
    </button>
  )
  return (
    <li>
      <WidgetOverlay
        trigger={trigger}
        title={name}
        open={open}
        onOpenChange={setOpen}
        align="start"
      >
        <RegionDetail v={v} crops={crops} />
      </WidgetOverlay>
    </li>
  )
}
