import { upcomingBridges } from "@/lib/leaveBridges"
import { addDays, startOfDay } from "@/lib/leaveDays"
import { upcomingTrips } from "@/lib/travel"
import { factsOf, type InsightFacts } from "./insight/facts"
import {
  at,
  nextWorkingDay,
  sameDate,
  workingDay,
  type CalEvent,
  type FocusTask,
} from "./insight/shape"
import { candidates, pick, type Story, type StoryParams } from "./insight/stories"

export { longestStreak, STREAK_GAP_MIN, STREAK_MIN } from "./insight/shape"
export type { CalEvent, FocusTask } from "./insight/shape"
export type { InsightFacts } from "./insight/facts"

/**
 * Anasayfa selamlamasının altındaki okuma (saf, testli). Formül **neden → sonuç → öneri**:
 * cümle, günün en çok açıklayan nedeniyle başlar (haftanın en yoğun günü, ortalamanın iki
 * katı yük, bölünmüş boş zaman, yaklaşan ağır gün, sığmayan işler, izin, yolculuk…). Adaylar
 * puanlanır, en yükseği kazanır (`insight/stories`). Mesai bitmeye yakınsa (ya da hafta
 * sonu, tatil) bir sonraki iş gününe bakar. Söylenecek doğru bir şey yoksa `null`.
 */

export type InsightDay = "today" | "tomorrow" | "weekday"
export type InsightSource = "calendar" | "todo" | "holidays"

export type InsightAction =
  { kind: "focus"; start: Date; end: Date } | { kind: "plan" } | { kind: "leave"; day: Date }

export interface DayInsight extends Partial<StoryParams> {
  /** Sözlükte `insight.<id>` (Türkçesi `strings.tr.insight.js`). */
  id: string
  /** İkinci cümle: `insight.then.<tail>`. */
  tail?: string
  score: number
  day: InsightDay
  /** Bakılan gün (bugün ya da bir sonraki iş günü; yolculukta yolculuk günü). */
  date: Date
  /** Yolculuğun şehri, dillere göre ad (`lib/travel` › `cityIn`). */
  city?: Record<string, string>
  holiday?: string
  facts: InsightFacts
  action: InsightAction | null
  sources: InsightSource[]
}

/** Bu saatten sonra bugün yerine bir sonraki iş gününe bakılır. */
export const LOOK_AHEAD_FROM = 17
/** Odak bloğu en çok bu kadar (dk): Odak penceresi widget'ıyla aynı. */
export const FOCUS_BLOCK_MAX = 120

type Trip = CalEvent & { city?: { names?: Record<string, string> } | null }

/** Bugün (şimdiden sonra) ya da `until` gününe dek başlayan yolculuk. */
function tripSoon(events: CalEvent[], now: Date, until: Date) {
  const limit = addDays(startOfDay(until), 1)
  const trips = upcomingTrips(events, now, 3) as Trip[]
  return trips.find((e) => e.start >= now && e.start < limit) ?? null
}

/** 30 gün içinde köprü fırsatı (1 gün izinle uzayan tatil). */
function bridgeSoon(now: Date, day: Date) {
  const hit = upcomingBridges(now, { months: 1, max: 1 })[0]
  if (!hit || hit.day.getTime() - day.getTime() > 30 * 86_400_000) return null
  return hit
}

function dayKindOf(day: Date, now: Date): InsightDay {
  if (sameDate(day, now)) return "today"
  return sameDate(day, addDays(now, 1)) ? "tomorrow" : "weekday"
}

/** Eylemin ayrıntısı: odak bloğu en uzun boşluğun başından en çok 2 saat. */
function actionOf(
  story: Story,
  facts: InsightFacts,
  extra: { bridge?: Date },
): InsightAction | null {
  if (story.action === "plan") return { kind: "plan" }
  if (story.action === "leave" && extra.bridge) return { kind: "leave", day: extra.bridge }
  if (story.action !== "focus" || !facts.window) return null
  const { start, end } = facts.window
  const cap = start.getTime() + FOCUS_BLOCK_MAX * 60_000
  return { kind: "focus", start, end: new Date(Math.min(end.getTime(), cap)) }
}

/**
 * Günün okuması. `events`: takvim (hazır değilse `null`); `tasks`: To Do'nun bugünkü işleri
 * (yoksa `null`); `rangeStart`–`rangeEnd`: takvim aralığı — kıyas tabanı ve "boş gün" yalnız
 * aralığın kapsadığı günlerden kurulur.
 */
export function dayInsight({
  events,
  now,
  tasks = null,
  rangeStart = null,
  rangeEnd = null,
}: {
  events: CalEvent[] | null | undefined
  now: number
  tasks?: FocusTask[] | null
  rangeStart?: Date | number | null
  rangeEnd?: Date | number | null
}): DayInsight | null {
  if (!events) return null
  const date = new Date(now)
  const range = {
    start: rangeStart == null ? null : new Date(rangeStart),
    end: rangeEnd == null ? null : new Date(rangeEnd),
  }
  const today = workingDay(date) && date < at(startOfDay(date), LOOK_AHEAD_FROM)
  const day = today ? startOfDay(date) : nextWorkingDay(date)
  const build = (d: Date, from: Date | null, useTasks: boolean) =>
    factsOf(events, d, from, { tasks: useTasks ? tasks : null, range })
  const facts = build(day, today ? date : null, today)
  const sources: InsightSource[] = ["calendar"]
  if (facts.tasks) sources.push("todo")
  const result = (story: Story, d: Date, f: InsightFacts, extra: Partial<DayInsight> = {}) => ({
    ...story.params,
    id: story.id,
    tail: story.tail,
    score: story.score,
    day: dayKindOf(d, date),
    date: d,
    facts: f,
    action: actionOf(story, f, { bridge: extra.time }),
    sources,
    ...extra,
  })

  // İzin, bütün öteki nedenleri geçersiz kılar: o gün toplantı yükü konuşulmaz.
  if (facts.away)
    return result(
      { id: facts.meetings ? "awayMeetings" : "away", score: 100, params: { n: facts.meetings } },
      day,
      facts,
    )

  const trip = tripSoon(events, date, today ? addDays(day, 1) : day)
  if (trip) {
    const d = startOfDay(trip.start)
    const city = trip.city?.names
    return result({ id: city ? "tripCity" : "trip", score: 90 }, d, build(d, null, false), {
      city,
      time: trip.start,
    })
  }

  const ctx = { today, now: date, day, f: facts }
  const coversDay = !!range.end && range.end > addDays(day, 1)
  const best = pick(candidates(ctx, coversDay))
  // Takvimden söylenecek güçlü bir şey yoksa yaklaşan köprü (resmî tatil takvimi).
  const bridge = !best || best.score < 30 ? bridgeSoon(date, day) : null
  if (bridge) {
    const story: Story = {
      id: "bridge",
      score: 25,
      action: "leave",
      params: { n: bridge.block.days },
    }
    return result(story, day, facts, {
      holiday: bridge.holiday,
      time: bridge.day,
      sources: [...sources, "holidays"],
    })
  }
  return best ? result(best, day, facts) : null
}
