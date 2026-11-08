import { monthYear, rangeText, unbreakable } from "./format"

// Bugünü içeren dönemin adı: mevcut sözlük anahtarları (Bugün · Bu hafta · Bu ay).
const THIS_PERIOD = {
  day: "calendar.today",
  week: "todo.kpi.period.week",
  month: "todo.kpi.period.month",
}

/**
 * Özet satırlarının dönem etiketi: dönem bugünü içeriyorsa "Bugün" · "Bu hafta" · "Bu ay", değilse
 * dönemin adı ("15 Ara", "14–20 Ara", "Aralık 2026"). Dar kapta üç günlük dönem hep adıyla.
 * `period`: `features/calendar/lib/range › periodOf`; `today` yerel gece yarısı.
 */
export function periodLabel(period, today, locale, t) {
  const key = THIS_PERIOD[period.kind]
  if (key && period.first <= today && today <= period.last) return t(key)
  if (period.kind === "month") return monthYear(period.first, locale)
  return unbreakable(rangeText(period.first, period.last, locale))
}
