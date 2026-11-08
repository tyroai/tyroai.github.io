import { useLayoutEffect, useState } from "react"
import type { RefObject } from "react"

/**
 * Öğe en az `px` genişlikte mi. Ölçülene kadar `false`: dar kartta geniş düzen (ve onun içerik
 * isteği) bir kare bile başlamasın. Ölçüm boyamadan önce (`useLayoutEffect`), sonra
 * `ResizeObserver` ile.
 */
export function useAtLeast(ref: RefObject<HTMLElement | null>, px: number): boolean {
  const [wide, setWide] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = () => setWide(el.offsetWidth >= px)
    read()
    if (typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, px])
  return wide
}
