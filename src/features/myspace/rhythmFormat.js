import { getNumberFormat } from "@/lib/intl-cache"

/** Kısa süre: "45 dk" · "34,5 sa" (dar kartın ve ritmin sayı satırının biçimi). */
export function compactHours(minutes, t, locale) {
  return minutes < 60
    ? t("calendar.durationMinutes", { minutes })
    : t("calendar.durationHours", {
        hours: getNumberFormat(locale, { maximumFractionDigits: 1 }).format(minutes / 60),
      })
}

/** "1 sa 30 dk" · "1 sa" · "45 dk" — sıfır parça yazılmaz ("1 sa 0 dk" değil). */
export function formatHM(total, t) {
  const h = Math.floor(total / 60)
  const m = total % 60
  const parts = []
  if (h) parts.push(`${h} ${t("myspace.rhythm.h")}`)
  if (m || !h) parts.push(`${m} ${t("myspace.rhythm.m")}`)
  return parts.join(" ")
}
