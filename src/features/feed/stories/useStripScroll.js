import { useCallback, useLayoutEffect, useState } from "react"
import { useReducedMotion } from "motion/react"

/**
 * Yatay şeridin uçları: devamı olan yanda solma payı (`--fade-start/--fade-end`, CSS değişkeni)
 * ve ok düğmeleri için durum (`enabled` kapalıysa hiçbir şey yapmaz: telefon). `count` değişince
 * (iskelet → hikâyeler) yeniden ölçülür.
 * `page(±1)`: şeridi bir sayfa kaydırır; hareketi azalt'ta animasyonsuz.
 */
export function useStripScroll(ref, count, enabled = true, size = 32) {
  const reduce = useReducedMotion()
  const [edges, setEdges] = useState({ start: false, end: false })
  useLayoutEffect(() => {
    const node = ref.current
    if (!enabled || !node) return undefined
    const read = () => {
      const pos = Math.abs(node.scrollLeft)
      const room = node.scrollWidth - node.clientWidth
      const start = pos > 1
      const end = room - pos > 1
      node.style.setProperty("--fade-start", start ? `${size}px` : "0px")
      node.style.setProperty("--fade-end", end ? `${size}px` : "0px")
      setEdges((p) => (p.start === start && p.end === end ? p : { start, end }))
    }
    read()
    node.addEventListener("scroll", read, { passive: true })
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read)
    observer?.observe(node)
    for (const child of node.children) observer?.observe(child)
    return () => {
      node.removeEventListener("scroll", read)
      observer?.disconnect()
    }
  }, [ref, count, enabled, size])
  const page = useCallback(
    (dir) =>
      ref.current?.scrollBy({
        left: dir * ref.current.clientWidth * 0.8,
        behavior: reduce ? "auto" : "smooth",
      }),
    [ref, reduce],
  )
  return { ...edges, page }
}
