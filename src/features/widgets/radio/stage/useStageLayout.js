import { useLayoutEffect, useState } from "react"
import { layoutFor } from "./stageModel"

/**
 * Sahnenin düzeni kartın en/boy oranından (`layoutFor`): dikey ya da kareye yakın kartta
 * (header penceresi, mini kart, telefon) `pairs`, belirgin yatay kartta (panonun büyük kartı,
 * sol sütun) `row`. Boyamadan önce ölçülür: büyük kart bir kare dikey düzenle görünmesin.
 */
export function useStageLayout(ref) {
  const [layout, setLayout] = useState("pairs")
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = () => {
      const r = el.getBoundingClientRect()
      setLayout(layoutFor(r.width, r.height))
    }
    read()
    if (typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return layout
}
