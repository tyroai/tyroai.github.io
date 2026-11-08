/** Takvim okumasının bu hesaba yeten alanları (`useBoardCalendar` › `cal.events`). */
export interface DayEvent {
  owner?: unknown
  isAllDay?: boolean
  myResponse?: string | null
  start: Date
  end: Date
}

/**
 * Bugün BİTMEMİŞ toplantılar — kendi takvimin (paylaşılan takvimin kaydı değil), reddedilmemiş,
 * tüm gün değil; başlangıca göre sıralı. Özet balonu ve karşılama çekmecesi aynı kümeyi sayar.
 */
export function meetingsLeftToday<T extends DayEvent>(
  events: readonly T[] | null | undefined,
  now: number | Date,
): T[] {
  // Zaman damgası da tarih de kabul: dakika saati (`useMinuteNow`) damga verir.
  const at = typeof now === "number" ? now : now.getTime()
  const end = new Date(at)
  end.setHours(23, 59, 59, 999)
  return (events ?? [])
    .filter(
      (e) =>
        !e.owner &&
        !e.isAllDay &&
        e.myResponse !== "declined" &&
        e.end.getTime() > at &&
        e.start.getTime() <= end.getTime(),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}
