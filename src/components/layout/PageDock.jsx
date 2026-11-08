import { useContext, useEffect, useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { PageDockContext } from "./pageDockState"

/**
 * SAYFA PANELİ — sohbet paneliyle aynı kenarda, aynı kabukta ikinci kolon. Bir sayfa (ör. Güvenlik'te
 * kullanıcı ayrıntısı) içeriğini `PageDockPortal` ile buraya taşır; React ağacı sayfada kalır (durum,
 * bağlamlar ve olaylar sayfanın), yalnız DOM kenar kolonunda çizilir. Kenar tek panel taşır: sohbet
 * ile sayfa paneli aynı anda açık olmaz, son açılan kazanır (`DashboardLayout`).
 */
/** Sayfanın kenar paneli: `open` iken çocukları kabuğun sağ kolonuna taşır. */
export function PageDockPortal({ open, onClose, label, children }) {
  const ctx = useContext(PageDockContext)
  const closeRef = useRef(onClose)
  useLayoutEffect(() => {
    closeRef.current = onClose
  })
  const setOwner = ctx?.setOwner
  useEffect(() => {
    if (!setOwner || !open) return undefined
    const owner = { label, close: () => closeRef.current?.() }
    setOwner(owner)
    return () => setOwner((cur) => (cur === owner ? null : cur))
  }, [setOwner, open, label])
  if (!ctx?.target || !open) return null
  return createPortal(children, ctx.target)
}

/** Kabuktaki kolon: yalnız bir sayfa paneli açıkken yer kaplar (sohbet paneliyle aynı kabuk). */
export function PageDockColumn({ owner, setTarget, hidden = false }) {
  const open = Boolean(owner) && !hidden
  return (
    <aside
      ref={setTarget}
      aria-label={open ? owner.label : undefined}
      aria-hidden={!open}
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden bg-background",
        open
          ? "w-[28rem] max-w-[45vw] shrink-0 border-l border-border"
          : "pointer-events-none w-0 border-l-0",
      )}
    />
  )
}
