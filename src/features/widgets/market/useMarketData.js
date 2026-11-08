import { useCallback, useEffect, useState } from "react"
import { fetchMarket, peekMarket } from "@/features/widgets/lib/market"

// Dakikada bir yoklanır; ağa çıkıp çıkmamaya `fetchMarket`in önbellek süresi karar verir (taze
// veride 5 dk, güncellenemeyen veride 1 dk).
const TICK_MS = 60_000

/**
 * Piyasa verisi (`features/widgets/lib/market.js`): ilk boyamada son bilinen veri (varsa) hemen görünür; sekme
 * görünürken ve sekmeye dönünce tazelenir. `refresh` önbelleği atlar.
 */
export function useMarketData() {
  const [state, setState] = useState(() => {
    const data = peekMarket()
    return data
      ? { status: "ready", data, refreshing: true }
      : { status: "loading", data: null, refreshing: false }
  })

  // Aynı veri (önbellekten) gelince yeniden çizilmez.
  const apply = useCallback(
    (data) =>
      setState((s) =>
        s.data === data && !s.refreshing
          ? s
          : { status: data ? "ready" : "error", data, refreshing: false },
      ),
    [],
  )

  useEffect(() => {
    const tick = () => !document.hidden && fetchMarket().then(apply)
    fetchMarket().then(apply)
    const id = setInterval(tick, TICK_MS)
    document.addEventListener("visibilitychange", tick)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [apply])

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, refreshing: true }))
    fetchMarket({ force: true }).then(apply)
  }, [apply])

  return { ...state, refresh }
}
