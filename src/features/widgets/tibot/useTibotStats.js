import { useMemo } from "react"
import { useTibotTickets } from "@/hooks/useTibotTickets"
import { STATUS } from "@/lib/graph"
import { tibotStats } from "@/lib/tibot/tibotStats"

/**
 * Ticket widget'larının ortak verisi: liste (`useTibotTickets` — açılışta bir kez, 5 dk bellek,
 * ortak Yenile) ve ondan özet sayılar (`tibotStats`). `bodyStatus`: `WidgetBody`'nin sözlüğü.
 */
export function useTibotStats() {
  const tickets = useTibotTickets(true)
  const stats = useMemo(() => tibotStats(tickets.data), [tickets.data])
  const bodyStatus =
    tickets.status === "ready"
      ? STATUS.ready
      : tickets.status === "denied"
        ? STATUS.denied
        : tickets.status
  return { ...tickets, stats, bodyStatus }
}
