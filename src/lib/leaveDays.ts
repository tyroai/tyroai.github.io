import { TR_HOLIDAYS } from "@/lib/holidays"
import type { Holiday, HolidayKey } from "@/lib/holidays"

/**
 * ÇALIŞMA GÜNÜ TAKVİMİ (saf) — gün aritmetiği, gün anahtarı, hafta sonu, resmî tatil ve arife
 * ağırlığının TEK yeri: hafta sonu ve bayram 0, arife ½, öteki 1. İzin formunun gün sayısı
 * (`leaveWorkdays`), takvimin katmanları, "Nasıl hesaplandı?" dökümü, köprüler
 * (`lib/leaveBridges`), Anlat ve dünya saati buradan okur. Tatil tablosu `lib/holidays.ts`.
 */

const DAY = 86_400_000
// Bir aralıkta en çok bu kadar gün yürünür: bozuk ya da çok uzun aralık döngüyü kilitlemesin.
const MAX_SPAN = 400
const pad = (n: number) => String(n).padStart(2, "0")

/** Yerel gün anahtarı "YYYY-AA-GG" (`ymd`). */
export type DayKey = string

/** Günün türü: iş günü · hafta sonu · resmî tatil · arife (yarım gün). */
export type DayKind = "work" | "weekend" | "holiday" | "eve"

/** Günün izin ağırlığı: hafta sonu ve bayram 0, arife ½, öteki 1. */
export type DayWeight = 0 | 0.5 | 1

/** Tatil dizininin bir günü. */
export interface HolidayDay {
  holiday: HolidayKey
  eve: boolean
}

/** Tatil listesinin gün dizini; `from`–`to` listenin kapsadığı yıllar. */
export interface HolidayIndex {
  days: Map<DayKey, HolidayDay>
  from: number
  to: number
}

/** Günün bilgisi (`dayInfo`). Hafta sonuna denk gelen bayram "holiday" (adıyla), ağırlığı 0. */
export interface DayInfo {
  kind: DayKind
  weekend: boolean
  holiday: HolidayKey | null
  eve: boolean
  weight: DayWeight
}

/** Aralığın bir günü (`dayBreakdown`). */
export interface DayEntry extends DayInfo {
  date: Date
}

/** "Nasıl hesaplandı?" satırı: aynı türden ardışık günler (`count`), ağırlıklarının toplamı. */
export interface BreakdownLine {
  from: Date
  to: Date
  kind: DayKind
  holiday: HolidayKey | null
  weight: number
  count: number
}

/** Yaklaşan tatil: tablo satırı + yerel ilk ve son gün, bugünden kaç gün sonra. */
export interface UpcomingHoliday extends Holiday {
  from: Date
  to: Date
  inDays: number
}

/** Çalışılmayan uç ipucu (`nonWorkingEdgeHint`). */
export type EdgeHint =
  | { edge: "none" }
  | {
      edge: "start" | "end"
      reason: "holiday" | "weekend"
      holiday: HolidayKey | null
      day: Date
    }

/** Yerel gün anahtarı "YYYY-AA-GG". */
export const ymd = (d: Date): DayKey =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** Gün anahtarı → yerel gece yarısı (saat dilimi kayması yok). */
export function parseYmd(key: DayKey): Date {
  const [y, m, d] = String(key).split("-").map(Number)
  return new Date(y, m - 1, d)
}
// Date ya da zaman damgası alır: eski kopyaların hepsi `new Date(d)` ile çağrılabiliyordu.
export const startOfDay = (d: Date | number | string): Date => {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate())
}
// Takvim günüyle ilerlenir (+24 saat değil): yaz saati geçişinde gün kaymasın.
export const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const sameDay = (a: Date | null | undefined, b: Date | null | undefined): boolean =>
  !!a && !!b && ymd(a) === ymd(b)
/** Cumartesi · pazar (Türkiye'nin hafta sonu). */
export const isWeekend = (d: Date): boolean => d.getDay() === 0 || d.getDay() === 6

/** İki gün arasındaki takvim günü farkı (`b - a`), saat diliminden bağımsız. */
export function dayDiff(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ub - ua) / DAY)
}

/** Tatil listesinin gün dizini. */
export function holidayIndex(list: readonly Holiday[] = TR_HOLIDAYS): HolidayIndex {
  const days = new Map<DayKey, HolidayDay>()
  for (const h of list) {
    const first = parseYmd(h.start)
    for (let i = 0; i < h.days; i++)
      days.set(ymd(addDays(first, i)), { holiday: h.key, eve: false })
    // Arife bayramın kendisine denk geliyorsa bayram kazanır (ağırlık 0).
    if (h.eve && !days.has(h.eve)) days.set(h.eve, { holiday: h.key, eve: true })
  }
  const years = list.map((h) => Number(h.start.slice(0, 4)))
  return { days, from: Math.min(...years), to: Math.max(...years) }
}

export const HOLIDAY_INDEX = holidayIndex()

/** Günün bilgisi; hafta sonuna denk gelen bayram "holiday" (adıyla), ağırlığı yine 0. */
export function dayInfo(date: Date, index: HolidayIndex = HOLIDAY_INDEX): DayInfo {
  const hit = index.days.get(ymd(date))
  const weekend = isWeekend(date)
  const holiday = hit?.holiday ?? null
  const eve = Boolean(hit?.eve)
  const weight: DayWeight = weekend || (holiday && !eve) ? 0 : eve ? 0.5 : 1
  const kind: DayKind = holiday && !eve ? "holiday" : weekend ? "weekend" : eve ? "eve" : "work"
  return { kind, weekend, holiday, eve, weight }
}

/** Aralık tatil listesinin yılları içinde mi (dışında yalnız hafta sonları düşülür). */
export function isCovered(start: Date, end: Date, index: HolidayIndex = HOLIDAY_INDEX): boolean {
  return start.getFullYear() >= index.from && end.getFullYear() <= index.to
}

/**
 * İzin aralığının tahmini iş günü (ağırlıkların toplamı); eksik ya da ters aralıkta null. Kesin
 * süreyi ERP hesaplar (vardiya, kısmi gün); form ön izleme gösterir. `dayBreakdown`'un aksine
 * aralık kırpılmaz: ERP'ye giden talep uzun izinde de tam sayıyı taşır.
 */
export function leaveWorkdays(
  start: Date | null | undefined,
  end: Date | null | undefined,
  index: HolidayIndex = HOLIDAY_INDEX,
): number | null {
  if (!start || !end || end < start) return null
  let days = 0
  for (let i = 0, n = dayDiff(start, end); i <= n; i++)
    days += dayInfo(addDays(start, i), index).weight
  return days
}

/** Bugün ya da sonrasındaki tatiller (bitmemişler), sırasıyla. */
export function upcomingHolidays(
  today: Date | number,
  list: readonly Holiday[] = TR_HOLIDAYS,
): UpcomingHoliday[] {
  const base = startOfDay(today)
  return list
    .map((h) => {
      const from = parseYmd(h.start)
      const to = addDays(from, h.days - 1)
      return { ...h, from, to, inDays: dayDiff(base, from) }
    })
    .filter((h) => h.to >= base)
}

/** Aralığın günleri, her biri `dayInfo` ile. */
export function dayBreakdown(
  start: Date | null | undefined,
  end: Date | null | undefined,
  index: HolidayIndex = HOLIDAY_INDEX,
): DayEntry[] {
  if (!start || !end || end < start) return []
  const out: DayEntry[] = []
  const span = Math.min(dayDiff(start, end), MAX_SPAN)
  for (let i = 0; i <= span; i++) {
    const date = addDays(start, i)
    out.push({ date, ...dayInfo(date, index) })
  }
  return out
}

/**
 * "Nasıl hesaplandı?" satırları: kısa aralıkta gün gün; uzun aralıkta (`max`'tan çok gün) aynı
 * türden ardışık günler tek satır (`from`–`to`, ağırlıkların toplamı) — doğum izni yüz satır olmasın.
 */
export function breakdownLines(
  days: readonly Pick<DayEntry, "date" | "kind" | "holiday" | "weight">[],
  max = 14,
): BreakdownLine[] {
  const lines: BreakdownLine[] = []
  for (const d of days) {
    const last = lines[lines.length - 1]
    const joins = days.length > max && last && last.kind === d.kind && last.holiday === d.holiday
    if (joins) {
      last.to = d.date
      last.weight += d.weight
      last.count += 1
    } else
      lines.push({
        from: d.date,
        to: d.date,
        kind: d.kind,
        holiday: d.holiday,
        weight: d.weight,
        count: 1,
      })
  }
  return lines
}

const reasonOf = (d: DayInfo): "holiday" | "weekend" =>
  d.kind === "holiday" ? "holiday" : "weekend"

/**
 * Başlangıç ya da bitiş çalışılmayan güne mi denk geliyor (bilgi; engellemez). `day` ilk ya da
 * son iş günü; aralıkta hiç iş günü yoksa `{ edge: "none" }`; uçlar iş günüyse `null`. Önce
 * başlangıca bakılır.
 */
export function nonWorkingEdgeHint(
  start: Date | null | undefined,
  end: Date | null | undefined,
  index: HolidayIndex = HOLIDAY_INDEX,
): EdgeHint | null {
  const days = dayBreakdown(start, end, index)
  if (!days.length) return null
  const work = days.filter((d) => d.weight > 0)
  if (!work.length) return { edge: "none" }
  const first = days[0]
  const last = days[days.length - 1]
  if (first.weight === 0)
    return { edge: "start", reason: reasonOf(first), holiday: first.holiday, day: work[0].date }
  if (last.weight === 0)
    return { edge: "end", reason: reasonOf(last), holiday: last.holiday, day: work.at(-1)!.date }
  return null
}
