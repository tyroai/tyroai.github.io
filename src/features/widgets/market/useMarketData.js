import { useCallback, useEffect, useState } from "react"
import { fetchMarket, peekMarket } from "@/features/widgets/lib/market"

// Dakikada bir yoklanır; ağa çıkıp çıkmamaya `fetchMarket`in önbellek süresi karar verir (taze
// veride 5 dk, güncellenemeyen veride 1 dk).
const TICK_MS = 60_000
// Birincil kaynak ara ara isteği yarıda kesiyor: taze veri gelmediyse (boş, yedek ya da eski veri)
// dakikalık yoklamayı beklemeden bu aralıklarla yeniden denenir; kart kendini toparlar.
const HEAL_MS = [4_000, 10_000, 20_000]
const settled = (data) => Boolean(data) && !data.stale && data.source !== "ecb"

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
    let heal = 0
    let timer = null
    let gone = false
    const land = (data) => {
      if (gone) return
      apply(data)
      clearTimeout(timer)
      if (settled(data)) heal = 0
      else if (heal < HEAL_MS.length) {
        timer = setTimeout(() => fetchMarket({ force: true }).then(land), HEAL_MS[heal++])
      }
    }
    const tick = () => !document.hidden && fetchMarket().then(land)
    fetchMarket().then(land)
    const id = setInterval(tick, TICK_MS)
    document.addEventListener("visibilitychange", tick)
    return () => {
      gone = true
      clearInterval(id)
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [apply])

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, refreshing: true }))
    fetchMarket({ force: true }).then(apply)
  }, [apply])

  return { ...state, refresh }
}
