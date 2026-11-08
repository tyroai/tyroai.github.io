import { useEffect, useState } from "react"
import { fetchMarket, peekMarket } from "@/features/widgets/lib/market"

const usdOf = (data) => data?.rows?.find((r) => r.id === "usd")?.value ?? null

/** Piyasa kartının dolar kuru (Truncgil satış, gösterge) — önce elde olan, sonra tazesi; yoksa `null`. */
export function useUsdTry() {
  const [rate, setRate] = useState(() => usdOf(peekMarket()))
  useEffect(() => {
    let live = true
    fetchMarket().then((data) => live && setRate(usdOf(data)))
    return () => {
      live = false
    }
  }, [])
  return rate
}
