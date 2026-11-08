import { meetingsOn as meetingsOnJs } from "@/lib/brief"
import { busyBlocks as busyBlocksJs, freeWindows as freeWindowsJs } from "@/lib/focusWindow"
import { addDays, dayInfo, isWeekend, startOfDay } from "@/lib/leaveDays"
import { setClock, WORK_HOURS } from "@/lib/workHours"

/**
 * Günün okumasının ölçüleri (saf): bakılan günün yükü ve boşlukları, kişinin olağan yükü
 * (kıyas tabanı) ve haftanın en yoğun günü. Hikâyeler (`stories.ts`) bunlardan seçilir.
 * Takvim aralığının kapsamadığı gün hiç sayılmaz: "boş" sanılıp ortalamayı düşürmesin.
 */

export interface CalEvent {
  start: Date
  end: Date
  isAllDay?: boolean
  myResponse?: string
  owner?: unknown
  subject?: string
  location?: string
  showAs?: string | null
  id?: string
  seriesMasterId?: string | null
}

export interface FocusTask {
  done?: boolean
  overdue?: boolean
}

export interface Window {
  start: Date
  end: Date
  minutes: number
}

export interface Span {
  start: Date
  end: Date
}

/** Kişinin olağan yükü: iş günü başına toplantı dakikası (bakılan gün hariç, ≥ 5 gün). */
export interface Baseline {
  avg: number
  days: number
  /** Bakılan günün yükü / ortalama; ortalama 30 dk'nın altındaysa anlamsız (`null`). */
  ratio: number | null
  /** Geçen haftanın aynı günü (aralık kapsıyorsa). */
  lastWeek: number | null
}

export interface WeekLoad {
  busiest: { date: Date; minutes: number } | null
  /** Bakılan gün haftanın en yoğunu mu (en az 3 bilinen iş günü arasında). */
  peak: boolean
  known: number
}

export const STREAK_GAP_MIN = 10
export const STREAK_MIN = 3
/** Parça sayılan en kısa boşluk (dk): daha kısası "ara", iş için yer değil. */
export const PIECE_MIN = 30
export const MIN = 60_000

// `lib/brief` ve `lib/focusWindow` JS: imzalar burada daraltılır.
export const meetingsOn = meetingsOnJs as (
  events: CalEvent[],
  day: Date,
  from?: Date | null,
) => CalEvent[]
const busyBlocks = busyBlocksJs as (events: CalEvent[], day: Date) => Span[]
export const freeWindows = freeWindowsJs as (
  events: CalEvent[],
  day: Date,
  now: number | null,
  opts?: { min?: number },
) => Window[]

export const at = (day: Date, h: number) => setClock(new Date(day), h)
export const workEnd = (day: Date) => at(day, WORK_HOURS.to)
export const sameDate = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()
export const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7))

/** Çalışılan gün mü: hafta sonu ve resmî tatil değil (arife yarım gün, çalışılır sayılır). */
export function workingDay(d: Date): boolean {
  if (isWeekend(d)) return false
  return dayInfo(d).kind !== "holiday"
}

export function nextWorkingDay(d: Date): Date {
  let day = addDays(startOfDay(d), 1)
  for (let i = 0; i < 14 && !workingDay(day); i += 1) day = addDays(day, 1)
  return day
}

/** En uzun arka arkaya dizi (aralar ≤ 10 dk): `{ n, start, end }` ya da null. */
export function longestStreak(meetings: CalEvent[]) {
  let best: { n: number; start: Date; end: Date } | null = null
  let run: { n: number; start: Date; end: Date } | null = null
  for (const m of meetings) {
    if (run && m.start.getTime() - run.end.getTime() <= STREAK_GAP_MIN * MIN) {
      run.n += 1
      if (m.end > run.end) run.end = m.end
    } else run = { n: 1, start: m.start, end: m.end }
    if (!best || run.n > best.n) best = { ...run }
  }
  return best && best.n >= STREAK_MIN ? best : null
}

/** Günün yükü: toplantı sayısı ve mesaideki meşgul dakika (örtüşenler bir kez). */
export function dayLoad(events: CalEvent[], day: Date) {
  const blocks = busyBlocks(events, day)
  const minutes = blocks.reduce((s, b) => s + (b.end.getTime() - b.start.getTime()) / MIN, 0)
  return { count: meetingsOn(events, day).length, minutes: Math.round(minutes), blocks }
}

/** Gün takvim aralığının içinde mi (aralık bilinmiyorsa hayır: iddia kurulmaz). */
function covered(day: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false
  return startOfDay(day) >= startOfDay(start) && addDays(startOfDay(day), 1) <= end
}

/**
 * Kıyas tabanı: geçen hafta ve bu haftanın iş günleri (bakılan gün hariç), yalnız takvim
 * aralığının kapsadıkları. 5 günden azsa taban yok — iki günün ortalaması "olağan" değil.
 */
export function baselineOf(
  events: CalEvent[],
  day: Date,
  minutes: number,
  range: { start: Date | null; end: Date | null },
): Baseline | null {
  const monday = mondayOf(day)
  const loads: number[] = []
  for (let i = -7; i < 7; i += 1) {
    const d = addDays(monday, i)
    if (sameDate(d, day) || !workingDay(d) || !covered(d, range.start, range.end)) continue
    loads.push(dayLoad(events, d).minutes)
  }
  if (loads.length < 5) return null
  const avg = loads.reduce((a, b) => a + b, 0) / loads.length
  const prev = addDays(startOfDay(day), -7)
  const lastWeek =
    workingDay(prev) && covered(prev, range.start, range.end) ? dayLoad(events, prev).minutes : null
  return { avg, days: loads.length, ratio: avg >= 30 ? minutes / avg : null, lastWeek }
}

/** Bakılan günün haftası (pzt–cuma, bilinen iş günleri): en yoğun gün. */
export function weekLoad(
  events: CalEvent[],
  day: Date,
  range: { start: Date | null; end: Date | null },
): WeekLoad {
  const monday = mondayOf(day)
  let busiest: WeekLoad["busiest"] = null
  let known = 0
  for (let i = 0; i < 5; i += 1) {
    const d = addDays(monday, i)
    if (!workingDay(d) || !covered(d, range.start, range.end)) continue
    known += 1
    const { minutes } = dayLoad(events, d)
    if (minutes > 0 && (!busiest || minutes > busiest.minutes)) busiest = { date: d, minutes }
  }
  const peak = known >= 3 && !!busiest && sameDate(busiest.date, day)
  return { busiest: known >= 3 ? busiest : null, peak, known }
}

/** Kendi takviminde günü kaplayan "ofis dışı" (izin) kaydı. */
export function awayOn(events: CalEvent[], day: Date): boolean {
  const from = at(day, WORK_HOURS.from)
  const to = workEnd(day)
  return events.some(
    (e) =>
      !e.owner &&
      e.showAs === "oof" &&
      e.myResponse !== "declined" &&
      e.start <= from &&
      e.end >= to,
  )
}

export const longest = (ws: Window[]) =>
  ws.reduce<Window | null>((a, b) => (!a || b.minutes > a.minutes ? b : a), null)
