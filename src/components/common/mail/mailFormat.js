import { startOfDay } from "@/lib/leaveDays"
import { getDateTimeFormat } from "@/lib/intl-cache"

// 24-hour throughout, same reasoning as the calendar rows.
const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
const OPTS_DATE_SHORT = { day: "numeric", month: "short" }
export const OPTS_DAY_LONG = { weekday: "long", day: "numeric", month: "long" }
export const OPTS_FULL_STAMP = {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}

export { startOfDay }

/** Messages in received order, split into day sections. */
export function groupByDay(messages) {
  const out = []
  for (const m of messages) {
    const key = m.received ? startOfDay(m.received).getTime() : 0
    const last = out[out.length - 1]
    if (last && last.key === key) last.items.push(m)
    else out.push({ key, day: m.received ? startOfDay(m.received) : null, items: [m] })
  }
  return out
}

/** Today → clock, otherwise a short date. Avoids src/lib/date.js's
 *  formatRelative, whose tables only cover tr/en and fall back to Turkish
 *  for ru/ar. */
export function stamp(date, locale) {
  if (!date) return ""
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  return getDateTimeFormat(locale, sameDay ? OPTS_TIME : OPTS_DATE_SHORT).format(date)
}
