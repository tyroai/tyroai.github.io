import { freeWindows } from "@/lib/focusWindow"
import { addDays, isWeekend, startOfDay } from "@/lib/leaveDays"
import { WORK_HOURS } from "@/lib/workHours"

/**
 * Haftanın (pazartesi–pazar) toplantı yükü — Toplantı ritmi kartının sayıları: toplam süre,
 * sayı, mesai dışı toplantılar (08:00 öncesi, 17:30 sonrası ya da hafta sonu), en yoğun gün ve
 * boş odak süresi (≥1 saatlik boşluklar). `offset`: 0 bu hafta (odak kalan iş günlerinde), 1
 * gelecek hafta (bütün iş günleri), -1 geçen hafta (odak yok: `null`).
 */
export function weekStats(events, now, offset = 0) {
  const today = new Date(now)
  const midnight = startOfDay(today)
  const monday = addDays(midnight, -((midnight.getDay() + 6) % 7) + offset * 7)
  const sunday = addDays(monday, 7)
  const mine = (events ?? []).filter(
    (e) =>
      !e.owner && !e.isAllDay && e.myResponse !== "declined" && e.start < sunday && e.end > monday,
  )
  const byDay = new Map()
  let minutes = 0
  let afterHours = 0
  for (const e of mine) {
    const m = Math.round((Math.min(e.end, sunday) - Math.max(e.start, monday)) / 60_000)
    minutes += m
    const day = startOfDay(e.start)
    byDay.set(day.getTime(), (byDay.get(day.getTime()) ?? 0) + m)
    const wkend = isWeekend(e.start)
    const endH = e.end.getHours() + e.end.getMinutes() / 60
    const startH = e.start.getHours() + e.start.getMinutes() / 60
    if (wkend || startH < WORK_HOURS.from || endH > WORK_HOURS.to) afterHours += 1
  }
  let busiest = null
  for (const [t, m] of byDay)
    if (!busiest || m > busiest.minutes) busiest = { date: new Date(t), minutes: m }
  if (offset < 0) return { minutes, count: mine.length, afterHours, busiest, focusMinutes: null }
  let focus = 0
  for (let d = new Date(offset > 0 ? monday : today); d < sunday; d.setDate(d.getDate() + 1)) {
    if (isWeekend(d)) continue
    const isToday = d.toDateString() === today.toDateString()
    for (const w of freeWindows(mine, d, isToday ? now : null)) focus += w.minutes
  }
  return { minutes, count: mine.length, afterHours, busiest, focusMinutes: focus }
}
