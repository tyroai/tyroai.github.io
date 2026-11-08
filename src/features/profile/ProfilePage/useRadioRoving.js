import { useRef } from "react"
import { isRtl, rovingIndex } from "@/lib/rovingKeys"

/**
 * Tek seçimli kart/renk grubu için WAI-ARIA radyo davranışı: grup tek sekme durağı (seçili
 * öğe), oklar seçimi taşır ve odağı izler. 17 renk noktası 17 Tab basışı olmasın.
 * `itemProps(id, index)` her öğeye `ref`, `tabIndex` ve `onKeyDown` verir.
 */
export function useRadioRoving(ids, value, onChange) {
  const refs = useRef([])
  const current = Math.max(0, ids.indexOf(value))

  function onKeyDown(event, index) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const next = rovingIndex(event.key, index, ids.length, isRtl(event.currentTarget))
    if (next < 0) return
    event.preventDefault()
    onChange(ids[next])
    refs.current[next]?.focus()
  }

  return (id, index) => ({
    ref: (el) => {
      refs.current[index] = el
    },
    tabIndex: index === current ? 0 : -1,
    onKeyDown: (event) => onKeyDown(event, index),
  })
}
