import { useCallback, useEffect, useRef, useState } from "react"

const HOLD_MS = 700

/**
 * Yeni biten iş bir an yerinde kalır — tik ve üstü çizilme görünsün — sonra bitenlerin arasına kayar
 * (`lib/focusAdopt` › `shownOrder`). `hold(id)` bekleme süresini başlatır; aynı işe yeniden basılırsa
 * süre baştan sayar.
 */
export function useSettling() {
  const [settling, setSettling] = useState(() => new Set())
  const timers = useRef(new Map())

  useEffect(() => {
    const map = timers.current
    return () => map.forEach(clearTimeout)
  }, [])

  const hold = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    setSettling((s) => new Set(s).add(id))
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id)
        setSettling((s) => {
          const next = new Set(s)
          next.delete(id)
          return next
        })
      }, HOLD_MS),
    )
  }, [])

  return [settling, hold]
}
