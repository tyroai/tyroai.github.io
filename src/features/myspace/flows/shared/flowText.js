import { getDateTimeFormat } from "@/lib/intl-cache"

const DAY = { weekday: "short", day: "numeric", month: "short" }
const SHORT = { day: "numeric", month: "short" }

export const cap = (s, locale) => (s ? s.charAt(0).toLocaleUpperCase(locale) + s.slice(1) : s)

export const sameDay = (a, b) =>
  a instanceof Date && b instanceof Date && a.toDateString() === b.toDateString()

export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Cümledeki tarih: "Bugün, 13 Kas" ya da "Cmt 12 Ara". */
export function dayLabel(t, locale, date, today) {
  if (!(date instanceof Date)) return null
  return sameDay(date, today)
    ? `${t("advanceFlow.today")}, ${getDateTimeFormat(locale, SHORT).format(date)}`
    : getDateTimeFormat(locale, DAY).format(date)
}

/** Kısa gün: "17 Kas". */
export const shortDay = (locale, date) => getDateTimeFormat(locale, SHORT).format(date)
