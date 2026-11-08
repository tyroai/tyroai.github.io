import type { TicketRow } from "./tibotApi"
import { getNumberFormat } from "@/lib/intl-cache"
import { isOverdue, statusKey, type BucketView } from "./tibotModel"

/**
 * Ticket sayfasının özet kutularının ayrıntısı (saf, testli): duruma göre dağılım, hedefi
 * yaklaşanlar, en eski açık talep ve ekipte kimde kaç talep.
 */

const DAY = 24 * 60 * 60 * 1000
const time = (iso?: string | null) => (iso ? Date.parse(iso) || 0 : 0)

export interface Slice {
  key: string
  count: number
}

/** Duruma göre dağılım (`statusKey`: sahipsiz ayrı); en kalabalık önce, eşitte ada göre. */
export function statusMix(items: TicketRow[]): Slice[] {
  const counts = new Map<string, number>()
  for (const row of items) {
    const key = statusKey(row)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

/** Hedefi önümüzdeki `days` gün içinde dolan, henüz geçmemiş talepler. */
export function dueWithin(items: TicketRow[], now: number, days = 7): number {
  const until = now + days * DAY
  return items.filter((row) => {
    if (row.status === "waiting_for_customer") return false
    const at = time(row.nextTargetAt) || time(row.resolutionTargetAt)
    return at >= now && at < until
  }).length
}

/** En eski açık talep ve yaşı (tam gün). */
export function oldest(items: TicketRow[], now: number): { row: TicketRow; days: number } | null {
  let pick: TicketRow | null = null
  for (const row of items) if (!pick || time(row.createdAt) < time(pick.createdAt)) pick = row
  if (!pick || !time(pick.createdAt)) return null
  return { row: pick, days: Math.max(0, Math.floor((now - time(pick.createdAt)) / DAY)) }
}

/**
 * Ekipte kimde kaç açık talep: atanan kişiye göre en kalabalık `limit` kişi, kalanların
 * toplamı (`rest`) ve sahipsizler (kimse üstlenmemiş).
 */
export function byMember(
  items: TicketRow[],
  limit = 4,
): { people: { name: string; count: number }[]; rest: number; unclaimed: number } {
  const counts = new Map<string, number>()
  let unclaimed = 0
  for (const row of items) {
    const name = row.member?.name
    if (!name) unclaimed += 1
    else counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const all = [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"))
  const people = all.slice(0, limit)
  const rest = all.slice(limit).reduce((n, p) => n + p.count, 0)
  return { people, rest, unclaimed }
}

/** Hedefi geçenlerin sayısı. */
export const lateCount = (items: TicketRow[], now: number): number =>
  items.filter((row) => isOverdue(row, now)).length

/**
 * Kovanın gecikmiş payı (0–1): yüklenen taleplerden hedefi geçenler; talep yoksa 0. Kova yarım
 * yüklüyse (Ekibim'de en yeni 50) yüklenenlerden bir tahmindir. Halkanın dolu kısmı ve yanındaki
 * yüzde bu pay ("%87 gecikmiş"); "%13 zamanında" okunmuyordu.
 */
export const lateShare = (v: Pick<BucketView, "overdue" | "items">): number =>
  v.items.length ? v.overdue / v.items.length : 0

/** Gecikmiş payın yüzdesi (`Intl`, ör. "%87"); gecikmiş yoksa `null`, çok küçükse en az %1. */
export function latePct(v: Pick<BucketView, "overdue" | "items">, locale: string): string | null {
  if (!v.overdue || !v.items.length) return null
  return getNumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(
    Math.max(0.01, lateShare(v)),
  )
}
