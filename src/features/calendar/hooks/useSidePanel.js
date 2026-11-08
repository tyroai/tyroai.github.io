import { useLayoutEffect, useState } from "react"

/**
 * Takvim özeti ızgaranın SAĞINDA mı (altında değil)? Karar CSS'in kap sorgusunda
 * (`calendarPanels.css` › `--cal-side`); burada yalnız okunur, eşik iki yerde yazılmaz. Sütun
 * genişliği değişince (kenar çubuğu, sohbet paneli, pencere) yeniden bakılır. `ref`: ızgara
 * sütunu (değişken `.cal-main`ten miras gelir).
 */
export function useSidePanel(ref, enabled = true) {
  const [side, setSide] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!enabled || !el) return undefined
    const read = () => setSide(getComputedStyle(el).getPropertyValue("--cal-side").trim() === "1")
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, enabled])
  return enabled && side
}
