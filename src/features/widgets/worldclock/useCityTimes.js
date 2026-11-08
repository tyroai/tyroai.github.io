import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { browserTimeZone } from "@/lib/graph"
import { getDateTimeFormat } from "@/lib/intl-cache"
import {
  cityName,
  cityPeriod,
  dayDiff,
  offsetLabel,
  offsetMinutes,
  orderCities,
  wallClock,
} from "@/lib/worldClock"

// Dünya saati penceresiyle aynı biçim: 24 saat, Arapçada da Latin rakam.
const TIME = (timeZone) => ({
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone,
  numberingSystem: "latn",
})
const DATE = (timeZone) => ({
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone,
  calendar: "gregory",
  numberingSystem: "latn",
})
// Dar kartın kısa tarihi ("27 Eki"): uzunu UTC farkını kesiyordu; gün adı da düşer (Arapçada
// kısa gün adı yok, "الثلاثاء" yine sığmıyordu).
const DATE_SHORT = (timeZone) => ({
  day: "numeric",
  month: "short",
  timeZone,
  calendar: "gregory",
  numberingSystem: "latn",
})

/**
 * Yer azken gösterilecek şehirler: liste sığıyorsa olduğu gibi; sığmıyorsa saat dilimlerine
 * yayılan `n` şehir — ana şehirle aynı farktakiler ve aynı farkın tekrarı atlanır, sonra batıdan
 * doğuya eşit aralıkla (14 ofis şehrinde üç satır hep Amerika olmasın).
 */
export function pickSpread(list, n) {
  if (list.length <= n) return list
  const distinct = list.filter(
    (c, i) => c.offset !== "±0" && list.findIndex((x) => x.offset === c.offset) === i,
  )
  const pool = distinct.length >= n ? distinct : list
  if (n === 1) return [pool[0]]
  return Array.from({ length: n }, (_, i) => pool[Math.round((i * (pool.length - 1)) / (n - 1))])
}

/**
 * Widget'ın şehirleri: kişi iğnelediyse onlar (listenin sırasıyla, en çok `n`), yoksa yer azken
 * saat dilimlerine yayılan seçim (`pickSpread`) (testli).
 */
export function pickShown(list, shown, n) {
  if (!shown?.length) return pickSpread(list, n)
  return list.filter((c) => shown.includes(c.id)).slice(0, n)
}

/** UTC farkı: "UTC+3", "UTC−5", "UTC+5:30", "UTC". */
export const utcLabel = (minutes) => (minutes ? `UTC${offsetLabel(minutes)}` : "UTC")

/**
 * Dünya saati widget'ının şehirleri: ana şehir başta, ötekiler batıdan doğuya (`orderCities`).
 * Her biri: ad, saat ve tarih (şehrin kendi diliminde), kadran için saat ve dakika, gün dilimi
 * (mesai · sabah erken/akşam · hafta sonu ya da tatil · gece), gece mi, ana şehre göre fark ve gün farkı (−1 · 0 · +1).
 * `now` dakikada bir değişir; liste yalnız o zaman yeniden hesaplanır.
 */
export function useCityTimes({ home, cities, now }) {
  const { locale } = useLocale()
  return useMemo(() => {
    const date = new Date(now)
    const ordered = orderCities(cities, home, date)
    const homeCity = ordered.find((c) => c.id === home) ?? ordered[0]
    if (!homeCity) return []
    const homeOff = offsetMinutes(homeCity.tz, date)
    const local = browserTimeZone()
    return ordered.map((city) => {
      const w = wallClock(city.tz, date)
      const off = offsetMinutes(city.tz, date)
      return {
        id: city.id,
        name: cityName(city, locale),
        isHome: city.id === homeCity.id,
        isLocal: city.tz === local,
        time: getDateTimeFormat(locale, TIME(city.tz)).format(date),
        date: getDateTimeFormat(locale, DATE(city.tz)).format(date),
        dateShort: getDateTimeFormat(locale, DATE_SHORT(city.tz)).format(date),
        h: w.h,
        mi: w.mi,
        period: cityPeriod(city.cc, w),
        night: w.h < 6 || w.h >= 18,
        offset: offsetLabel(off - homeOff),
        utc: utcLabel(off),
        dayShift: dayDiff(city.tz, homeCity.tz, date),
      }
    })
  }, [home, cities, now, locale])
}
