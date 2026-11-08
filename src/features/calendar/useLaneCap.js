import { useLayoutEffect, useState } from "react"

// Bir bloğun okunur kalması için en az genişlik (px): dar sütunda yan yana sığacak blok sayısı buradan.
const LANE_PX = 45
const MIN_LANES = 2
const MAX_LANES = 6

/**
 * Saat ızgarasında yan yana en çok kaç çakışan blok çizilir: ilk sütunun genişliği / 45 px
 * (1440 px'te yedi gün → 2, gün görünümü → 6). Fazlası "+n" düğmesinde toplanır
 * (`features/calendar/lib/layout › packLanes`): ince çizgiye dönmüş blokta başlık okunmuyordu.
 */
export function useLaneCap(scrollerRef, cols) {
  const [cap, setCap] = useState(3)
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return undefined
    const measure = () => {
      const col = el.querySelector(".cal-col")?.clientWidth
      if (!col) return
      const next = Math.max(MIN_LANES, Math.min(MAX_LANES, Math.floor(col / LANE_PX)))
      setCap((c) => (c === next ? c : next))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // `cols`: hafta ↔ gün geçişinde kap aynı boyda kalır, yalnız sütun sayısı değişir: yeniden ölçülür.
  }, [scrollerRef, cols])
  return cap
}
