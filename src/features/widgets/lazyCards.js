import { useEffect, useLayoutEffect, useState } from "react"

// Görünür alanın bu kadar altına kadar olan kart hemen çizilir; kaydırırken de bu payla önden.
const MARGIN = 200
// Ekran dışı kartlar ilk çizimin işi bittikten sonra boşta, birer birer gelir: Tab ve sayfa içi
// arama hepsini bulsun. Aralık, hepsinin tek uzun işte toplanmasını önler.
const IDLE_START = 2500
const IDLE_STEP = 120
// Bölgenin ilk bu kadar kartı her zaman hemen çizilir (Anasayfa'nın tamamı): ekranın üstü bunlar,
// ölçüm geçişi de yalnız daha uzun bölgede (Pano) gerekir.
export const EAGER_CARDS = 6
export const EMPTY = new Set()

/** Kartın kaydırdığı kap (Anasayfa ve Pano'da `.ms-scroll`); yoksa görüntü alanı. */
const scrollRootOf = (el) => el?.closest(".ms-scroll") ?? null

/**
 * Bölgenin ilk çiziminde hangi kartlar ekranın altında kalıyor. İlk geçişte kartlar yer
 * tutucuyla (aynı boy) çizilir; bu kanca konumları boyamadan önce okur ve yalnız uzaktakileri
 * döndürür. Okuma sütun sayısının zaten zorladığı yerleşime biner, ek yerleşim değil.
 * Ölçümden sonra gelen kart (yeni eklenen, sonradan yüklenen düzen) hemen çizilir.
 * `off`: düzenleme kipi ya da tur — her kart hemen çizilir. `long`: bölgede `EAGER_CARDS`ten
 * fazla kart var; yoksa ölçülmez (fazladan çizim geçişi olmasın).
 */
export function useFarCards(gridRef, off, long) {
  const [far, setFar] = useState(() => (off || !long ? EMPTY : null))
  useLayoutEffect(() => {
    if (far) return
    // Boyamadan önce ölçülüp karar verilir (useColumns gibi): görünen kart ilk karede yerinde.
    const measure = () => {
      const grid = gridRef.current
      const root = scrollRootOf(grid)
      const limit = (root ? root.getBoundingClientRect().bottom : window.innerHeight) + MARGIN
      const ids = new Set()
      for (const el of grid?.querySelectorAll(":scope > [data-widget-slot]") ?? []) {
        if (el.getBoundingClientRect().top > limit) ids.add(el.dataset.widgetSlot)
      }
      setFar(ids)
    }
    measure()
  }, [far, gridRef])
  // Bir kez çizilen kart geri alınmaz: düzenleme bitince de uzaktakiler yerinde kalır.
  if (off && far?.size) setFar(EMPTY)
  // Ölçüm öncesi (null) her kart yer tutucu.
  return off ? EMPTY : far
}

/**
 * Yer tutucudaki kartı ne zaman çizmeli: kaydırma kabında görünüre `MARGIN` kala ya da boşta
 * (`order`: ekran dışı kartların sırası). `waiting` değilse hiçbir şey kurulmaz.
 */
export function useMountWhenNear(placeholderRef, waiting, order) {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = placeholderRef.current
    if (!waiting || near || !el) return undefined
    const show = () => setNear(true)
    let io = null
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && show(), {
        root: scrollRootOf(el),
        rootMargin: `${MARGIN}px 0px`,
      })
      io.observe(el)
    }
    let idle = 0
    const timer = window.setTimeout(
      () => {
        idle = window.requestIdleCallback ? window.requestIdleCallback(show, { timeout: 1000 }) : 0
        if (!window.requestIdleCallback) show()
      },
      IDLE_START + order * IDLE_STEP,
    )
    return () => {
      io?.disconnect()
      window.clearTimeout(timer)
      if (idle) window.cancelIdleCallback(idle)
    }
  }, [placeholderRef, waiting, near, order])
  return near
}
