import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import CloudLittleRainIcon from "@hugeicons/core-free-icons/CloudLittleRainIcon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { useLocale } from "@/hooks/useLocale"
import { useNarrow } from "../useNarrow"
import { FrameAction, WidgetFrame } from "../WidgetFrame"
import { WidgetOverlay } from "../WidgetOverlay"
import { RegionPicker } from "./RegionPicker"
import { RegionRow } from "./RegionRow"
import { useRegions } from "./useRegions"
import { useRegionWeather } from "./useRegionWeather"

/**
 * Bölge havası — seçilen üretim bölgelerinde (en çok üç) son 30 günün yağışı normale göre,
 * önümüzdeki yedi günün yağışı; ayrıntıda günlük yağış, kök bölgesi toprak nemi ve tahmin.
 * Kaynak NASA POWER (günde bir) ve MET Norway (saatte bir); normaller pakette.
 */
export default function RegionWeatherWidget({ className }) {
  const { t } = useLocale()
  const now = useMinuteNow()
  const { ids, toggle } = useRegions()
  const rows = useRegionWeather(ids, now)
  const [picking, setPicking] = useState(false)
  const list = useRef(null)
  // Sağ sütunun en dar hâli (1280–1366): satır iki katlı, değer adın altında.
  const tight = useNarrow(list, 128)
  const label = t("widgets.region.edit")
  return (
    <WidgetFrame
      id="region-weather"
      title={t("widgets.region.title")}
      shortTitle={t("widgets.region.titleShort")}
      icon={CloudLittleRainIcon}
      busy={rows.some((r) => r.loading)}
      className={className}
      action={
        <WidgetOverlay
          trigger={
            <FrameAction aria-label={label} title={label} className="px-1.5">
              <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" strokeWidth={2} />
            </FrameAction>
          }
          title={label}
          open={picking}
          onOpenChange={setPicking}
        >
          <RegionPicker ids={ids} onToggle={toggle} />
        </WidgetOverlay>
      }
    >
      <ul ref={list} className="mt-1.5">
        {rows.map((v) =>
          v.loading ? (
            <li key={v.region.id} aria-hidden="true" className="py-1">
              <span className="ms-skeleton block h-9 rounded-xl" />
            </li>
          ) : v.failed ? (
            <li key={v.region.id} className="flex min-h-11 items-center justify-between gap-2">
              <span className="truncate text-[0.8125rem] font-medium">
                {t(`widgets.region.name.${v.region.id}`)}
              </span>
              <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
                {t("widgets.region.error")}
              </span>
            </li>
          ) : (
            <RegionRow key={v.region.id} v={v} tight={tight} />
          ),
        )}
      </ul>
    </WidgetFrame>
  )
}
