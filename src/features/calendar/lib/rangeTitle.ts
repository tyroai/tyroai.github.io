import { getDateTimeFormat } from "@/lib/intl-cache"
import { weekNumber, weekStartOf } from "./range"

/**
 * Araç çubuğunun tek satırlık dönem başlığı: ne gösteriliyorsa TAM o. Hafta "26 Ekim – 1 Kasım
 * 2026" (hafta sonu gizliyse "26–30 Ekim 2026"), gün "30 Ekim Cuma", ay "Ekim 2026". Yanında soluk
 * not: hafta ve günde hafta numarası, ayda hafta aralığı. Biçim dile göre `Intl`den (sıra, ay adı,
 * tire) — tarihler kendimiz dizilmez. Telefonda (`compact`) Bugün ve oklarla tek satıra sığsın diye
 * kısa: "26 Eki – 1 Kas" ve "(44. hf)"; yıl yalnız bu yılın dışındaysa.
 */

type Translate = (key: string, vars?: Record<string, unknown>) => string

const RANGE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
const DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }
const MONTH: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }
const SHORT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
const SHORT_DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }

/** Kısa biçimin seçenekleri: aralığın iki ucu da bu yılın dışındaysa yıl eklenir. */
function short(base: Intl.DateTimeFormatOptions, first: Date, last: Date, today: Date) {
  const year = today.getFullYear()
  const away = first.getFullYear() !== year && last.getFullYear() !== year
  return away ? { ...base, year: "numeric" as const } : base
}

/** Satır sonunda bölünmesin: "26 Ekim – 1 Kasım 2026" tek parça kalır. */
const unbreakable = (s: string) => s.replace(/\u2009/g, "\u202F").replace(/ /g, "\u00A0")

export function rangeTitle({
  view,
  days,
  locale,
  t,
  firstDay = 1,
  compact = false,
  today = new Date(),
}: {
  view: string
  days: Date[]
  locale: string
  t: Translate
  firstDay?: number
  compact?: boolean
  today?: Date
}): { title: string; note: string } {
  const first = days[0]
  const last = days[days.length - 1]
  const week = (d: Date) => weekNumber(weekStartOf(d, firstDay))
  const weekNote = (n: number) =>
    t(compact ? "calendar.page.weekTiny" : "calendar.page.weekShort", { n })
  if (view === "day") {
    const opts = compact ? short(SHORT_DAY, first, first, today) : DAY
    return { title: getDateTimeFormat(locale, opts).format(first), note: weekNote(week(first)) }
  }
  if (view === "month") {
    const mid = days[Math.min(15, days.length - 1)]
    const from = week(new Date(mid.getFullYear(), mid.getMonth(), 1))
    const to = week(new Date(mid.getFullYear(), mid.getMonth() + 1, 0))
    return {
      title: getDateTimeFormat(locale, MONTH).format(mid),
      note: t("calendar.page.weeksRange", { from, to }),
    }
  }
  const fmt = getDateTimeFormat(locale, compact ? short(SHORT, first, last, today) : RANGE)
  const title =
    typeof fmt.formatRange === "function" && first.getTime() !== last.getTime()
      ? fmt.formatRange(first, last)
      : fmt.format(first)
  // Tarihler bölünmez, satır gerekirse yalnız tireden sonra kırılır (iki yıla yayılan hafta).
  const safe = unbreakable(title).replace(/([\u00A0\u202F])–[\u00A0\u202F]/, "$1– ")
  return { title: safe, note: weekNote(week(first)) }
}
