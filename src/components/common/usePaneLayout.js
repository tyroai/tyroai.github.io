import { useLayoutEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

// Yatay telefon: kısa ve kaba işaretçili ekran her zaman tek sütun (Profil ile aynı karar).
const SHORT_TOUCH = "(max-height: 500px) and (pointer: coarse)"

/**
 * İki bölmeli (sol menü + içerik) düzen mi: kaydırıcı kabı en az `min` px genişliğindeyse. Kabı
 * ölçer (görüntü alanını değil): sohbet rıhtımı açılınca kap daralır ve sayfa kendiliğinden tek
 * sütuna döner. Ölçüm boyamadan önce (layout effect): düzen bir kare bile yanlış çizilmez.
 * Kabın kendisi bu karara bağlı değil (iç kutu değişir, kap değil): salınım olmaz.
 */
export function usePaneLayout(ref, min = 896) {
  const shortTouch = useMediaQuery(SHORT_TOUCH)
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.innerWidth >= min)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = (width) => setWide(width >= min)
    read(el.clientWidth)
    if (typeof ResizeObserver === "undefined") return undefined
    const observer = new ResizeObserver(([entry]) => read(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, min])
  return wide && !shortTouch
}
