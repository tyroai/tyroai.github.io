import { ago } from "../../format"
import { getDateTimeFormat } from "@/lib/intl-cache"

const DAY = 24 * 3600e3

/**
 * Satırın düzenlenme zamanı: bir hafta içinde göreli ("2 sa önce", "dün"), daha eskisi kısa tarih
 * ("12 Eki"; başka yılda yıl da). Saf (`now` verilir): testli.
 */
export function editedLabel(date: Date | null, locale: string, now = Date.now()): string {
  if (!date) return ""
  const age = now - date.getTime()
  if (age < 7 * DAY) return ago(date, locale, Math.max(now, date.getTime()))
  const sameYear = new Date(now).getFullYear() === date.getFullYear()
  const opts: Intl.DateTimeFormatOptions = sameYear
    ? { day: "numeric", month: "short" }
    : { day: "numeric", month: "short", year: "numeric" }
  return getDateTimeFormat(locale, opts).format(date)
}
