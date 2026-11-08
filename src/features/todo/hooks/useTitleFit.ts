import { useLayoutEffect, type RefObject } from "react"

/**
 * Tek satırlık başlık kutusuna sığmıyorsa `data-fit="sm"` koyar (CSS bir kademe küçültür),
 * sığınca kaldırır. Telefon kartının cümlesi dile göre uzun (EN, RU): kesilince sayı
 * ("12 iş" → "1…") kaybolmasın; küçülünce de sığmazsa üç nokta kalır. Özellik DOM'da (React'in
 * çizdiği değil), boyamadan ÖNCE konur: zıplama yok. Kutu eni değişince ve yazı tipi
 * yüklenince yeniden ölçülür.
 */
export function useTitleFit(ref: RefObject<HTMLElement | null>, content: string): void {
  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!el || !box) return undefined
    let width = -1
    const check = () => {
      width = box.clientWidth
      delete el.dataset.fit
      if (el.scrollWidth > el.clientWidth + 0.5) el.dataset.fit = "sm"
    }
    check()
    // Yalnız en değişince: küçülen yazı kutunun boyunu da değiştirir, döngü olmasın.
    const ro = new ResizeObserver(() => {
      if (box.clientWidth !== width) check()
    })
    ro.observe(box)
    void document.fonts?.ready.then(check)
    return () => ro.disconnect()
  }, [ref, content])
}
