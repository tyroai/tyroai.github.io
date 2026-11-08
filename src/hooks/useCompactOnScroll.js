import { useEffect, useState } from "react"

/**
 * Yüzen düğme aşağı kaydırınca küçülür, yukarı kaydırınca açılır (Gmail "Yeni ileti"). `scrollRef`
 * verilmezse sayfadaki her dikey kaydırıcı dinlenir (yatay şeritler sayılmaz).
 */
export function useCompactOnScroll(scrollRef) {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const el = scrollRef?.current ?? null
    const target = el ?? document
    let last = el ? el.scrollTop : 0
    const onScroll = (e) => {
      const node = el ?? e.target
      if (!(node instanceof Element) || node.scrollHeight <= node.clientHeight + 1) return
      const top = node.scrollTop
      if (top - last > 6 && top > 80) setCompact(true)
      else if (last - top > 6 || top < 40) setCompact(false)
      last = top
    }
    target.addEventListener("scroll", onScroll, { passive: true, capture: !el })
    return () => target.removeEventListener("scroll", onScroll, { capture: !el })
  }, [scrollRef])
  return compact
}
