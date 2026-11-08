import { useCallback, useState } from "react"

/** Grupların aç/kapa durumu: kapalı grup anahtarları; hepsini aç ya da kapat. */
export function useCollapse() {
  const [closed, setClosed] = useState(() => new Set())
  const toggle = useCallback(
    (k) =>
      setClosed((s) => {
        const n = new Set(s)
        if (n.has(k)) n.delete(k)
        else n.add(k)
        return n
      }),
    [],
  )
  const setAll = useCallback((keys, close) => setClosed(close ? new Set(keys) : new Set()), [])
  return { closed, toggle, setAll }
}

/**
 * Tablo hücrelerinin ipucu: tek balon, olay tablodan dinlenir (yüzlerce hücreye ayrı balon
 * kurulmaz). Hücre `data-tip` (başlık) ve `data-tip-sub` (ayrıntı) taşır.
 */
export function useCellTip() {
  const [tip, setTip] = useState(null)
  const onMouseOver = useCallback((e) => {
    const el = e.target.closest?.("[data-tip]")
    if (!el) {
      setTip(null)
      return
    }
    const r = el.getBoundingClientRect()
    setTip((t) =>
      t?.key === el.dataset.tip + el.dataset.tipSub
        ? t
        : {
            key: el.dataset.tip + el.dataset.tipSub,
            x: r.left + r.width / 2,
            y: r.top,
            title: el.dataset.tip,
            sub: el.dataset.tipSub,
          },
    )
  }, [])
  const hide = useCallback(() => setTip(null), [])
  return { tip, bind: { onMouseOver, onMouseLeave: hide, onScroll: hide } }
}
