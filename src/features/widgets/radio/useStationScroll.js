import { useCallback, useEffect, useRef, useState } from "react"

const SWIPE_PX = 40
// Okla başlatılan kaydırma sürerken ikinci basış bir sonraki sayfaya gitsin.
const PENDING_MS = 600

/** Kaydırma hareketi: azaltılmış harekette anında. */
export const scrollBehavior = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth"

/**
 * İstasyon listesi KAYAR: fare tekerleği ve dokunmatik yüzeyle, satırlara oturarak (`snap`).
 * Başlıktaki çevirici (‹ 2/10 ›) bir sayfa (görünen satır sayısı) kaydırır, sayacı kaydırmadan
 * okur — `usePager`la aynı yüzey (`page · pages · prev · next`). Dokunmatik ekranda dikey
 * kaydırma sayfanın (liste kaymaz, kart sayfanın kaydırmasını yutmasın): orada yatay çekme
 * sayfa çevirir. `resetKey` değişince (başka yer) başa döner. Liste öğesi `setEl` ile bağlanır
 * (ref nesnesi değil: kanca nesnesi çizimde okunuyor).
 */
export function useStationScroll(count, size, resetKey) {
  const [el, setEl] = useState(null)
  // Sayfa, ölçüldüğü kutu ve yerle birlikte: liste yeniden kurulunca (başka yer, yükleme, düzen
  // değişimi) yeni kutu baştadır — eski sayaç ("4/10") kalmasın.
  const [mark, setMark] = useState({ el: null, key: resetKey, page: 0 })
  const pages = Math.max(1, Math.ceil(count / size))
  const page = mark.el === el && mark.key === resetKey ? Math.min(mark.page, pages - 1) : 0
  const frame = useRef(0)
  const pending = useRef(null)
  const start = useRef(null)
  const lastKey = useRef(resetKey)

  // Bir sayfanın boyu: satır aralığı (satır + boşluk) × görünen satır.
  const step = useCallback(() => {
    const kids = el?.children
    return kids && kids.length > 1 ? (kids[1].offsetTop - kids[0].offsetTop) * size : 0
  }, [el, size])

  const read = useCallback(() => {
    const s = step()
    if (!el || !s) return
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
    setMark({ el, key: resetKey, page: atEnd ? pages - 1 : Math.round(el.scrollTop / s) })
  }, [el, pages, resetKey, step])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  // Başka yer seçilince başa — yalnız yer gerçekten değişince: yeni kurulan kutu zaten başta ve
  // çalan istasyonu gösteren kaydırma (`StationList`) geri alınmasın.
  useEffect(() => {
    if (lastKey.current === resetKey) return
    lastKey.current = resetKey
    pending.current = null
    el?.scrollTo({ top: 0 })
  }, [el, resetKey])

  const onScroll = () => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      read()
    })
  }

  const go = (dir) => {
    if (!el) return
    const now = performance.now()
    const p = pending.current
    const from = p?.el === el && p.until > now ? p.target : page
    const target = Math.max(0, Math.min(pages - 1, from + dir))
    if (target === from) return
    pending.current = { el, target, until: now + PENDING_MS }
    el.scrollTo({ top: target * step(), behavior: scrollBehavior() })
  }

  return {
    el,
    setEl,
    page,
    pages,
    prev: () => go(-1),
    next: () => go(1),
    onScroll,
    swipe:
      pages > 1
        ? {
            style: { touchAction: "pan-y" },
            onPointerDown: (e) => {
              if (e.pointerType !== "mouse") start.current = { x: e.clientX, y: e.clientY }
            },
            onPointerUp: (e) => {
              const s = start.current
              start.current = null
              if (!s) return
              const dx = e.clientX - s.x
              const dy = e.clientY - s.y
              if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
            },
            onPointerCancel: () => {
              start.current = null
            },
          }
        : {},
  }
}
