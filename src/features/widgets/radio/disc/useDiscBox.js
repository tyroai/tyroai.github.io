import { useLayoutEffect, useState } from "react"
import { discLayoutFor } from "./discModel"

/**
 * Kartın yerleşim ölçüsü (px) ve düzeni; boyamadan önce okunur, disk ve kapak bu ölçüden
 * yerleşir. `offsetWidth`: katalog önizlemesindeki ölçekleme (transform) ölçüyü bozmasın.
 */
export function useDiscBox(ref) {
  const [box, setBox] = useState({ w: 250, h: 250, layout: "column" })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      setBox((b) => (b.w === w && b.h === h ? b : { w, h, layout: discLayoutFor(w, h) }))
    }
    read()
    if (typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return box
}
