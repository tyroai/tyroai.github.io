import { useEffect, useState } from "react"

// İki ay yan yana bu genişlikten itibaren (rem; kökle ölçeklenir).
const TWO_MONTHS_REM = 33

/** Kabın genişliği iki aya yetiyor mu (ResizeObserver; ilk çizimde bir ay). */
export function useTwoMonths(ref) {
  const [two, setTwo] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return undefined
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const ro = new ResizeObserver(([e]) => setTwo(e.contentRect.width >= TWO_MONTHS_REM * rem))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return two
}

/** Ayın hücreleri haftalara (ızgaranın satırları; ekran okuyucu satır satır gezer). */
export const weeksOf = (cells) =>
  Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) => cells.slice(w * 7, w * 7 + 7))
