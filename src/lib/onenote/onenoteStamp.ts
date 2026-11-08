import { getDateTimeFormat } from "@/lib/intl-cache"

/** Okuyucudaki tam damga: "30 Eki 2026 14:20". */
export function editedStamp(date: Date | null, locale: string): string {
  if (!date) return ""
  return getDateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
