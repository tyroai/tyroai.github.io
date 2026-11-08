import { useEffect, useState } from "react"
import { loadTicket, peekTicket } from "@/lib/tibot/tibotApi"

/**
 * Tek talebin ayrıntısı + notlar (akışın `detail` işlemi; 5 dk bellek, aynı anda tek istek). Talep
 * penceresi ve üzerine gelince açılan kart aynı belleği kullanır: kartta görülen talep pencerede
 * anında açılır. Durum: `loading` · `ready` · `notFound` · `error`.
 */
export function useTicket(row) {
  const id = row?.requestId ?? null
  const [state, setState] = useState({ id: null })
  useEffect(() => {
    if (!id) return undefined
    let live = true
    loadTicket(id)
      .then((d) => live && setState({ id, status: "ready", data: d }))
      .catch(
        (err) => live && setState({ id, status: err?.kind === "notFound" ? "notFound" : "error" }),
      )
    return () => {
      live = false
    }
  }, [id])
  const cached = id ? peekTicket(id) : undefined
  if (state.id === id && state.status) return state
  return cached ? { id, status: "ready", data: cached } : { id, status: "loading" }
}
