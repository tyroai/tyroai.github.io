import { useLayoutEffect, useState, type RefObject } from "react"
import { fitCount } from "@/features/calendar/lib/fitCount"

const width = (el: Element) => el.getBoundingClientRect().width

/**
 * Satırda (`ref`) kaç `[data-fit]` çipinin sığdığını ölçer; taşanlar için `[data-fit-more]` ("+N")
 * yer ayrılır. Sığmayan çipler DOM'da kalır (görünmez, mutlak konumlu): genişlikleri ölçülebilir
 * olsun. ResizeObserver satırı ve çipleri izler (pencere, dil, yükleniyor durumu); durum yalnız sayı
 * değişince güncellenir — kare başına setState yok. `key` çip kümesi değişince yeniden kurar.
 */
export function useFitCount(ref: RefObject<HTMLElement | null>, key: string): number {
  const [count, setCount] = useState(Number.POSITIVE_INFINITY)
  useLayoutEffect(() => {
    const row = ref.current
    if (!row) return
    const measure = () => {
      const style = getComputedStyle(row)
      const avail = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      const items = Array.from(row.querySelectorAll(":scope > [data-fit]"), width)
      const more = row.querySelector(":scope > [data-fit-more]")
      const n = fitCount(items, avail, parseFloat(style.columnGap) || 0, more ? width(more) : 0)
      setCount((prev) => (prev === n ? prev : n))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    for (const el of row.children) observer.observe(el)
    return () => observer.disconnect()
  }, [ref, key])
  return count
}
