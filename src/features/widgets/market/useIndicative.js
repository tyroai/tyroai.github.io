import { useEffect, useState } from "react"
import { fetchIndicative } from "@/features/widgets/lib/marketIndicative"

/** Gösterge kurlar (`features/widgets/lib/marketIndicative`) — yalnız `enabled` iken okunur; yoksa `null`. */
export function useIndicative(enabled) {
  const [value, setValue] = useState(null)
  useEffect(() => {
    if (!enabled) return undefined
    let live = true
    fetchIndicative().then((v) => live && setValue(v))
    return () => {
      live = false
    }
  }, [enabled])
  return enabled ? value : null
}
