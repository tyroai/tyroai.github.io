import { getDateTimeFormat } from "@/lib/intl-cache"
import { offsetMinutes, wallClock } from "@/lib/worldClock"

const OPTS_DAY = { weekday: "short", day: "numeric", month: "short" }
const pad = (n) => String(n).padStart(2, "0")

/** "Pzt 27 Eki – Çar 29 Eki" (çok günlükse), tek günse yalnız başlangıç. */
export function tripDates(trip, locale) {
  const day = getDateTimeFormat(locale, OPTS_DAY)
  const multi = trip.end - trip.start > 86_400_000
  return multi
    ? `${day.format(trip.start)} – ${day.format(new Date(trip.end - 1))}`
    : day.format(trip.start)
}

/**
 * Varış şehrinin saati ("16:30") — yalnız saat farkı varsa; yurt içinde ya da aynı dilimde
 * kişinin kendi saati zaten görünüyor: `null`.
 */
export function awayTime(city, now) {
  if (!city) return null
  const date = new Date(now)
  if (offsetMinutes(city.tz, date) === -date.getTimezoneOffset()) return null
  const w = wallClock(city.tz, date)
  return `${pad(w.h)}:${pad(w.mi)}`
}
