import { OPTS_TIME } from "@/components/common/event-detail/eventFormat"
import { dayKey } from "@/features/calendar/lib/range"
import { getDateTimeFormat } from "@/lib/intl-cache"

/**
 * Takvim sayfasının metin biçimleri: saat aralığı, gün adı, dönem başlığı, ekran okuyucu etiketi.
 * Seçenek nesneleri modül düzeyinde: `getDateTimeFormat`ın önbellek anahtarı kararlı kalır.
 */

const WEEKDAY = { weekday: "long" }
const WEEKDAY_SHORT = { weekday: "short" }
const DAY_MONTH = { day: "numeric", month: "short" }
const DAY_MONTH_LONG = { day: "numeric", month: "long" }
const DAY_FULL = { weekday: "long", day: "numeric", month: "long" }
const MONTH_YEAR = { month: "long", year: "numeric" }
const DATE_FULL = { day: "numeric", month: "long", year: "numeric" }
const DATE_SHORT = { day: "numeric", month: "short", year: "numeric" }

export const weekday = (d, locale) => getDateTimeFormat(locale, WEEKDAY).format(d)
export const weekdayShort = (d, locale) => getDateTimeFormat(locale, WEEKDAY_SHORT).format(d)
export const dayFull = (d, locale) => getDateTimeFormat(locale, DAY_FULL).format(d)
export const dayMonth = (d, locale) => getDateTimeFormat(locale, DAY_MONTH_LONG).format(d)
export const dateFull = (d, locale) => getDateTimeFormat(locale, DATE_FULL).format(d)
export const dateShort = (d, locale) => getDateTimeFormat(locale, DATE_SHORT).format(d)
export const monthYear = (d, locale) => getDateTimeFormat(locale, MONTH_YEAR).format(d)
export const clock = (d, locale) => getDateTimeFormat(locale, OPTS_TIME).format(d)

/** "8–14 Kas": aynı ayda kısa aralık; `formatRange` yoksa iki tarih. */
export function rangeText(a, b, locale) {
  const fmt = getDateTimeFormat(locale, DAY_MONTH)
  return typeof fmt.formatRange === "function" && a.getTime() !== b.getTime()
    ? fmt.formatRange(a, b)
    : fmt.format(a)
}

/** Satır sonunda bölünmesin: "26 Eki – 1 Kas" tek parça kalır, "Kas" tek başına alta düşmez. */
export const unbreakable = (s) => s.replace(/\u2009/g, "\u202F").replace(/ /g, "\u00A0")

/** "Pzt 26 Eki": kısa gün adı önce, her dilde aynı sırayla (Intl'in kendi sırası dile göre değişir). */
export const dayLabel = (d, locale) =>
  unbreakable(`${weekdayShort(d, locale)} ${getDateTimeFormat(locale, DAY_MONTH).format(d)}`)

/** Tek gün "Pzt 26 Eki", birden çok günse "26 Eki – 1 Kas" (bölünmez parça). */
export const spanLabel = (a, b, locale) =>
  dayKey(a) === dayKey(b) ? dayLabel(a, locale) : unbreakable(rangeText(a, b, locale))

/** "07:00 – 09:00" ya da tüm gün öğede boş (çağıran "Tüm gün" yazar). */
export const timeRange = (item, locale) =>
  item.allDay ? "" : `${clock(item.start, locale)} – ${clock(item.end, locale)}`

/**
 * Ekran okuyucu için zaman: "Salı 11:00–11:45" ya da "Salı, tüm gün" (çok günlüde aralık). Düğmenin
 * adı GÖRÜNEN içerikten kurulur (etiket yok): görünen metin adın içinde kalır ve ad, türü ve günü
 * görünmez ön/son ekle ("Toplantı: … , Salı 11:00–11:45") taşır.
 */
export function whenText(item, locale, t) {
  if (!item.allDay) {
    return `${weekday(item.start, locale)} ${clock(item.start, locale)}–${clock(item.end, locale)}`
  }
  const last = new Date(item.end.getTime() - 1)
  const span =
    item.firstKey === item.lastKey
      ? weekday(item.start, locale)
      : rangeText(item.start, last, locale)
  return `${span}, ${t("calendar.allDay")}`
}

/** Görünmez ön ek: "Toplantı: ". */
export const srKind = (item, t) => `${t(`calendar.page.kind.${item.kind}`)}: `
