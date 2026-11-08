import { useCityTimes } from "@/features/widgets/worldclock/useCityTimes"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { useWorldClock } from "@/hooks/useWorldClock"

/**
 * Saf: kişinin iğnelediği ilk şehir (widget'ın ilk satırı); iğne yoksa yerel ve ana şehirden
 * sonraki ilk şehir, o da yoksa ana olmayan ilk; yoksa `null` (testli).
 */
export function pickAwayCity(rows, shown = []) {
  return (
    rows.find((c) => shown.includes(c.id) && !c.isHome) ??
    rows.find((c) => !c.isLocal && !c.isHome) ??
    rows.find((c) => !c.isHome) ??
    null
  )
}

/**
 * Tepsideki dünya saatinin şehri: header'da seçilen şehir (`cityId`, dünya saatinin listesinde
 * kaldıysa); yoksa iğnelenen ilk şehir; iğne de yoksa — yerel saat zaten header'da — dünya saati
 * penceresinin sırasıyla (batıdan doğuya) ilk uzak şehir.
 */
export function useAwayCity(now, cityId = null) {
  const clock = useWorldClock()
  const rows = useCityTimes({ home: clock.home, cities: clock.cities, now })
  return (cityId && rows.find((c) => c.id === cityId)) || pickAwayCity(rows, clock.shown)
}

/**
 * Tepsinin ve çentiğin kısa bilgisi: seçilen (`cityId`) ya da uzaktaki ilk şehrin saati; ekran
 * okuyucuya adıyla. Şehir yoksa `null`.
 */
export function useClockIndicator(cityId = null) {
  const now = useMinuteNow().getTime()
  const city = useAwayCity(now, cityId)
  if (!city) return null
  return { text: city.time, sr: `${city.name} ${city.time}`, name: city.name }
}
