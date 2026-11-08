import { useEffect, useState } from "react"
import { fetchCot, peekCot } from "@/features/widgets/lib/cot"

/** COT verisi (`features/widgets/lib/cot`): elde olan hemen, gerekiyorsa haftalık okuma. `enabled` değilse istek yok. */
export function useCot(enabled) {
  const [state, setState] = useState(() => ({ data: peekCot(), settled: false }))
  useEffect(() => {
    if (!enabled) return undefined
    let live = true
    fetchCot().then((data) => live && setState({ data, settled: true }))
    return () => {
      live = false
    }
  }, [enabled])
  return { data: state.data, loading: enabled && !state.settled && !state.data }
}
