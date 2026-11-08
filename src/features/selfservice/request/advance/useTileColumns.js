import { useLayoutEffect, useState } from "react"

const px = (v) => parseFloat(v) || 0

/**
 * Ödeme ve belge karosunun sığması için gereken en dar karo: ikon ve iç boşluk + iki seçeneğin
 * yan yana en kısa hâli (eşit sütun: en uzun yazı × 2). Seçimden ve o anki sütun sayısından
 * bağımsız ölçülür (yazının kalın kopyası genişliği tutar): ölçüm düzeni değiştirince yeniden
 * değişmez, gidip gelme olmaz.
 */
function segNeed(tile) {
  const wrap = tile.querySelector("[data-seg-wrap]")
  const track = tile.querySelector("[role='radiogroup']")
  const texts = [...(track?.querySelectorAll("[data-seg-text]") ?? [])]
  if (!wrap || !texts.length) return 0
  const btn = getComputedStyle(texts[0].parentElement)
  const box = getComputedStyle(track)
  // Kalın kopyanın tam yazı genişliği (kesilmiş olsa da `scrollWidth` yazının tamamı).
  const widest = Math.max(...texts.map((el) => el.firstElementChild?.scrollWidth ?? 0))
  const option = widest + px(btn.paddingLeft) + px(btn.paddingRight)
  const row =
    texts.length * option +
    (texts.length - 1) * px(box.columnGap) +
    px(box.paddingLeft) +
    px(box.paddingRight)
  return tile.getBoundingClientRect().width - wrap.getBoundingClientRect().width + row
}

/**
 * Avans karolarının sütun sayısı: geniş kapta üç, ortada iki, darda bir (`@container/fields`
 * sorguları). Ödeme ya da belge seçenekleri bir sütuna sığmıyorsa (uzun dil: "Undocumented",
 * "Без документов") ızgara bir kademe azalır — iki seçenek de okunur kalır. Türkçede üç sütun.
 * `ref`: ızgaranın kendisi. Dönüş: `{ fit2, fit3 }`.
 */
export function useTileColumns(ref, locale) {
  const [fit, setFit] = useState({ fit2: true, fit3: true })
  useLayoutEffect(() => {
    const grid = ref.current
    if (!grid) return undefined
    const measure = () => {
      const width = grid.clientWidth
      const gap = px(getComputedStyle(grid).columnGap)
      const need = Math.max(0, ...[...grid.querySelectorAll("[data-seg]")].map(segNeed))
      const next = { fit2: need <= (width - gap) / 2, fit3: need <= (width - 2 * gap) / 3 }
      setFit((f) => (f.fit2 === next.fit2 && f.fit3 === next.fit3 ? f : next))
    }
    measure()
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    ro?.observe(grid)
    // Yazı tipi geç gelirse yazı genişlikleri değişir.
    document.fonts?.ready.then(measure).catch(() => {})
    return () => ro?.disconnect()
  }, [ref, locale])
  return fit
}
