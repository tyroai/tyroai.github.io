import { upcomingHours } from "@/lib/weather"

/**
 * Hava kartının "şemsiye" satırı (saf, testli): önümüzdeki saatlerde yağış ya da sert soğuma.
 * Kaynak zaten yüklenen saatlik tahmin (`parseForecast` › `hourly`, 24 saat) — ek istek yok.
 * Tahmin, radar değil: cümleler "bekleniyor" der, saat "sularında"; çok hafif yağış sayılmaz.
 * Ayrıntı: docs/features/anasayfa-hava-yagmur.md.
 */

/** Saatlik bu kadar yağış "yağıyor" sayılır; altı çisenti. */
export const WET_MM = 0.3
/** Başladıktan sonra bu kadarı da sürüyor sayılır (yağış bir saat hafifleyince bölünmesin). */
const GOING_MM = 0.1
/** Başlangıç bu kadar saat içinde aranır. */
export const LOOKAHEAD_H = 12
/** Yağış yoksa en az bu kadar düşüş söylenir (°C). */
export const DROP_C = 6
/** Header tepsisi yalnız bu kadar saat içindeki yağışı gösterir. */
const HEADER_MS = 3 * 3_600_000

/**
 * Satırın bilgisi ya da null:
 * - `{ type: "until", what, at }` — yağış sürüyor, `at` dineceği saat
 * - `{ type: "long", what }` — yağış sürüyor, tahminin sonuna dek dinmiyor
 * - `{ type: "soon", what, at, hours, long }` — 12 saat içinde başlıyor; `hours` kaç saat
 *   sürdüğü, `long` tahminin sonuna dek sürüyorsa
 * - `{ type: "drop", by, at }` — yağış yoksa 12 saat içinde en az 6° düşüş, `at` en soğuk saat
 * `what`: "rain" · "snow" (karla karışık yağmur yağmur sayılır). `now`: ms.
 */
export function weatherOutlook(hourly, now = Date.now()) {
  const hours = upcomingHours(hourly, now)
  if (!hours.length) return null
  const wet = hours.findIndex((h, i) => i < LOOKAHEAD_H && h.precip >= WET_MM)
  if (wet >= 0) {
    let end = wet
    while (end + 1 < hours.length && hours[end + 1].precip >= GOING_MM) end += 1
    const what = hours[wet].kind === "snow" ? "snow" : "rain"
    const dry = hours[end + 1] ?? null
    if (wet === 0) return dry ? { type: "until", what, at: dry.at } : { type: "long", what }
    return { type: "soon", what, at: hours[wet].at, hours: end - wet + 1, long: !dry }
  }
  const window = hours.slice(0, LOOKAHEAD_H).filter((h) => Number.isFinite(h.temp))
  if (window.length < 2) return null
  const low = window.reduce((a, b) => (b.temp < a.temp ? b : a))
  const by = window[0].temp - low.temp
  return by >= DROP_C ? { type: "drop", by, at: low.at } : null
}

/** Header tepsisinde damla: yağış sürüyor ya da 3 saat içinde başlıyor. */
export function rainNear(outlook, now = Date.now()) {
  if (!outlook || outlook.type === "drop") return false
  return outlook.type !== "soon" || outlook.at.getTime() - now <= HEADER_MS
}

/** Soğumanın günün hangi bölümüne düştüğü: akşam (17–21) · gece (22–05) · saatle. */
export function dropPart(at) {
  const h = at.getHours()
  if (h >= 17 && h <= 21) return "evening"
  if (h >= 22 || h <= 5) return "night"
  return "at"
}
