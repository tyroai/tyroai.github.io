import { useEffect } from "react"
import { revealInScroller } from "@/lib/revealInScroller"

// Yazı girilen öğeler: düğme, onay kutusu ve dosya seçici klavye açmaz.
const ENTRY =
  "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=file]):not([type=range]), textarea, [contenteditable=true]"
const isEntry = (el) => Boolean(el?.matches?.(ENTRY))

/**
 * Ekran klavyesi açılınca alt çekmece görünen alana sığacak kadar küçülür (`lib/sheetLift`); o
 * sırada odaktaki yazı alanı gövdenin görünen kısmının dışında — çoğu kez klavyenin altında —
 * kalabilir ve kişi ne yazdığını göremez. Klavye çekmeceyi küçülttükten sonra (`viewportKey`:
 * görünen alanın boyu ve kayması değişince) ve klavye açıkken alandan alana geçilince odaktaki alan
 * gövdede görünür alanın ortasına kaydırılır (`revealInScroller`: yalnız gövde kayar). `body`:
 * kayan gövde öğesi (yoksa `null`).
 */
export function useKeepFieldVisible(body, viewportKey) {
  useEffect(() => {
    if (!body) return undefined
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const reveal = (el) => {
      if (isEntry(el) && body.contains(el))
        revealInScroller(body, el, { behavior: calm ? "auto" : "smooth" })
    }
    // Düzen oturduktan sonra ölç: çekmece küçülürken iki kare beklenir.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => reveal(document.activeElement))
    })
    let timer = 0
    const onFocusIn = (e) => {
      clearTimeout(timer)
      timer = window.setTimeout(() => reveal(e.target), 80)
    }
    body.addEventListener("focusin", onFocusIn)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      body.removeEventListener("focusin", onFocusIn)
    }
  }, [body, viewportKey])
}
