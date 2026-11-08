import { getNumberFormat } from "@/lib/intl-cache"

/** Kısa süre: "45 dk" · "34,5 sa" (dar kartın ve ritmin sayı satırının biçimi). */
export function compactHours(minutes, t, locale) {
  return minutes < 60
    ? t("calendar.durationMinutes", { minutes })
    : t("calendar.durationHours", {
        hours: getNumberFormat(locale, { maximumFractionDigits: 1 }).format(minutes / 60),
      })
}
