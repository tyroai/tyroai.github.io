/**
 * Karşılama kapsülünün ilk katmanı (saf, testli): yakın toplantı ve günün ritmi. Kapsül her zaman
 * TYRO'nun yapabileceği bir iştir (ürün sahibi: "8-10 arası bugün seni neler bekliyor, akşam 5'ten
 * sonra günün özeti, geri kalan saatler mevcuttaki gibi"). Sıra: 30 dk içindeki toplantıya hazırlık
 * › sabah (pazartesi hafta) › akşam (cuma hafta, sonra yarına hazırlık) › yoksa `null` (günün okuması
 * ve brifing). Bugün yapılan öneri (`done`) tekrar gelmez; sıradakine geçilir.
 */

export type RhythmKey = "prep" | "morning" | "week" | "dayWrap" | "weekWrap" | "tomorrow"

export interface RhythmOffer {
  key: RhythmKey
  /** "Bugün yapıldı" işaretinin adı (toplantı hazırlığı toplantı başına). */
  doneKey: string
}

export interface RhythmSignals {
  now: Date
  weekend: boolean
  /** Sıradaki toplantı (`meetingLine`): `soon` ise kaç dakika kaldığı. */
  meeting: {
    key: "now" | "imminent" | "soon"
    event: { id?: string; start: Date }
    mins?: number
  } | null
  /** Yarının ilk toplantısı. */
  tomorrowFirst: Date | null
  /** Bugün yapılan önerilerin adları. */
  done: ReadonlySet<string>
}

/** Toplantıya hazırlık en çok bu kadar dakika önce önerilir. */
export const PREP_MINS = 30
const MORNING = [6 * 60, 10 * 60 + 30] as const
const EVENING = 17 * 60
const FRIDAY_WRAP = 15 * 60
/** Yarının ilk toplantısı bu saatten önceyse "erken" (durum seçiciyle aynı). */
export const EARLY_START = 9 * 60 + 30

const minsOf = (d: Date) => d.getHours() * 60 + d.getMinutes()

export function rhythmOffer(s: RhythmSignals): RhythmOffer | null {
  const offer = (key: RhythmKey, doneKey: string = key): RhythmOffer | null =>
    s.done.has(doneKey) ? null : { key, doneKey }

  const m = s.meeting
  if (m && (m.key === "imminent" || (m.key === "soon" && (m.mins ?? Infinity) <= PREP_MINS))) {
    const prep = offer("prep", `prep:${m.event.id ?? m.event.start.getTime()}`)
    if (prep) return prep
  }
  if (s.weekend) return null

  const mins = minsOf(s.now)
  const weekday = s.now.getDay()
  if (mins >= MORNING[0] && mins < MORNING[1]) return offer(weekday === 1 ? "week" : "morning")

  const friday = weekday === 5 && mins >= FRIDAY_WRAP
  if (friday || mins >= EVENING) {
    const wrap = offer(friday ? "weekWrap" : "dayWrap")
    if (wrap) return wrap
    const early = s.tomorrowFirst && minsOf(s.tomorrowFirst) <= EARLY_START
    if (early && mins >= EVENING) return offer("tomorrow")
  }
  return null
}
