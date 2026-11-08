import { useLayoutEffect } from "react"

/**
 * Yapışık başlık ve alt şerit kaydırma kutusunun tam kenarına yapışsın: tarayıcı yapışık öğeyi
 * kutunun iç boşluğunun içinde tutuyor, aradaki şeritten kayan satırlar görünüyordu. Boşluk
 * ölçülür; `--xg-top` ve `--xg-bottom` onun eksisi olur (kök yazı boyu değişince yeniden).
 */
export function useStickyEdges(ref) {
  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.closest(".overflow-y-auto")
    if (!el || !box) return undefined
    const set = () => {
      const s = getComputedStyle(box)
      el.style.setProperty("--xg-top", `-${s.paddingTop}`)
      el.style.setProperty("--xg-bottom", `-${s.paddingBottom}`)
    }
    set()
    window.addEventListener("resize", set)
    return () => window.removeEventListener("resize", set)
  }, [ref])
}
