import { getDateTimeFormat } from "@/lib/intl-cache"
import { OPTS_DAY_FULL, dayDiff, minutesText } from "./eventFormat"

// Yıl yalnız bu yıl değilse: dar kartta gün adı ve saat yan yana sığsın.
const OPTS_DAY = { weekday: "long", day: "numeric", month: "long" }
// Çok günlü aralıkta gün adı düşer: "20 Ekim – 9 Kasım" dar kartta tek satır kalsın.
const OPTS_RANGE = { day: "numeric", month: "long" }
const OPTS_RANGE_FULL = { day: "numeric", month: "long", year: "numeric" }

/** Saatin altındaki durum: sürüyorsa kalan, bugün başlayacaksa ne zaman, bittiyse "Bitti". */
export function stateText(state, event, now, days, t) {
  if (state.phase === "ended") return t("calendar.detail.ended")
  if (event.isAllDay) {
    // Tek günlükte "10 sa 19 dk kaldı" gürültü (gün başlıkta yazılı); çok günlü sürerken kalan
    // gün asıl bilgi. Bitiş hariç: bugün de sayılır.
    if (days < 2 || state.phase !== "live") return null
    const left = t("calendar.durationDays", { days: dayDiff(now, event.end) })
    return `${t("calendar.detail.live")} · ${t("calendar.detail.left", { time: left })}`
  }
  if (state.phase === "live") {
    const left = t("calendar.detail.left", { time: minutesText(state.minutesLeft, t) })
    return `${t("calendar.detail.live")} · ${left}`
  }
  // Geri sayım yalnız bugün için: yarınki toplantıda "Başlamasına 19 sa" günü zaten söyleyen
  // başlığı tekrar ederdi.
  if (dayDiff(now, event.start) !== 0) return null
  return t("calendar.detail.startsIn", { time: minutesText(state.minutesToStart, t) })
}

/** Başlık: tek gün "30 Ekim Cuma"; çok günlü tüm gün etkinliği "20 Ekim – 9 Kasım" (bitiş hariç). */
export function dayTitle(event, days, now, locale) {
  const thisYear = event.start.getFullYear() === now.getFullYear()
  if (days < 2) {
    return getDateTimeFormat(locale, thisYear ? OPTS_DAY : OPTS_DAY_FULL).format(event.start)
  }
  const last = new Date(event.end.getTime() - 1)
  const sameYear = thisYear && last.getFullYear() === now.getFullYear()
  return getDateTimeFormat(locale, sameYear ? OPTS_RANGE : OPTS_RANGE_FULL).formatRange(
    event.start,
    last,
  )
}
