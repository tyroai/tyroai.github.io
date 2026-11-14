import { upcomingHolidays } from "@/lib/leaveDays"

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

/**
 * TYRO'nun seçimi ve rafın önerileri için sayfadaki gerçek sayılar (takvim, posta, görev, resmî
 * tatil). `ctx`: Anasayfa'nın verisi (`cal`, `mail`, `focus`, `now`). Saf: aynı girdi aynı çıktı.
 */
export function signalsOf(ctx) {
  const { cal, mail, focus, now } = ctx
  const today = new Date(now)
  const next = upcomingHolidays(today)[0]
  return {
    holiday: next ? { key: next.key, inDays: next.inDays } : null,
    meetingsToday: (cal?.events ?? []).filter((e) => e?.start && sameDay(new Date(e.start), today))
      .length,
    unreadMail: Number(mail?.unread) || 0,
    openTasks: (focus?.tasks ?? []).filter((x) => !x.done).length,
  }
}
