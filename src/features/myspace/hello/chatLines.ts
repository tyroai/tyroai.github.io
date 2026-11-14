import { awayOn, type CalEvent } from "../lib/insight/shape"
import { meetingsLeftToday, type DayEvent } from "../lib/meetingsLeft"

/**
 * Master kartta TYRO'nun satırları için saf seçimler (testli): o anki toplantı ve yaklaşan izin.
 * Metin `insight.chat.*` (dört dil); birleştirme `useHelloChat`ta.
 */

export type MeetingLine<T> =
  { key: "now"; event: T } | { key: "imminent"; event: T } | { key: "soon"; event: T; mins: number }

/** "Birazdan" eşiği ve "yakında" penceresi (dakika). */
const IMMINENT = 5
const SOON = 60

/**
 * O anki toplantı: sürüyorsa o, bir saat içinde başlıyorsa sıradaki; yoksa `null` (günün okuması
 * konuşur). Küme özet balonu ve çekmeceyle aynı (`meetingsLeftToday`).
 */
export function meetingLine<T extends DayEvent>(
  events: readonly T[] | null | undefined,
  now: number,
): MeetingLine<T> | null {
  const left = meetingsLeftToday(events, now)
  const current = left.find((e) => e.start.getTime() <= now)
  if (current) return { key: "now", event: current }
  const next = left[0]
  if (!next) return null
  const mins = Math.ceil((next.start.getTime() - now) / 60_000)
  if (mins <= IMMINENT) return { key: "imminent", event: next }
  if (mins <= SOON) return { key: "soon", event: next, mins }
  return null
}

/** Uzun toplantı adı cümleyi taşırmasın: sözcük sınırında kısalır. */
export function shortTitle(title: string, max = 32): string {
  const s = title.trim().replace(/\s+/g, " ")
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const space = cut.lastIndexOf(" ")
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/u, "")}…`
}

/** İzin ufku: bugünden sonraki 13 gün (bu ve gelecek hafta, takvimin yüklü aralığında). */
const LEAVE_HORIZON = 13

export type LeaveWhen = "tomorrow" | "weekday" | "nextWeek"

/**
 * Yaklaşan izin: bugünden sonraki ilk iş günü ki takviminde günü kaplayan "ofis dışı" kaydı var
 * (`awayOn`, günün okumasının izin hikâyesiyle aynı ölçüt). Bugün zaten izindeysen yok (onu günün
 * okuması söyler). `when`: yarın · bu hafta (gün adı) · gelecek hafta ("Haftaya Salı").
 */
export function leaveAhead(
  events: readonly CalEvent[] | null | undefined,
  now: number,
): { date: Date; days: number; when: LeaveWhen } | null {
  const list = (events ?? []) as CalEvent[]
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  if (!list.length || awayOn(list, today)) return null
  // Haftanın başı pazartesi (iş haftası): "bu hafta" ile "haftaya" ayrımı.
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7))
  for (let i = 1; i <= LEAVE_HORIZON; i += 1) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6 || !awayOn(list, d)) continue
    const when: LeaveWhen = i === 1 ? "tomorrow" : d < nextMonday ? "weekday" : "nextWeek"
    return { date: d, days: i, when }
  }
  return null
}
