import { useLayoutEffect, useState } from "react"

/**
 * Öğe birden çok satıra kırıldı mı — boyu satır yüksekliğinin 1,5 katını geçiyorsa. Dönen
 * `ref` geri çağrımlı: öğe sonradan gelse de ölçülür; yazı boyu ya da genişlik değişince
 * (`ResizeObserver`) yeniden. Hava kartı bununla kısa düzene geçer (`SkyCard`).
 */
export function useLineWrap() {
  const [el, ref] = useState(null)
  const [wrapped, setWrapped] = useState(false)
  useLayoutEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") return undefined
    const check = () => {
      const line = parseFloat(getComputedStyle(el).lineHeight)
      setWrapped(line > 0 && el.getBoundingClientRect().height > line * 1.5)
    }
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [el])
  return [ref, wrapped]
}
