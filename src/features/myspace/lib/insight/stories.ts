import { at, longest, PIECE_MIN, type Window } from "./shape"
import type { InsightFacts } from "./facts"

/**
 * Günün okumasının hikâyeleri: her biri bir NEDEN (yük, bölünme, kıyas, iş, izin…) ve bir
 * puan. Tutan adaylar puana göre sıralanır, en yüksek kazanır (eşitlikte listedeki sıra) —
 * "ilk tutan kural" yerine en çok açıklayan neden. Puanlar sabit ve testli (deterministik).
 */

export interface Story {
  id: string
  score: number
  /** İkinci cümle (öneri), sözlükte `insight.then.<tail>`. */
  tail?: string
  params?: Partial<StoryParams>
  /** Kartın dibindeki eylem: odak bloğu, gün planı (TYRO) ya da izin formu. */
  action?: "focus" | "plan" | "leave"
}

export interface StoryParams {
  n: number
  /** Ortalamanın kaç katı (bir ondalık). */
  x: number
  minutes: number
  free: number
  start: Date
  end: Date
  time: Date
  /** Kıyas günü (haftanın en yoğunu) ve yükü. */
  other: Date
  otherMinutes: number
  /** Bugünün açık işleri (yük cümlesinin işler kuyruğu). */
  tasks: number
}

export interface StoryCtx {
  today: boolean
  now: Date
  day: Date
  f: InsightFacts
}

/** Yük eşikleri (dk): yoğun gün ve kıyas için "ağır" gün. */
export const HEAVY_MIN = 180
export const PEAK_OTHER_MIN = 240
/** Bir iş için kabaca gereken süre (dk): boş zaman işlere yetiyor mu. */
export const TASK_MIN = 45
/** Ortalamanın bu katı ve üstü "aşırı yük". */
export const OVERLOAD_RATIO = 1.5

const round1 = (x: number) => Math.round(x * 10) / 10

/** Bugünün işleri boş zamana sığmıyor mu (işi başına ~45 dk). */
const tasksSqueezed = ({ f, today }: StoryCtx) =>
  today && !!f.tasks && f.tasks.open >= 2 && f.free < f.tasks.open * TASK_MIN

/**
 * Yük hikâyesinin ikinci cümlesi: işler sığmıyorsa onları kaydırmak (sonuç işlere dokunuyor),
 * yoksa tek / en uzun pencere ya da hiç pencere yok.
 */
function windowTail(ctx: StoryCtx): Pick<Story, "tail" | "params" | "action"> {
  const { f } = ctx
  if (tasksSqueezed(ctx))
    return { tail: "tasksMove", params: { tasks: f.tasks?.open }, action: "plan" }
  const big = f.windows.filter((w) => w.minutes >= 60)
  if (!f.window) return { tail: "noWindow" }
  const params = { start: f.window.start, end: f.window.end }
  return { tail: big.length === 1 ? "onlyWindow" : "window", params, action: "focus" }
}

function overload(ctx: StoryCtx): Story | null {
  const { f } = ctx
  if (f.meetings < 2 || f.minutes < HEAVY_MIN) return null
  const ratio = f.baseline?.ratio ?? null
  const high = ratio != null && ratio >= OVERLOAD_RATIO
  if (!f.week.peak && !high) return null
  const id = f.week.peak && high ? "overloadBoth" : f.week.peak ? "overloadWeek" : "overloadAvg"
  const tail = windowTail(ctx)
  const score = 60 + (high ? Math.min(20, (ratio - 1) * 20) : 0) + (f.week.peak ? 10 : 0)
  return {
    id,
    score,
    ...tail,
    params: { n: f.meetings, minutes: f.minutes, x: ratio ? round1(ratio) : 0, ...tail.params },
  }
}

function fragmented({ f }: StoryCtx): Story | null {
  const best = longest(f.windows)
  if (!best || f.free < 180 || f.pieces < 3 || best.minutes >= 120) return null
  return {
    id: "fragmented",
    score: 55 + Math.min(10, f.pieces * 2),
    params: { free: f.free, n: f.pieces, start: best.start, end: best.end },
    action: best.minutes >= 60 ? "focus" : undefined,
  }
}

/** Sakin gün, ağır bir gün yaklaşırken: zor işi öne çekmenin nedeni. */
function contrast({ f, day }: StoryCtx): Story | null {
  const peak = f.week.busiest
  if (!peak || peak.date <= day || peak.minutes < PEAK_OTHER_MIN) return null
  const calm = Math.max(90, (f.baseline?.avg ?? 0) * 0.6)
  if (f.minutes > calm || peak.minutes < 2 * f.minutes) return null
  return {
    id: f.meetings ? "contrast" : "contrastClear",
    score: 52,
    params: { minutes: f.minutes, other: peak.date, otherMinutes: peak.minutes },
    action: f.window ? "focus" : undefined,
  }
}

/** Bugünün işleri, boş zamana sığmıyor ya da takvim boşken bekliyor. */
function taskStories(ctx: StoryCtx): Story[] {
  const { f, today } = ctx
  if (!today || !f.tasks) return []
  const { open } = f.tasks
  const out: Story[] = []
  if (tasksSqueezed(ctx))
    out.push({
      id: f.free >= PIECE_MIN ? "tasksTight" : "tasksTightNone",
      score: 72,
      params: { n: open, free: f.free },
      action: "plan",
    })
  if (open >= 3 && f.upcoming === 0)
    out.push({ id: "tasksClear", score: 58, params: { n: open }, action: "plan" })
  if (open >= 2 && f.window && f.meetings > 0)
    out.push({
      id: "tasksWindow",
      score: 45,
      params: { n: open, start: f.window.start, end: f.window.end },
      action: "focus",
    })
  return out
}

function streak({ f, today, now }: StoryCtx): Story | null {
  const s = f.streak
  if (!s || (today && s.end <= now)) return null
  return {
    id: today ? "streak" : "nextStreak",
    score: Math.min(70, 55 + 5 * (s.n - 3)),
    params: { n: s.n, start: s.start, time: today ? s.end : s.start },
  }
}

function packed({ f, today, now, day }: StoryCtx): Story | null {
  const enough = today ? f.upcoming >= 2 && now < at(day, 16) : f.meetings >= 3
  if (!enough || f.window) return null
  return { id: "packed", score: 66, params: { n: today ? f.upcoming : f.meetings } }
}

/** Sabah dolu (13:00'e dek ≥ 90 dk ya da ≥ 2 toplantı), öğleden sonra ≥ 2,5 saat boşluk. */
function heavyMorning({ f, today, now, day }: StoryCtx): Story | null {
  if (today && now >= at(day, 12)) return null
  const noon = at(day, 13).getTime()
  const from = f.from ? f.from.getTime() : 0
  const morning = f.blocks.filter((b) => b.start.getTime() < noon && b.end.getTime() > from)
  const busy = morning.reduce(
    (s, b) => s + (Math.min(b.end.getTime(), noon) - Math.max(b.start.getTime(), from)) / 60_000,
    0,
  )
  if (busy < 90 && morning.length < 2) return null
  const midday = at(day, 12).getTime()
  const free = f.windows.find(
    (w: Window) => w.end.getTime() - Math.max(w.start.getTime(), midday) >= 150 * 60_000,
  )
  if (!free) return null
  return {
    id: today ? "heavyMorning" : "nextHeavyMorning",
    score: 48,
    params: { start: free.start, end: free.end },
    action: "focus",
  }
}

/** Takvimin şekli: sakin sabah, geç başlangıç, bitmiş gün, boş gün, en uzun boşluk… */
function calmStories({ f, today, now, day }: StoryCtx, rangeCovers: boolean): Story[] {
  const out: Story[] = []
  const first = f.firstUpcoming
  if (today) {
    if (now < at(day, 12) && first && first >= at(day, 12) && f.afternoon >= 2)
      out.push({ id: "freeMorning", score: 46, params: { time: first }, action: "focus" })
    if (first && first.getTime() - now.getTime() >= 150 * 60_000)
      out.push({
        id: "lateStart",
        score: 44,
        params: { time: first, n: Math.floor((first.getTime() - now.getTime()) / 3_600_000) },
        action: "focus",
      })
    if (f.meetings > 0 && f.upcoming === 0) out.push({ id: "doneEarly", score: 42 })
    if (!f.meetings) out.push({ id: "clear", score: 40, action: f.window ? "focus" : undefined })
  } else {
    if (first && first < at(day, 9) && first >= at(day, 6))
      out.push({ id: "nextEarly", score: 52, params: { time: first } })
    if (!f.meetings && rangeCovers) out.push({ id: "nextClear", score: 40, action: "focus" })
  }
  if (f.meetings && f.window && f.window.minutes >= 90)
    out.push({
      id: today ? "window" : "nextWindow",
      score: 30,
      params: { start: f.window.start, end: f.window.end },
      action: "focus",
    })
  const spread = f.morning > 0 && f.afternoon > 0 && today
  if (spread) out.push({ id: "spread", score: 20 })
  return out
}

/** Bütün adaylar; `pick` en yükseğini seçer. */
export function candidates(ctx: StoryCtx, rangeCovers: boolean): Story[] {
  const list = [
    overload(ctx),
    ...taskStories(ctx),
    packed(ctx),
    streak(ctx),
    fragmented(ctx),
    contrast(ctx),
    heavyMorning(ctx),
    ...calmStories(ctx, rangeCovers),
  ]
  return list.filter((s): s is Story => !!s)
}

/** En yüksek puan; eşitlikte listedeki ilk (kararlı sıralama). */
export function pick(list: Story[]): Story | null {
  return list.reduce<Story | null>((a, b) => (!a || b.score > a.score ? b : a), null)
}
