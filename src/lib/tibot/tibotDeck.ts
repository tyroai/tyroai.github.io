import type { TicketRow } from "./tibotApi"
import { isOverdue } from "./tibotModel"

/**
 * Tibot widget'larının saf hesapları (testli):
 * - `deck`: "Sıra sende" destesi — benden hamle bekleyen talepler (sana atanan açıklar ve
 *   açtığından senden yanıt bekleyenler) aciliyet sırasıyla; 14 günden eski gecikenler destenin
 *   sonunda TEK kart (her gün aynı eski talep başrolde kalmasın);
 * - `runway`: "Pist" — sana atanan talepler hedef gününe göre sütunlarda (geçti · günler · sonra).
 */

const DAY = 24 * 60 * 60 * 1000
const time = (iso?: string | null) => (iso ? Date.parse(iso) || 0 : 0)
const targetAt = (row: TicketRow) => time(row.nextTargetAt) || time(row.resolutionTargetAt)
const startOfDay = (now: number) => {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Bu kadar günden eski gecikenler destenin sonunda tek kart olur. */
export const STALE_DAYS = 14

export type CardKind = "reply" | "late" | "due" | "open"
export interface DeckCard {
  row: TicketRow
  kind: CardKind
  /** Hedef zamanı (late · due), yoksa 0. */
  at: number
  /** "mine": açtığım (senden yanıt bekleniyor), "assigned": bana atanan. */
  bucket: "mine" | "assigned"
}

export function deck(
  onMe: TicketRow[],
  needsMe: TicketRow[],
  now: number,
): { cards: DeckCard[]; stale: TicketRow[] } {
  const staleFrom = now - STALE_DAYS * DAY
  const reply: DeckCard[] = needsMe.map((row) => ({ row, kind: "reply", at: 0, bucket: "mine" }))
  const late: DeckCard[] = []
  const due: DeckCard[] = []
  const open: DeckCard[] = []
  const stale: TicketRow[] = []
  for (const row of onMe) {
    const at = targetAt(row)
    if (isOverdue(row, now)) {
      if (at < staleFrom) stale.push(row)
      else late.push({ row, kind: "late", at, bucket: "assigned" })
    } else if (at) due.push({ row, kind: "due", at, bucket: "assigned" })
    else open.push({ row, kind: "open", at: 0, bucket: "assigned" })
  }
  const byAt = (a: DeckCard, b: DeckCard) => a.at - b.at
  const byUpdated = (a: DeckCard, b: DeckCard) => time(b.row.updatedAt) - time(a.row.updatedAt)
  stale.sort((a, b) => targetAt(a) - targetAt(b))
  return {
    cards: [
      ...reply.sort(byUpdated),
      ...late.sort(byAt),
      ...due.sort(byAt),
      ...open.sort(byUpdated),
    ],
    stale,
  }
}

/** Kartın zaman ifadesi için: gecikme ya da kalan tam gün (takvim günü), saat bugünse. */
export function dayDelta(at: number, now: number): number {
  return Math.round((startOfDay(at) - startOfDay(now)) / DAY)
}

export interface RunwayColumn {
  /** "late" · "day" (o gün, `offset` 0 = bugün) · "week" (2–6 gün, dar kart) · "later". */
  key: "late" | "day" | "week" | "later"
  offset: number
  items: TicketRow[]
}

/**
 * Pistin sütunları. `days`: bugünden itibaren kaç gün tek tek (geniş kart 7, dar kart 2 ve
 * ardından "hafta" sütunu). Hedefsizler ("best_effort" vb.) "sonra"da.
 */
export function runway(onMe: TicketRow[], now: number, days: number, week = false): RunwayColumn[] {
  const today = startOfDay(now)
  const cols: RunwayColumn[] = [{ key: "late", offset: -1, items: [] }]
  for (let i = 0; i < days; i += 1) cols.push({ key: "day", offset: i, items: [] })
  const weekCol: RunwayColumn | null = week ? { key: "week", offset: days, items: [] } : null
  if (weekCol) cols.push(weekCol)
  const later: RunwayColumn = { key: "later", offset: 7, items: [] }
  cols.push(later)
  for (const row of onMe) {
    const at = targetAt(row)
    if (isOverdue(row, now)) {
      cols[0].items.push(row)
      continue
    }
    if (!at || row.status === "waiting_for_customer") {
      later.items.push(row)
      continue
    }
    const offset = Math.floor((startOfDay(at) - today) / DAY)
    if (offset < days) cols[1 + Math.max(0, offset)].items.push(row)
    else if (weekCol && offset < 7) weekCol.items.push(row)
    else later.items.push(row)
  }
  for (const c of cols)
    c.items.sort((a, b) => (targetAt(a) || Infinity) - (targetAt(b) || Infinity))
  return cols
}
