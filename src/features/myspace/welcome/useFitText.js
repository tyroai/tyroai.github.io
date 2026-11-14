import { useEffect, useLayoutEffect } from "react"

const MAX = 19
const MIN = 15

/** Yazının kutuya sığan en büyük boyu (ikili arama, yarım piksel). */
function fitText(box, text, { max = MAX, min = MIN } = {}) {
  if (!box || !text) return
  const cs = getComputedStyle(box)
  const room = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
  const fits = (px) => {
    text.style.fontSize = `${px}px`
    return text.offsetHeight <= room
  }
  // Öneri kartındaki küre (`OrbToken`) piksel boyunda çizilir: yazıyla aynı oranda ölçeklensin.
  const done = (px) => text.style.setProperty("--welcome-scale", String(px / MAX))
  if (fits(max)) return done(max)
  let lo = min
  let hi = max
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2
    if (fits(mid)) lo = mid
    else hi = mid
  }
  text.style.fontSize = `${lo}px`
  done(lo)
}

/**
 * Yazı kutuya sığsın: satırların boyu 19 → 15 px (selamlama, simgeler ve kart em ile birlikte küçülür).
 * Çekmecenin boyu sabit, cümleler dile ve güne göre uzar (Rusça, uzun ad, uzun hava cümlesi): sığmayan
 * satır kesilmez, yazı küçülür. Her çizimde ve kutu boy değiştirdiğinde (döndürme, klavye) yeniden ölçer;
 * durum yazmaz. `range` ({ max, min }) karşılama kartında daha küçük: sabit bir nesne geçilir.
 */
export function useFitText(boxRef, textRef, range) {
  useLayoutEffect(() => fitText(boxRef.current, textRef.current, range))
  useEffect(() => {
    const box = boxRef.current
    if (!box || typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(() => fitText(boxRef.current, textRef.current, range))
    ro.observe(box)
    return () => ro.disconnect()
  }, [boxRef, textRef, range])
}
