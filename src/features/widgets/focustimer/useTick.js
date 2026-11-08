import { useEffect, useState } from "react"

/**
 * Sayaç çalışırken saniyede bir güncellenen "şimdi" (saniyenin başına hizalı); dururken hiç
 * çizdirmez. Başlayınca hemen bir kez tazelenir.
 */
export function useNow(running) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return undefined
    const tick = () => setNow(Date.now())
    let id = null
    const first = setTimeout(tick, 0)
    const lead = setTimeout(
      () => {
        tick()
        id = setInterval(tick, 1000)
      },
      1000 - (Date.now() % 1000),
    )
    return () => {
      clearTimeout(first)
      clearTimeout(lead)
      clearInterval(id)
    }
  }, [running])
  return now
}
