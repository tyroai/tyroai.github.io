import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

/** Sosyal düzenin eşiği: kabın (`@container/feed`) İÇERİK genişliği, rem (telefonun üstü). */
const SOCIAL_MIN_REM = 40
// Yatay telefon mevcut telefon düzeninde kalır: ilk gönderi ilk ekranda görünsün.
const SHORT_TOUCH = "(max-height: 500px) and (pointer: coarse)"

/** Keşfet'in düzen kipi: `social` = ortalanmış gönderi kartları + masaüstü hikâyeleri. */
export const FeedLayoutContext = createContext({ social: false })

export const useFeedLayout = () => useContext(FeedLayoutContext)

const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

/**
 * Sosyal düzen mi: kabın genişliği telefon eşiğinin üstünde ve ekran yatay telefon değil.
 * Karar kap sorgusuyla AYNI ölçüden (içerik kutusu) verilir — sohbet paneli kabı daraltınca
 * düzen onunla birlikte telefona döner. Ölçüm boyamadan önce: bir kare bile yanlış çizilmez.
 */
export function useSocialLayout(ref) {
  const shortTouch = useMediaQuery(SHORT_TOUCH)
  const [wide, setWide] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = (width) => setWide(width >= SOCIAL_MIN_REM * remPx())
    const cs = getComputedStyle(el)
    read(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))
    if (typeof ResizeObserver === "undefined") return undefined
    const observer = new ResizeObserver(([entry]) => read(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  const social = wide && !shortTouch
  return useMemo(() => ({ social }), [social])
}
