import { addDays, dayInfo, isWeekend, startOfDay } from "@/lib/leaveDays"
import { blockAround } from "@/lib/leaveBridges"
import { WORK_HOURS } from "@/lib/workHours"
import type { SceneKind } from "./sceneGeometry"

/**
 * Sahnenin GERÇEK verisi (saf, testli): her kartın tek bakışlık sayısı, alt satırı ve küçük
 * görseli. Veri yoksa satır yok — 0 ya da yer tutucu çizilmez (tek istisna yarının gerçek
 * "Toplantı yok"u). Metne çevirme bileşende (`sceneCopy`); burada yalnız sayı ve tarih.
 */

const MIN = 60_000
const MAX_BLOCK = 120

interface CalEvent {
  subject?: string
  start: Date
  end: Date
  isAllDay?: boolean
  owner?: unknown
  myResponse?: string
}
interface Task {
  done?: boolean
}
export interface SceneSlide {
  kind: string
  event?: CalEvent
  trip?: {
    subject?: string
    start: Date
    end: Date
    isAllDay?: boolean
    location?: string
    city?: unknown
  }
  minutes?: number
  last?: number
  window?: { start: Date; end: Date; minutes: number }
  bridge?: { holiday: { from: Date; to: Date }; bridge: Date; total: number }
  n?: number
  items?: { subject?: string }[]
}
export interface SceneCtx {
  now: number
  /** Takvim okunduysa olaylar; okunmadıysa null. */
  events: CalEvent[] | null
  /** To-Do okunduysa işler; okunmadıysa null. */
  tasks: Task[] | null
}

export type Lead =
  | { type: "hero"; value: number; fmt: "int" | "dec1"; unitKey: string }
  | { type: "time"; at: Date; unitKey: string }
  | { type: "key"; key: string }
  | { type: "text"; text: string | null }
  | { type: "range"; from: Date; to: Date }
  | { type: "place" }
export type Support =
  | { type: "text"; text: string | null; tone: "callout" | "footnote" }
  | { type: "key"; key: string }
  | { type: "range"; from: Date; to: Date }
  | { type: "trip"; days: number; from: Date; to: Date }
  | { type: "take"; day: Date }
  | { type: "chips"; meetings: number | null; tasks: number | null }
export interface Seg {
  from: number
  to: number
  tone: "busy" | "block" | "rest"
}
export type Visual =
  | { type: "bars"; ratio: number; delta: number }
  | { type: "timeline"; segs: Seg[]; now: number | null }
  | { type: "days"; days: ("holiday" | "weekend" | "bridge")[] }
  | { type: "week"; cols: number[]; today: number }

export interface SceneFacts {
  kind: SceneKind
  lead: Lead
  /** Tek satır, kesilmez (geri sayım, şehir, saat aralığı). */
  nowrap?: boolean
  support: Support | null
  visual: Visual | null
  leadLines?: 1 | 2
}

const own = (e: CalEvent) => !e.owner && !e.isAllDay && e.myResponse !== "declined"
const ownOn = (events: CalEvent[], day: Date) => {
  const from = startOfDay(day)
  const to = addDays(from, 1)
  return events
    .filter((e) => own(e) && e.start < to && e.end > from)
    .sort((a, b) => +a.start - +b.start)
}

/** Seyahatin son günü: tüm gün olayında ve gece yarısı bitende bitiş bir gün geri. */
export function inclusiveEnd(t: { start: Date; end: Date; isAllDay?: boolean }): Date {
  const midnight = t.end.getHours() === 0 && t.end.getMinutes() === 0
  if ((t.isAllDay || midnight) && t.end > t.start) return addDays(startOfDay(t.end), -1)
  return t.end
}

/** Pazartesi–cuma, günün kendi toplantı dakikası (en çoğa göre 0..1); hepsi boşsa null. */
function weekCols(events: CalEvent[] | null, now: number): Visual | null {
  if (!events) return null
  const today = startOfDay(new Date(now))
  const monday = addDays(today, -((today.getDay() + 6) % 7))
  const mins = Array.from({ length: 5 }, (_, i) =>
    ownOn(events, addDays(monday, i)).reduce((t, e) => {
      const from = Math.max(+e.start, +addDays(monday, i))
      const to = Math.min(+e.end, +addDays(monday, i + 1))
      return t + Math.max(0, to - from) / MIN
    }, 0),
  )
  const max = Math.max(...mins)
  if (max <= 0) return null
  const idx = Math.round((+today - +monday) / 86_400_000)
  return { type: "week", cols: mins.map((m) => m / max), today: idx <= 4 ? idx : -1 }
}

/** Odak penceresinin günlük şeridi: mesai, kendi toplantıları, ayrılacak blok, pencerenin kalanı. */
export function focusTimeline(
  win: NonNullable<SceneSlide["window"]>,
  events: CalEvent[] | null,
  now: number,
): Visual {
  const day = startOfDay(win.start)
  const at = (h: number) => +day + Math.round(h * 60) * MIN
  const from = Math.min(at(WORK_HOURS.from), +win.start)
  const to = Math.max(at(WORK_HOURS.to), +win.end)
  const span = to - from
  const f = (x: number) => Math.max(0, Math.min(1, (x - from) / span))
  const segs: Seg[] = []
  for (const e of ownOn(events ?? [], day)) {
    const a = f(+e.start)
    const b = f(+e.end)
    if (b > a) segs.push({ from: a, to: b, tone: "busy" })
  }
  const blockEnd = Math.min(+win.end, +win.start + MAX_BLOCK * MIN)
  segs.push({ from: f(+win.start), to: f(blockEnd), tone: "block" })
  if (+win.end > blockEnd) segs.push({ from: f(blockEnd), to: f(+win.end), tone: "rest" })
  return { type: "timeline", segs, now: now > from && now < to ? f(now) : null }
}

/** Köprünün gün kareleri: blok uzunluğu toplamla aynı ve ≤ 10 ise; yoksa null. */
export function bridgeDays(b: NonNullable<SceneSlide["bridge"]>): Visual | null {
  const first = +b.bridge < +b.holiday.from ? b.bridge : b.holiday.from
  const last = +b.bridge > +b.holiday.to ? b.bridge : b.holiday.to
  const block = blockAround(first, last)
  if (block.days !== b.total || block.days > 10) return null
  const hFrom = +startOfDay(b.holiday.from)
  const hTo = +startOfDay(b.holiday.to)
  const bridge = +startOfDay(b.bridge)
  const days = Array.from({ length: block.days }, (_, i) => {
    const d = addDays(block.start, i)
    const t = +d
    if (t === bridge) return "bridge" as const
    if ((t >= hFrom && t <= hTo) || dayInfo(d).kind === "holiday") return "holiday" as const
    return isWeekend(d) ? ("weekend" as const) : ("holiday" as const)
  })
  return { type: "days", days }
}

/** Slaytın sahne verisi; sahnesi olmayan tür (kurulum, kutlama) için null. */
export function sceneFacts(slide: SceneSlide, ctx: SceneCtx): SceneFacts | null {
  const { now, events } = ctx
  switch (slide.kind) {
    case "prepare": {
      const e = slide.event!
      const left = Math.ceil((+e.start - now) / MIN)
      return {
        kind: "prepare",
        lead:
          left <= 0
            ? { type: "key", key: "orb.prepare.now" }
            : { type: "hero", value: Math.min(120, left), fmt: "int", unitKey: "orb.unit.minToGo" },
        nowrap: true,
        // Konusu yoksa alt satır hiç yok ("(konu yok)" yer tutucusu değil).
        support: e.subject ? { type: "text", text: e.subject, tone: "callout" } : null,
        visual: null,
      }
    }
    case "recap": {
      const e = slide.event!
      return {
        kind: "recap",
        lead: { type: "text", text: e.subject || null },
        support: { type: "range", from: e.start, to: e.end },
        visual: null,
      }
    }
    case "trip": {
      const t = slide.trip!
      const days = Math.round((+startOfDay(t.start) - +startOfDay(new Date(now))) / 86_400_000)
      return {
        kind: "trip",
        lead: { type: "place" },
        nowrap: true,
        support: { type: "trip", days, from: t.start, to: inclusiveEnd(t) },
        visual: null,
      }
    }
    case "load": {
      const minutes = slide.minutes ?? 0
      const last = slide.last ?? 0
      return {
        kind: "load",
        lead: { type: "hero", value: minutes / 60, fmt: "dec1", unitKey: "orb.unit.meetingHours" },
        support: null,
        visual:
          last > 0
            ? { type: "bars", ratio: last / Math.max(minutes, last), delta: minutes / last - 1 }
            : null,
      }
    }
    case "focusFree": {
      const w = slide.window!
      return {
        kind: "focusFree",
        lead: { type: "range", from: w.start, to: w.end },
        nowrap: true,
        support: null,
        visual: focusTimeline(w, events, now),
      }
    }
    case "bridge": {
      const b = slide.bridge!
      return {
        kind: "bridge",
        lead: { type: "hero", value: b.total, fmt: "int", unitKey: "orb.unit.daysOff" },
        support: { type: "take", day: b.bridge },
        visual: bridgeDays(b),
      }
    }
    case "planDay": {
      // Sıfır sayılan çip çizilmez: "0 toplantı" bilgi değil, uydurulmuş satır olur.
      const meetings = (events ? ownOn(events, new Date(now)).length : 0) || null
      const tasks = (ctx.tasks ? ctx.tasks.filter((x) => !x.done).length : 0) || null
      return {
        kind: "planDay",
        lead: { type: "key", key: "orb.title.planDay" },
        support: meetings == null && tasks == null ? null : { type: "chips", meetings, tasks },
        visual: null,
      }
    }
    case "weekPlan":
      return {
        kind: "weekPlan",
        lead: { type: "key", key: "orb.title.weekPlan" },
        support: null,
        visual: weekCols(events, now),
      }
    case "weekWrap": {
      if (!events)
        return {
          kind: "weekWrap",
          lead: { type: "key", key: "orb.title.weekWrap" },
          support: null,
          visual: null,
        }
      const visual = weekCols(events, now)
      const today = startOfDay(new Date(now))
      const monday = addDays(today, -((today.getDay() + 6) % 7))
      const sunday = addDays(monday, 7)
      const minutes = events
        .filter((e) => own(e) && e.start < sunday && e.end > monday)
        .reduce((t, e) => t + (Math.min(+e.end, +sunday) - Math.max(+e.start, +monday)) / MIN, 0)
      // Toplantısız haftada "0 sa toplantı" yerine soru başlığı.
      if (minutes <= 0)
        return {
          kind: "weekWrap",
          lead: { type: "key", key: "orb.title.weekWrap" },
          support: null,
          visual,
        }
      return {
        kind: "weekWrap",
        lead: { type: "hero", value: minutes / 60, fmt: "dec1", unitKey: "orb.unit.meetingHours" },
        support: null,
        visual,
      }
    }
    case "tomorrow": {
      if (!events)
        return {
          kind: "tomorrow",
          lead: { type: "key", key: "orb.title.tomorrow" },
          support: null,
          visual: null,
          leadLines: 2,
        }
      const first = ownOn(events, addDays(new Date(now), 1))[0]
      return {
        kind: "tomorrow",
        lead: first
          ? { type: "time", at: first.start, unitKey: "orb.unit.firstMeeting" }
          : { type: "key", key: "orb.tomorrow.none" },
        support: null,
        visual: null,
      }
    }
    case "weekend":
      return {
        kind: "weekend",
        lead: { type: "key", key: "orb.title.weekend" },
        support: { type: "key", key: "orb.weekend.sup" },
        visual: null,
      }
    case "feed": {
      const subject = slide.items?.[0]?.subject
      return {
        kind: "feed",
        lead: { type: "hero", value: slide.n ?? 0, fmt: "int", unitKey: "orb.unit.newItems" },
        support: subject ? { type: "text", text: subject, tone: "callout" } : null,
        visual: null,
      }
    }
    default:
      return null
  }
}
