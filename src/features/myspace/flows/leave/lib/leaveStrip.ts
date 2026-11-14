import { addDays, dayDiff, dayInfo, sameDay } from "@/lib/leaveDays"

/** İzin sahnesindeki takvim şeridinin bir hücresi. */
export interface StripCell {
  key: string
  /** Gün; `null` ise araya giren "+N gün" hücresi. */
  date: Date | null
  /** Atlanan gün sayısı (yalnız ara hücrede). */
  more: number
  /** İzin aralığının içinde. */
  in: boolean
  /** Hafta sonu ya da resmî tatil (izinden düşmez). */
  off: boolean
  first: boolean
  last: boolean
  today: boolean
}

// Şerit telefonda da tek satıra sığsın: en çok 14 hücre. Uzun izinde başı ve sonu gösterilir.
const MAX = 14
const MIN = 9
const HEAD = 6
const TAIL = 5

/**
 * Takvim şeridinin hücreleri. Aralık yokken bugünden başlayan iki hafta; aralık kısaysa iki yanında
 * komşu günlerle ortalanır; 12 günden uzunsa ilk 6 ve son 5 gün, arada "+N".
 */
export function leaveStrip(start: Date | null, end: Date | null, today: Date): StripCell[] {
  const from = start ?? today
  const to = start ? (end && dayDiff(start, end) >= 0 ? end : start) : null
  const len = to ? dayDiff(from, to) + 1 : 0
  const cell = (date: Date): StripCell => {
    const inside = to != null && dayDiff(from, date) >= 0 && dayDiff(date, to) >= 0
    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      more: 0,
      in: inside,
      off: dayInfo(date).weight === 0,
      first: inside && sameDay(date, from),
      last: inside && to != null && sameDay(date, to),
      today: sameDay(date, today),
    }
  }
  const run = (first: Date, count: number) =>
    Array.from({ length: count }, (_, i) => cell(addDays(first, i)))
  if (to && len + 2 > MAX) {
    const skipped = len - HEAD - TAIL
    return [
      ...run(addDays(from, -1), HEAD + 1),
      {
        key: "more",
        date: null,
        more: skipped,
        in: true,
        off: false,
        first: false,
        last: false,
        today: false,
      },
      ...run(addDays(to, 1 - TAIL), TAIL + 1),
    ]
  }
  const total = len ? Math.min(MAX, Math.max(MIN, len + 4)) : MAX
  const before = len ? Math.floor((total - len) / 2) : 1
  return run(addDays(from, -before), total)
}
