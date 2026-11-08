import { useLayoutEffect, useRef } from "react"

// Sonraki satırın görünen ucu: listenin kaydırılabildiği anlaşılsın.
const PEEK = 24

/**
 * Kaydırılan liste ilk `n` satırı gösterecek boyda başlar (`data-row` işaretli satırlar; bölüm
 * başlıkları sayılmaz, araya girdikleri kadar boy eklenir). Satır `n`den azsa sınır yok. Boy
 * esnek tabandır: komşu kart uzunsa liste onu doldurur. `key` içerik değişince yeniden ölçtürür.
 * Ölçüm boyamadan önce DOM'a yazılır; React durumu yok, ilk karede zıplama olmaz.
 */
export function useRowCap(n, key) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const rows = el.querySelectorAll("[data-row]")
      if (rows.length <= n) {
        el.style.height = ""
        return
      }
      const top = el.getBoundingClientRect().top - el.scrollTop
      const bottom = rows[n - 1].getBoundingClientRect().bottom - top
      el.style.height = `${Math.ceil(bottom + PEEK)}px`
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [n, key])
  return ref
}
