import { useMemo } from "react"
import ChartColumnIcon from "@hugeicons/core-free-icons/ChartColumnIcon"
import { duration } from "@/components/common/event-detail/eventFormat"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { weekStats } from "@/features/myspace/lib/weekStats"
import { cn } from "@/lib/utils"
import { WidgetFrame } from "@/features/widgets/WidgetFrame"
import { compactHours } from "./rhythmFormat"

const OPTS_DAY = { weekday: "long" }
const OPTS_DAY_SHORT = { weekday: "short" }
const span = (minutes) => ({ start: new Date(0), end: new Date(minutes * 60_000) })

/**
 * Toplantı ritmin — panodaki küçük kartın hâli (eski "Haftam"): bu hafta toplantıda geçen süre,
 * kalan iş günlerindeki boş odak süresi, mesai dışı toplantılar ve en yoğun gün; dört eşit kutucuk
 * (`features/myspace/lib/weekStats`). Büyük kartta aynı sayılar çubukların yanında (`MeetingRhythmCard`). Dar
 * kartta (< 16rem) değer kısa biçimde ("34 sa 30 dk" → "34,5 sa", "Çarşamba" → "Çar"): değer
 * kesilmez.
 */
export function RhythmMini({ cal, now, className }) {
  const { t, locale } = useLocale()
  const s = useMemo(() => weekStats(cal.events, now), [cal.events, now])
  const compact = (minutes) => compactHours(minutes, t, locale)
  const tiles = [
    {
      id: "meetings",
      value: duration(span(s.minutes), t),
      short: compact(s.minutes),
      sub: t("widgets.week.meetingsSub", { n: s.count }),
    },
    {
      id: "focus",
      value: duration(span(s.focusMinutes), t),
      short: compact(s.focusMinutes),
      sub: t("widgets.week.focusSub"),
    },
    {
      id: "after",
      value: s.afterHours,
      sub: t("widgets.week.afterSub"),
      warn: s.afterHours > 0,
    },
    {
      id: "busiest",
      value: s.busiest ? getDateTimeFormat(locale, OPTS_DAY).format(s.busiest.date) : "—",
      short: s.busiest ? getDateTimeFormat(locale, OPTS_DAY_SHORT).format(s.busiest.date) : null,
      sub: s.busiest ? duration(span(s.busiest.minutes), t) : t("widgets.week.calm"),
    },
  ]
  return (
    <WidgetFrame
      id="rhythm"
      tour="rhythm"
      title={t("myspace.rhythm.title")}
      shortTitle={t("myspace.rhythm.titleShort")}
      icon={ChartColumnIcon}
      busy={cal.status === "loading"}
      className={className}
    >
      <ul className="mt-2.5 grid flex-1 grid-cols-2 gap-2">
        {tiles.map((x) => (
          <li
            key={x.id}
            className="flex min-h-0 flex-col justify-between rounded-2xl bg-muted/40 px-3 py-2 @max-[16rem]/widget:px-2.5"
          >
            {/* Mini kartta kısa ad: uzun dillerde ("Вне рабочего времени") üç satıra kırılıp
                kutuyu taşırıyordu. */}
            <span className="text-[0.6875rem] text-muted-foreground">
              <span className="@max-[16rem]/widget:hidden">{t(`widgets.week.${x.id}`)}</span>
              <span className="hidden @max-[16rem]/widget:inline">
                {t(`widgets.week.${x.id}Short`)}
              </span>
            </span>
            {cal.status === "loading" ? (
              <span aria-hidden="true" className="ms-skeleton mt-2 block h-5 w-16 rounded-full" />
            ) : (
              <span>
                <span
                  className={cn(
                    "block truncate text-[1.0625rem] font-semibold leading-tight tabular-nums @max-[16rem]/widget:text-[0.9375rem] [&::first-letter]:uppercase",
                    x.warn && "text-amber-600 dark:text-amber-400",
                  )}
                >
                  <span className={cn(x.short && "@max-[16rem]/widget:hidden")}>{x.value}</span>
                  {x.short && <span className="hidden @max-[16rem]/widget:inline">{x.short}</span>}
                </span>
                {/* En dar kartta alt satır ikiye kırılabilir: kırpılan bilgi olmasın. */}
                <span className="line-clamp-2 block text-[0.6875rem] leading-tight text-muted-foreground">
                  {x.sub}
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </WidgetFrame>
  )
}
