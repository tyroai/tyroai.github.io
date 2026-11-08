import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

const calm = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
const EMPTY = { overflow: false, prev: false, next: false, after: 0 }
// Kesirli piksel ve yakalama payı: uca 2 px kala uç sayılır.
const EDGE = 2

/**
 * Fiş şeridinin kaydırması: küçük resimler tek satırda, sığmayanlar oklarla (‹ ›) sayfa sayfa.
 * `overflow`: sığmayan var (oklar görünür); `prev`/`next`: o yöne gidilebilir (uçlarda kapalı);
 * `after`: ileride kalan (tamamı görünmeyen) fiş sayısı ("+7"). Sağdan sola yazımda yönler
 * aynalanır. Yeni fiş eklenince şerit sona kayar: kişi eklenenleri görür (taslaktan açılışta değil).
 * `count`: fiş sayısı. Dönüş: kaydırıcıya `ref`, `state`, `measure` (kaydırınca) ve `page(±1)`.
 */
export function useStripScroll(count) {
  const ref = useRef(null)
  const [state, setState] = useState(EMPTY)
  const seen = useRef(count)
  const has = count > 0

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const rtl = getComputedStyle(el).direction === "rtl"
    const max = el.scrollWidth - el.clientWidth
    const at = Math.abs(el.scrollLeft)
    const box = el.getBoundingClientRect()
    let after = 0
    for (const item of el.children) {
      const r = item.getBoundingClientRect()
      if (rtl ? r.left < box.left - EDGE : r.right > box.right + EDGE) after++
    }
    const next = { overflow: max > EDGE, prev: at > EDGE, next: at < max - EDGE, after }
    setState((s) =>
      s.overflow === next.overflow &&
      s.prev === next.prev &&
      s.next === next.next &&
      s.after === next.after
        ? s
        : next,
    )
  }, [])

  // Liste değişince (eklenen, kaldırılan) ve kap boyu değişince yeniden ölçülür.
  useLayoutEffect(() => measure(), [measure, count])
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, has])

  useEffect(() => {
    const grew = count > seen.current
    seen.current = count
    const el = ref.current
    if (!grew || !el) return
    const rtl = getComputedStyle(el).direction === "rtl"
    const end = el.scrollWidth - el.clientWidth
    el.scrollTo({ left: rtl ? -end : end, behavior: calm() ? "auto" : "smooth" })
  }, [count])

  /** Bir sayfa ileri (`1`) ya da geri (`-1`): görünen enin bir küçük resim eksiği kadar. */
  const page = (dir) => {
    const el = ref.current
    if (!el) return
    const rtl = getComputedStyle(el).direction === "rtl"
    const step = Math.max(el.clientWidth - 56, 52) * dir * (rtl ? -1 : 1)
    el.scrollBy({ left: step, behavior: calm() ? "auto" : "smooth" })
  }

  return { ref, state, measure, page }
}
