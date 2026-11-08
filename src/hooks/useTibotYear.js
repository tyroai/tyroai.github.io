import { useCallback, useEffect, useState } from "react"
import { loadYear, onTicketsRefresh, peekYear } from "@/lib/tibot/tibotApi"

/**
 * Bu yılın Ticket sayıları (akışın `year` işlemi: kapattığım, bana atanan, açtığım, açtığımdan
 * kapanan) — Ticket sayfasının yıl kutusuyla aynı bellek (5 dk). Tek Yenile tazeler; hata
 * olursa `retry` yeniden ister. Dönüş: `{ data, failed, retry }`.
 */
export function useTibotYear(year) {
  const [state, setState] = useState({ key: null })
  const [nonce, setNonce] = useState(0)
  const key = `${year}|${nonce}`
  useEffect(
    () =>
      onTicketsRefresh(() => {
        setNonce((n) => n + 1)
        return Promise.resolve()
      }),
    [],
  )
  useEffect(() => {
    let live = true
    loadYear(year)
      .then((data) => live && setState({ key, data }))
      .catch(() => live && setState({ key, failed: true }))
    return () => {
      live = false
    }
  }, [year, key])
  const retry = useCallback(() => setNonce((n) => n + 1), [])
  const mine = state.key === key
  return {
    data: (mine && state.data) || peekYear(year) || null,
    failed: mine && Boolean(state.failed),
    retry,
  }
}
