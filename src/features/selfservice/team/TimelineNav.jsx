import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useLocale } from "@/hooks/useLocale"
import { TIMELINE_RANGES } from "@/features/selfservice/lib/teamWindow"
import { cn } from "@/lib/utils"
import { TextTabs } from "../board/TextTabs"
import { GHOST, ICON } from "../chips"

// Kapalı düğme odağı düşürmesin (`disabled` değil `aria-disabled`): sınırda klavye yerinde kalır.
const OFF = "aria-disabled:pointer-events-none aria-disabled:opacity-40"

/**
 * Çizelgenin dönem gezinmesi — ‹ önceki · Bugün · sonraki › ve (verilirse) aralık seçimi
 * (6 hafta · 3 ay). `window`: `timelineWindow` çıktısı (`prev` null → okunan ilk güne gelindi);
 * `onNav(ilkGün | null)`: null bu haftaya döner; `onWeeks(hafta)`: aralık.
 */
export function TimelineNav({ window: win, weeks, onNav, onWeeks, className }) {
  const { t } = useLocale()
  const ranges = Object.entries(TIMELINE_RANGES).map(([key, value]) => ({
    value,
    label: t(`selfService.team.range.${key}`),
  }))
  const step = (to) => () => to && onNav(to)
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1", className)}>
      <div role="group" aria-label={t("selfService.team.nav.label")} className="flex items-center">
        <button
          type="button"
          onClick={step(win.prev)}
          aria-disabled={!win.prev || undefined}
          aria-label={t("selfService.team.nav.prev")}
          title={t("selfService.team.nav.prev")}
          className={cn(GHOST, ICON, OFF)}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="rtl:rotate-180" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => !win.home && onNav(null)}
          aria-disabled={win.home || undefined}
          className={cn(GHOST, OFF)}
        >
          {t("selfService.team.nav.today")}
        </button>
        <button
          type="button"
          onClick={step(win.next)}
          aria-label={t("selfService.team.nav.next")}
          title={t("selfService.team.nav.next")}
          className={cn(GHOST, ICON)}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="rtl:rotate-180" strokeWidth={2} />
        </button>
      </div>
      {onWeeks && (
        <TextTabs
          size="sm"
          label={t("selfService.team.nav.range")}
          options={ranges}
          value={weeks}
          onChange={onWeeks}
        />
      )}
    </div>
  )
}
