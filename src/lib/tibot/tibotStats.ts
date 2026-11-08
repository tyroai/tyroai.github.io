import type { TicketList, TicketRow } from "./tibotApi"
import { buckets, isOverdue, statusKey } from "./tibotModel"

/**
 * Ticket widget'larının özet sayıları (saf, testli) — listenin TEK okumasından:
 * - `onMe`: bende bekleyen (bana atanan açık), gecikenler önce;
 * - `waiting`: beklediğim (açtığım ya da adıma açılan açık); `needsMe` aralarından benden yanıt
 *   bekleyenler;
 * - `unclaimed`: ekibimde üstlenilmeyi bekleyen (atanan kişisi yok);
 * - `week`: bu haftanın (Pazartesi–Pazar) günlerine göre açılan talepler, `lastWeek` geçen
 *   haftanın toplamı. Listeler en yeni güncellenen 50'den: hafta sayısı yaklaşık, kaçanı yok
 *   sayılacak kadar az (yeni talep en yeni güncellenenler arasındadır).
 */
export interface TibotStats {
  onMe: { count: number; late: number; items: TicketRow[] }
  waiting: { count: number; needsMe: number; items: TicketRow[] }
  unclaimed: { count: number; items: TicketRow[] }
  /** Bu hafta açılanlar (gün gün, 0 = Pazartesi) ve toplam. */
  week: { days: TicketRow[][]; total: number; today: number; busiest: number | null }
  lastWeek: number
}

const DAY = 24 * 60 * 60 * 1000

/** Haftanın başı (Pazartesi 00:00, yerel). */
export function weekStart(now: number): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7 // 0 = Pazartesi
  return d.getTime() - dow * DAY
}

const lateFirst = (now: number) => (a: TicketRow, b: TicketRow) =>
  Number(isOverdue(b, now)) - Number(isOverdue(a, now))

export function tibotStats(
  list: TicketList | null | undefined,
  now: number = Date.now(),
): TibotStats {
  const views = Object.fromEntries(buckets(list, now).map((v) => [v.id, v]))
  const assigned = views.assigned
  const mine = views.mine
  const team = views.team

  const onMeItems = [...assigned.items].sort(lateFirst(now))
  const needsMe = mine.items.filter((r) => r.status === "waiting_for_customer")
  const waitingItems = [
    ...needsMe,
    ...mine.items.filter((r) => r.status !== "waiting_for_customer"),
  ]
  const unclaimed = team.items.filter((r) => statusKey(r) === "unclaimed").sort(lateFirst(now))

  // Haftalık ritim: üç kovanın birleşimi (aynı talep bir kez).
  const { week, lastWeek } = weekOf([assigned.items, team.items, mine.items], now)

  return {
    onMe: { count: assigned.count, late: assigned.overdue, items: onMeItems },
    waiting: { count: mine.count, needsMe: needsMe.length, items: waitingItems },
    unclaimed: { count: unclaimed.length, items: unclaimed },
    week,
    lastWeek,
  }
}

/**
 * Bu haftanın (Pazartesi–Pazar) günlerine göre açılan talepler ve geçen haftanın toplamı — verilen
 * listelerin birleşiminden (aynı talep bir kez). Tempo kartı kapsama göre çağırır (Ben: atanan +
 * açtığım, Ekip: ekiplerim).
 */
export function weekOf(
  lists: TicketRow[][],
  now: number = Date.now(),
): { week: TibotStats["week"]; lastWeek: number } {
  const all = new Map<string, TicketRow>()
  for (const list of lists) for (const r of list) all.set(r.requestId, r)
  const start = weekStart(now)
  const prev = start - 7 * DAY
  const days: TicketRow[][] = Array.from({ length: 7 }, () => [])
  let lastWeek = 0
  for (const r of all.values()) {
    const at = Date.parse(r.createdAt)
    if (Number.isNaN(at)) continue
    if (at >= start && at < start + 7 * DAY) days[Math.floor((at - start) / DAY)].push(r)
    else if (at >= prev && at < start) lastWeek += 1
  }
  const counts = days.map((d) => d.length)
  const total = counts.reduce((a, b) => a + b, 0)
  const max = Math.max(...counts)
  return {
    week: {
      days,
      total,
      today: Math.min(6, Math.floor((now - start) / DAY)),
      busiest: total ? counts.indexOf(max) : null,
    },
    lastWeek,
  }
}
