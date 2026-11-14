import { addDays, isWeekend, startOfDay } from "@/lib/leaveDays"

/**
 * TYRO brifingi — saf hesap (`features/widgets/BriefWidget`).
 *
 * Kart bir LİSTE değil, bir EYLEM PANELİ: her madde bir sayım ve tek bir
 * eylem; sıra önceliğe göre (yanıt bekleyen insanlar önce, bilgi en son).
 * Hafta sonunda bugünün yerine bir sonraki iş gününe hazırlık anlatılır.
 */

export { isWeekend }

/** Bir sonraki iş gününün başlangıcı (yerel gece yarısı). */
export function nextWorkday(date) {
  let d = addDays(startOfDay(date), 1)
  while (isWeekend(d)) d = addDays(d, 1)
  return d
}

/** Günün bölümü: sabah (<12) · öğleden sonra (<18) · akşam. */
export function dayPart(date) {
  const h = date.getHours()
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"
}

/** Bir günün (yerel) toplantıları: kendi takvimin, reddedilmemiş, tüm gün değil. */
export function meetingsOn(events, day, from = null) {
  const start = startOfDay(day)
  const end = addDays(start, 1)
  return (events ?? [])
    .filter(
      (e) =>
        !e.owner &&
        !e.isAllDay &&
        e.myResponse !== "declined" &&
        e.start < end &&
        e.end > (from && from > start ? from : start),
    )
    .sort((a, b) => a.start - b.start)
}

/**
 * Brifingin maddeleri, öncelik sırasıyla. Her madde: `{ id, n, ...ek }`.
 * Sıfır sayılı madde DÖNMEZ — "0 davet" bir şey anlatmaz.
 */
export function briefItems({
  invites = 0,
  unread = 0,
  important = 0,
  overdue = 0,
  open = 0,
  feed = 0,
  tibot = 0,
  tibotLate = 0,
  tibotWaiting = 0,
}) {
  const items = []
  if (invites) items.push({ id: "invites", n: invites })
  if (unread) items.push({ id: "mail", n: unread, important })
  if (overdue) items.push({ id: "overdue", n: overdue })
  // Ticket (yalnız kitlede; sayılar listenin son okumasından): bende bekleyen, sonra beklediğim.
  if (tibot) items.push({ id: "tibot", n: tibot, late: tibotLate })
  if (open) items.push({ id: "tasks", n: open })
  if (tibotWaiting) items.push({ id: "tibotWaiting", n: tibotWaiting })
  if (feed) items.push({ id: "feed", n: feed })
  return items
}

/** Son ziyaretten sonra gelen posta sayısı (`since`: önceki ziyaretin anı). */
export function newSince(messages, since) {
  if (!since) return 0
  return (messages ?? []).filter((m) => m.received && m.received > since).length
}
