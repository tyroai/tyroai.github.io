import { useEffect, useState } from "react"

// İlk ekran hemen çizilir; kalanı boşta, birkaç kart birden. Kartlar listenin SONUNA eklendiği
// için görünen içerik kaymaz. 20–25 kartı tek seferde çizmek telefonda ~1 sn'lik tek uzun işti
// (Lighthouse TBT); parçalara bölünce her biri kısa kalır.
export const EAGER_POSTS = 6
const STEP = 4

/** Şu an çizilecek kart sayısı (`total`e kadar boşta artar). */
export function useProgressiveCount(total) {
  const [count, setCount] = useState(EAGER_POSTS)
  useEffect(() => {
    if (count >= total) return undefined
    const idle = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 50))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const id = idle(() => setCount((n) => n + STEP), { timeout: 500 })
    return () => cancel(id)
  }, [count, total])
  return Math.min(count, total)
}
