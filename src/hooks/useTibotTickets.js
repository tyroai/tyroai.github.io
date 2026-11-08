import { useCallback, useEffect, useRef, useState } from "react"
import {
  loadMorePage,
  loadTickets,
  onTicketsRefresh,
  peekTickets,
  refreshTickets,
  ticketsFresh,
} from "@/lib/tibot/tibotApi"

const stateOf = (data) => (data ? { status: "ready", data, at: Date.now() } : { status: "loading" })

/**
 * Ticket Talepler listesi (widget ve Self Servis sekmesi aynı belleği paylaşır): açılışta bir kez,
 * taze ise (5 dk) bellekten; ortak "Yenile" (`refreshTickets` — Self Servis'in özet kartındaki
 * düğme) ekrandaki bütün listeleri tazeler. Arka planda yoklama yok.
 * Durum: `loading` · `ready` · `denied` (izin/oturum) · `error`.
 *
 * Çok talebi olan için parça parça: ilk sayfa 50, `loadMore(view)` yalnız kişi isteyince o kovanın
 * sonraki 50'sini ister (aynı anda tek istek; kova başına en çok 500 — `tibotModel.MAX_ITEMS`).
 * Ek sayfalar `pages`te; "Yenile" ilk sayfadan başlar.
 *
 * @param {boolean} enabled kitlede değilse hiç sormaz.
 */
export function useTibotTickets(enabled = true) {
  const [state, setState] = useState(() => stateOf(peekTickets()))
  const [busy, setBusy] = useState(false)
  const [pages, setPages] = useState({})
  const [more, setMore] = useState({ busy: false, failed: false })
  // Aynı anda tek "Daha fazla": çift tıklama iki sayfa istemesin.
  const inFlight = useRef(false)

  const run = useCallback(async (force) => {
    setBusy(true)
    try {
      const data = await loadTickets({ force })
      setState({ status: "ready", data, at: Date.now() })
      if (force) setPages({})
    } catch (err) {
      setState((prev) =>
        // Yenileme düşerse elde olan liste kalır; ilk okuma düşerse hata görünür.
        prev.status === "ready" ? prev : { status: err?.kind === "denied" ? "denied" : "error" },
      )
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled || ticketsFresh()) return
    run(false)
  }, [enabled, run])

  // Ortak "Yenile" (Self Servis özet kartı ya da öteki liste) bu listeyi de tazeler.
  useEffect(() => {
    if (!enabled) return undefined
    return onTicketsRefresh(() => run(true))
  }, [enabled, run])

  const refresh = refreshTickets

  /** Kovanın sonraki sayfaları (açtıklarımda iki kaynak, sırayla). */
  const loadMore = useCallback(async (view) => {
    if (inFlight.current || !view?.more?.length) return
    inFlight.current = true
    setMore({ busy: true, failed: false })
    try {
      for (const { key, after } of view.more) {
        const page = await loadMorePage(key, after)
        setPages((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), page] }))
      }
      setMore({ busy: false, failed: false })
    } catch {
      setMore({ busy: false, failed: true })
    } finally {
      inFlight.current = false
    }
  }, [])

  return { ...state, busy, refresh, pages, loadMore, more }
}
