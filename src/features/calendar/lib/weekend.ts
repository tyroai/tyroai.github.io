/**
 * Hafta görünümünde hafta sonu (Cumartesi, Pazar): yer kazanmak için boşsa gizlenir. Kural tek:
 * kişi ızgaranın sonundaki katlama şeridinden (›) açtıysa hep görünür; kapalıysa hafta sonu
 * günlerinden birinde görünen bir kayıt (toplantı, tüm gün, izin, tatil…) varsa yine görünür — kayıt
 * asla gizlenmez, o hafta katlama denetimi de çizilmez. Yalnız yedi günlük hafta; gün, ay ve dar kapın üç
 * günü dokunulmaz.
 */

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6

/** "YYYY-MM-DD" (yerel gün): `lib/range › dayKey` ile aynı biçim. */
const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

export type WeekendState = {
  /** Izgaraya verilecek günler. */
  days: Date[]
  /** Hafta sonu bu dönemde söz konusu mu (katlama şeridi yalnız o zaman). */
  applies: boolean
  /** Kişi kapatmış ama hafta sonunda kayıt olduğu için yine gösteriliyor. */
  forced: boolean
}

/**
 * Görünen günler. `marked`: kaydı olan günlerin anahtarları (`lib/layout › markedDays`, görünen
 * öğelerden — kapalı katman ve aramada elenen sayılmaz).
 */
export function weekendDays(
  days: Date[],
  { view, show, marked }: { view: string; show: boolean; marked: Set<string> },
): WeekendState {
  const weekend = days.filter(isWeekend)
  const applies = view === "week" && days.length === 7 && weekend.length > 0
  if (!applies || show) return { days, applies, forced: false }
  const busy = weekend.some((d) => marked.has(keyOf(d)))
  if (busy) return { days, applies, forced: true }
  return { days: days.filter((d) => !isWeekend(d)), applies, forced: false }
}

export const WEEKEND_KEY = "tyro-calendar-weekend"

/** Kişinin seçimi bu tarayıcıda (kişisel veri değil); depolama kapalıysa varsayılan: gizli. */
export function readShowWeekend(storage?: Storage): boolean {
  try {
    return (storage ?? globalThis.localStorage).getItem(WEEKEND_KEY) === "1"
  } catch {
    return false
  }
}

export function writeShowWeekend(show: boolean, storage?: Storage) {
  try {
    ;(storage ?? globalThis.localStorage).setItem(WEEKEND_KEY, show ? "1" : "0")
  } catch {
    // Depolama kapalı: seçim yalnız bu oturumda.
  }
}
