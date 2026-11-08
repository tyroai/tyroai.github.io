import { isWeekend, meetingsOn, nextWorkday } from "@/lib/brief"
import { freeWindows } from "@/lib/focusWindow"

/** İstemde en çok bu kadar toplantı ve iş: uzun liste istemi boğar, gerisi "+n daha". */
export const PLAN_MAX_MEETINGS = 6
export const PLAN_MAX_TASKS = 5
const WEEK_DAYS = 5

/**
 * "Günü planla" isteminin gerçek gündemi (Karşılama'nın düğmesi): asistan toplantıları ve işleri
 * yeniden çekmek zorunda kalmasın — her araç turu 20–28 sn. `kind`: today (bugünün kalanı) ·
 * tomorrow (sıradaki iş günü) · week (haftaya hazırlan: sıradaki iş gününün toplantıları ve
 * haftanın gün gün toplantı sayısı). Takvim ya da işler henüz okunmadıysa o bölüm `null`: istem
 * "toplantın yok" diye yanlış söylemesin, asistan kendisi baksın.
 */
export function planAgenda(kind, { events, tasks, now, calendarReady = true, tasksReady = true }) {
  const date = new Date(now)
  const day = kind === "today" ? date : nextWorkday(date)
  let meetings = null
  if (calendarReady) {
    const list = kind === "today" ? meetingsOn(events, date, date) : meetingsOn(events, day)
    meetings = {
      list: list.slice(0, PLAN_MAX_MEETINGS),
      more: Math.max(0, list.length - PLAN_MAX_MEETINGS),
      free: kind === "week" ? [] : freeWindows(events, day, kind === "today" ? now : null),
      week: kind === "week" ? weekCounts(events, day) : null,
    }
  }
  let work = null
  if (tasksReady) {
    const open = (tasks ?? []).filter((x) => !x.done)
    const overdue = open.filter((x) => x.overdue).slice(0, PLAN_MAX_TASKS)
    const rest = open.filter((x) => !x.overdue).slice(0, PLAN_MAX_TASKS - overdue.length)
    work = { overdue, rest, more: open.length - overdue.length - rest.length }
  }
  return { day, meetings, work }
}

/** Sıradaki iş gününden başlayarak beş iş gününün toplantı sayısı. */
function weekCounts(events, first) {
  const out = []
  const d = new Date(first)
  while (out.length < WEEK_DAYS) {
    if (!isWeekend(d)) out.push({ date: new Date(d), n: meetingsOn(events, d).length })
    d.setDate(d.getDate() + 1)
  }
  return out
}
