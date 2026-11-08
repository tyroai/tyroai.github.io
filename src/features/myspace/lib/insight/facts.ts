import {
  at,
  awayOn,
  baselineOf,
  dayLoad,
  freeWindows,
  longest,
  longestStreak,
  meetingsOn,
  PIECE_MIN,
  weekLoad,
  type Baseline,
  type CalEvent,
  type FocusTask,
  type Span,
  type WeekLoad,
  type Window,
} from "./shape"

/**
 * Bakılan günün dayanakları — hem hikâye seçimi hem ipucu kartı (şerit + satırlar) bundan
 * okur. Yük bütün günün (kıyas bütün günlerle); boşluklar bugün için şimdiden sonrası
 * (geçmiş saate odak bloğu önerilmez).
 */
export interface InsightFacts {
  /** Bütün günün toplantı sayısı ve mesaideki meşgul dakikası. */
  meetings: number
  minutes: number
  first: Date | null
  last: Date | null
  /** Mesaideki meşgul aralıklar, birleşik (şerit). */
  blocks: Span[]
  /** ≥ 30 dk boşluklar (`from`dan sonra), toplamı ve parça sayısı. */
  windows: Window[]
  free: number
  pieces: number
  /** En uzun ≥ 60 dk boşluk: odak bloğu bunun içine. */
  window: Window | null
  /** Bugün: şimdi (şeritte çizgi); sonraki gün: `null`. */
  from: Date | null
  /** Şimdiden sonraki toplantılar: sayı, ilki, öğleden önce/sonra başlayanlar. */
  upcoming: number
  firstUpcoming: Date | null
  morning: number
  afternoon: number
  streak: ReturnType<typeof longestStreak>
  baseline: Baseline | null
  week: WeekLoad
  /** Bugünün To Do işleri (yalnız bugün ve To Do bağlıyken). */
  tasks: { open: number; overdue: number } | null
  away: boolean
}

export function factsOf(
  events: CalEvent[],
  day: Date,
  from: Date | null,
  { tasks, range }: { tasks: FocusTask[] | null; range: { start: Date | null; end: Date | null } },
): InsightFacts {
  const all = meetingsOn(events, day)
  const ahead = from ? meetingsOn(events, day, from) : all
  const load = dayLoad(events, day)
  const windows = freeWindows(events, day, from ? from.getTime() : null, { min: PIECE_MIN })
  const big = longest(windows.filter((w) => w.minutes >= 60))
  const noon = at(day, 12)
  const open = tasks?.filter((x) => !x.done) ?? null
  return {
    meetings: all.length,
    minutes: load.minutes,
    first: all[0]?.start ?? null,
    last: all.length ? all[all.length - 1].end : null,
    blocks: load.blocks,
    windows,
    free: windows.reduce((s, w) => s + w.minutes, 0),
    pieces: windows.length,
    window: big,
    from,
    upcoming: ahead.length,
    firstUpcoming: ahead[0]?.start ?? null,
    morning: ahead.filter((m) => m.start < noon).length,
    afternoon: ahead.filter((m) => m.start >= noon).length,
    streak: longestStreak(ahead),
    baseline: baselineOf(events, day, load.minutes, range),
    week: weekLoad(events, day, range),
    tasks: open ? { open: open.length, overdue: open.filter((x) => x.overdue).length } : null,
    away: awayOn(events, day),
  }
}
