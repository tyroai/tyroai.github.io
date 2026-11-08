import { useEffect, useLayoutEffect } from "react"

const MAX = 31
const MIN = 22

/** Yazının kutuya sığan en büyük boyu (ikili arama, yarım piksel). */
function fitText(box, text) {
  if (!box || !text) return
  const cs = getComputedStyle(box)
  const room = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
  const fits = (px) => {
    text.style.fontSize = `${px}px`
    return text.offsetHeight <= room
  }
  if (fits(MAX)) return
  let lo = MIN
  let hi = MAX
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2
    if (fits(mid)) lo = mid
    else hi = mid
  }
  text.style.fontSize = `${lo}px`
}

/**
 * Yazı kutuya sığsın: 31 → 22 px. Çekmecenin boyu sabit, cümleler dile ve güne göre uzar (Rusça,
 * uzun ad, uzun hava cümlesi): sığmayan satır kesilmez, yazı küçülür. Her çizimde ve kutu boy değiştirdiğinde
 * (döndürme, klavye) yeniden ölçer; durum yazmaz.
 */
export function useFitText(boxRef, textRef) {
  useLayoutEffect(() => fitText(boxRef.current, textRef.current))
  useEffect(() => {
    const box = boxRef.current
    if (!box || typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(() => fitText(boxRef.current, textRef.current))
    ro.observe(box)
    return () => ro.disconnect()
  }, [boxRef, textRef])
}
