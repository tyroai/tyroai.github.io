import { getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { keyNoon } from "@/features/widgets/lib/tripWeather"

const PCT = { style: "percent", maximumFractionDigits: 0 }
const WEEKDAY = { weekday: "short", timeZone: "UTC" }
const DAY_MONTH = { day: "numeric", month: "short", timeZone: "UTC" }

// Yağışın tonu: kuraklık uyarı renkleriyle, olağan nötr, yağışlı kartların yağmur mavisiyle.
export const STATE_TONE = {
  veryDry: "text-danger-ink",
  dry: "text-warning-ink",
  normal: "text-foreground",
  wet: "text-sky-700 dark:text-sky-400",
  season: "text-muted-foreground",
}

export const pct = (locale, x) => getNumberFormat(locale, PCT).format(x)

/** Milimetre: 10'un altında bir ondalık, üstünde tam sayı. */
export const mm = (locale, x) =>
  getNumberFormat(locale, { maximumFractionDigits: x < 10 ? 1 : 0 }).format(x)

export const weekday = (locale, key) => getDateTimeFormat(locale, WEEKDAY).format(keyNoon(key))
export const dayMonth = (locale, key) => getDateTimeFormat(locale, DAY_MONTH).format(keyNoon(key))

/** Satırın sağındaki değer: normale göre yüzde; kurak mevsimde toplam; veri yoksa "—". */
export function ratioText(rain, t, locale) {
  if (!rain) return "—"
  if (rain.ratio == null) return t("widgets.region.mm", { n: mm(locale, rain.total) })
  return pct(locale, rain.ratio)
}
