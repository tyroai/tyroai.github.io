import { RecordHero, RecordMeter } from "@/components/record-window/RecordHero"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { OPTS_TIME, allDaySpan, dayDiff, duration } from "./eventFormat"
import { dayTitle, stateText } from "./whenText"

/**
 * Kartın tek sayısı — toplantıyı açma nedeni: NE ZAMAN. Solda gün (bugün/yarın ve süre gri
 * satırda), sağda büyük saat aralığı, altında durum (sürüyor · kalan, başlamasına, bitti).
 * Sürerken çubuk geçen payı gösterir (bitmişte çubuk yok: "Bitti" yeter). Çok günlü tüm gün
 * etkinliği (saha denetimi, izin) aralığıyla ve kaç gün sürdüğüyle yazılır, sürerken kalan gün.
 */
export function EventWhen({ event, state, now }) {
  const { locale, t } = useLocale()
  const timeFmt = getDateTimeFormat(locale, OPTS_TIME)
  const days = event.isAllDay ? allDaySpan(event) : 1
  const offset = dayDiff(now, event.start)
  const relative = offset === 0 ? t("calendar.today") : offset === 1 ? t("calendar.tomorrow") : null
  const sub = [relative, event.isAllDay ? null : duration(event, t)].filter(Boolean).join(" · ")
  const live = state.phase === "live" && (!event.isAllDay || days > 1)
  const ended = state.phase === "ended"
  return (
    <RecordHero
      className="ev-when"
      title={dayTitle(event, days, now, locale)}
      sub={sub || null}
      value={
        event.isAllDay ? (
          days > 1 ? (
            t("calendar.durationDays", { days })
          ) : (
            t("calendar.allDay")
          )
        ) : (
          // Arapça rakamlar yalıtımda da ters dizilir: aralık yazıldığı sırada okunsun.
          <bdo dir="ltr">{`${timeFmt.format(event.start)} – ${timeFmt.format(event.end)}`}</bdo>
        )
      }
      caption={stateText(state, event, now, days, t)}
      tone={
        live
          ? "success"
          : state.phase === "soon" && !event.isAllDay
            ? "brand"
            : ended
              ? "neutral"
              : undefined
      }
      past={ended}
    >
      {live && <RecordMeter done={state.elapsed} />}
    </RecordHero>
  )
}
