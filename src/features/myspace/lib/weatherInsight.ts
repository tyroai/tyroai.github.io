import { upcomingHours } from "@/lib/weather"
import { dropPart, weatherOutlook as weatherOutlookJs } from "@/lib/weatherOutlook"

/**
 * Hava kartının başındaki tek cümle (selamlamanın eski yeri; saf, testli). Yalnız yüklenen
 * tahminden (`parseForecast` › `hourly`, 24 saat) — ek istek yok. Önümüzdeki 12 saatte EN
 * işe yarar tek bilgi, öncelik sırasıyla: uyarı (fırtına · yağış · rüzgâr · don · sert soğuma ·
 * sıcak · soğuk · sis) › değişim (açılıyor) › güzel gün › kuru saatler. Tahmin yoksa `null`.
 * Yağış ve soğuma `lib/weatherOutlook`un kuralıyla — konum satırındaki hap ile aynı hesap.
 */

export interface Hour {
  at: Date
  temp: number | null
  precip: number
  kind: string
  night?: boolean
  wind?: number | null
}

export type WeatherInsight =
  | { id: "thunder"; at: Date; now: boolean }
  | { id: "soon"; what: "rain" | "snow"; at: Date; long: boolean }
  | { id: "until"; what: "rain" | "snow"; at: Date }
  | { id: "long"; what: "rain" | "snow" }
  | { id: "wind"; at: Date; kmh: number }
  | { id: "freeze"; at: Date; temp: number }
  | { id: "drop"; at: Date; by: number; part: "evening" | "night" | "at" }
  | { id: "heat"; at: Date; temp: number }
  | { id: "cold"; at: Date; temp: number; part: "evening" | "night" | "at" }
  | { id: "fog" }
  | { id: "clearing"; at: Date; night: boolean }
  | { id: "fair"; temp: number; night: boolean }
  | { id: "dry"; min: number; max: number }

/** Bakılan saat. */
export const AHEAD_H = 12
/** Bu hızdan (km/sa, Beaufort 6) sert rüzgâr. */
export const WIND_KMH = 40
/** Bu sıcaklıktan (°C) yukarısı sıcak uyarısı. */
export const HEAT_C = 32
/** Bu sıcaklık ve altı soğuk uyarısı (don ayrı, ≤ 0). */
export const COLD_C = 5
const CLEAR = new Set(["clear", "partly"])
const GREY = new Set(["cloudy", "fog", "lightRain", "showers", "rain", "heavyRain", "sleet"])

type Part = "evening" | "night" | "at"
type Outlook =
  | { type: "soon"; what: "rain" | "snow"; at: Date; hours: number; long: boolean }
  | { type: "until"; what: "rain" | "snow"; at: Date }
  | { type: "long"; what: "rain" | "snow" }
  | { type: "drop"; by: number; at: Date }
// `lib/weatherOutlook` JS: dönüş birleşimi çıkarımda gevşiyor.
const weatherOutlook = weatherOutlookJs as (
  hourly: Hour[] | null | undefined,
  now: number,
) => Outlook | null

const finite = (n: number | null | undefined): n is number => Number.isFinite(n)

/** En uç değerli saat (`pick` > 0 ise daha büyüğü). */
function extreme(hours: Hour[], value: (h: Hour) => number | null | undefined, sign: 1 | -1) {
  let best: Hour | null = null
  for (const h of hours) {
    const v = value(h)
    if (!finite(v)) continue
    const b = best ? value(best) : null
    if (!finite(b) || v * sign > b * sign) best = h
  }
  return best
}

export function weatherInsight(
  hourly: Hour[] | null | undefined,
  now: number = Date.now(),
): WeatherInsight | null {
  const hours = (upcomingHours(hourly, now) as Hour[]).slice(0, AHEAD_H)
  if (!hours.length) return null

  const storm = hours.find((h) => h.kind === "thunder")
  if (storm) return { id: "thunder", at: storm.at, now: storm === hours[0] }

  const rain = weatherOutlook(hourly, now)
  if (rain && rain.type !== "drop") {
    if (rain.type === "soon") return { id: "soon", what: rain.what, at: rain.at, long: rain.long }
    if (rain.type === "until") return { id: "until", what: rain.what, at: rain.at }
    return { id: "long", what: rain.what }
  }

  const gust = extreme(hours, (h) => h.wind, 1)
  if (gust && (gust.wind ?? 0) >= WIND_KMH) return { id: "wind", at: gust.at, kmh: gust.wind ?? 0 }

  const low = extreme(hours, (h) => h.temp, -1)
  const high = extreme(hours, (h) => h.temp, 1)
  if (low && (low.temp ?? 1) <= 0) return { id: "freeze", at: low.at, temp: low.temp ?? 0 }
  if (rain?.type === "drop")
    return { id: "drop", at: rain.at, by: rain.by, part: dropPart(rain.at) as Part }
  if (high && (high.temp ?? 0) >= HEAT_C) return { id: "heat", at: high.at, temp: high.temp ?? 0 }
  if (low && (low.temp ?? 99) <= COLD_C)
    return { id: "cold", at: low.at, temp: low.temp ?? 0, part: dropPart(low.at) as Part }

  if (hours[0].kind === "fog") return { id: "fog" }
  // Şimdi kapalı, 12 saat içinde açılıyor: değişim güzel günden önce söylenir.
  if (GREY.has(hours[0].kind)) {
    const open = hours.find((h) => CLEAR.has(h.kind))
    if (open) return { id: "clearing", at: open.at, night: Boolean(open.night) }
  }
  const temps = hours.map((h) => h.temp).filter(finite)
  if (!temps.length) return null
  const clear = hours.filter((h) => CLEAR.has(h.kind)).length
  const night = Boolean(hours[0].night)
  // Saatlerin çoğu açık: gündüz en yüksek, gece en düşük sıcaklıkla.
  if (clear * 3 >= hours.length * 2)
    return { id: "fair", temp: night ? Math.min(...temps) : Math.max(...temps), night }
  return { id: "dry", min: Math.min(...temps), max: Math.max(...temps) }
}
