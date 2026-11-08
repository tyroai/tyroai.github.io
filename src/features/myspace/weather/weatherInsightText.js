import "@/lib/i18n/insight"

/** Konum satırındaki şemsiye hapıyla aynı bilgiyi taşıyan cümleler (hap o zaman çizilmez). */
export const OUTLOOK_IDS = new Set(["soon", "until", "long", "drop"])

/**
 * Hava kartının başındaki cümle (`lib/weatherInsight` sonucundan). Saat "sularında": tahmin,
 * radar değil — ve Türkçede saate ek gelmez (`outlookText`in kuralı). Sıcaklık `f.temp`
 * ("−2°"), rüzgâr km/sa tam sayı.
 */
export function weatherInsightText(w, { t, timeFmt, f }) {
  const time = w.at ? timeFmt.format(w.at) : ""
  const k = (key, params) => t(`insight.weather.${key}`, { time, ...params })
  switch (w.id) {
    case "thunder":
      return k(w.now ? "thunder.now" : "thunder.soon")
    case "soon":
      return k(`${w.long ? "soonLong" : "soon"}.${w.what}`)
    case "until":
    case "long":
      return k(`${w.id}.${w.what}`)
    case "wind":
      return k("wind", { n: f.num(w.kmh) })
    case "freeze":
    case "heat":
      return k(w.id, { temp: f.temp(w.temp) })
    case "drop":
      return k(`drop.${w.part}`, { n: f.num(w.by) })
    case "cold":
      return k(`cold.${w.part}`, { temp: f.temp(w.temp) })
    case "fog":
      return k("fog")
    case "clearing":
      return k(w.night ? "clearing.night" : "clearing.day")
    case "fair":
      return k(w.night ? "fair.night" : "fair.day", { temp: f.temp(w.temp) })
    case "dry":
      return k("dry", { min: f.temp(w.min), max: f.temp(w.max) })
    default:
      return ""
  }
}
