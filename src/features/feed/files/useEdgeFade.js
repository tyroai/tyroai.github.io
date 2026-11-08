import { useEffect, useState } from "react"

/** Kayan şeridin hangi kenarında kesik içerik var: "" | "start" | "end" | "both". */
function edgesOf(el) {
  const max = el.scrollWidth - el.clientWidth
  if (max <= 1) return ""
  const x = Math.abs(el.scrollLeft)
  return x <= 1 ? "end" : x >= max - 1 ? "start" : "both"
}

/**
 * Yatay kayan şeridin solma kenarı (`data-fade`, görünüşü `files.css`te): yalnız kesik tarafta
 * solar — sonu görünür, devamı olduğu anlaşılır; sığıyorsa hiç solmaz.
 */
export function useEdgeFade(ref) {
  const [edges, setEdges] = useState("")
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const update = () => setEdges(edgesOf(el))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    el.addEventListener("scroll", update, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener("scroll", update)
    }
  }, [ref])
  return edges || undefined
}
