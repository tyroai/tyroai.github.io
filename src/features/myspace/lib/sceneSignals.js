import { upcomingTrips } from "@/lib/travel"

const minutes = (d) => d.getHours() * 60 + d.getMinutes()

/**
 * Sahne kuralları için bugünün takvimi (`lib/scenes` › `SceneSignals`): kendi takvimindeki,
 * reddedilmemiş, tüm gün olmayan toplantıların ilki ve sonuncusunun bitişi (gece yarısından
 * dakika), ve bugüne değen bir yolculuk var mı. Saf: aynı girdi aynı çıktı.
 */
export function sceneSignals(events, now) {
  const today = new Date(now)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(start.getTime() + 86_400_000)
  const meetings = (events ?? []).filter(
    (e) =>
      e?.start &&
      e?.end &&
      !e.owner &&
      !e.isAllDay &&
      e.myResponse !== "declined" &&
      new Date(e.start) >= start &&
      new Date(e.start) < end,
  )
  const first = meetings.reduce((a, e) => Math.min(a, minutes(new Date(e.start))), Infinity)
  const last = meetings.reduce((a, e) => {
    const done = new Date(e.end)
    // Gece yarısını aşan toplantı günün sonunda biter sayılır.
    return Math.max(a, done >= end ? 24 * 60 : minutes(done))
  }, -Infinity)
  return {
    firstMeeting: Number.isFinite(first) ? first : null,
    lastMeetingEnd: Number.isFinite(last) ? last : null,
    trip: upcomingTrips(events, start, 1).some((e) => new Date(e.end) > start),
  }
}
