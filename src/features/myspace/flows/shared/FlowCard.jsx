import { useEffect, useRef } from "react"
import "./flowPickers.css"

/**
 * Akışın içinde açılan seçim kartı (referanstaki gibi: tıklanan sözcüğün hemen üstünde, panelin
 * içinde yüzer). Portal yok: pencere ve alt çekmece içinde aynı çalışır, odak tuzağıyla çekişmez.
 * Açılınca `[data-autofocus]` (yoksa ilk düğme) odaklanır; dışına basmak ya da Escape kapatır
 * (Escape'i pencere değil kart alır — `AdvanceFlow` pencerenin kapanmasını o an engeller).
 * `place`: `{ top }` ya da `{ bottom }` (panel gövdesine göre, px) ve dönüşüm kökeni.
 */
export function FlowCard({ label, place, onClose, wide, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    const target = el?.querySelector("[data-autofocus]") ?? el?.querySelector("button, input")
    target?.focus({ preventScroll: true })
  }, [])
  return (
    <>
      <div className="af-scrim" aria-hidden="true" onPointerDown={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-label={label}
        className="af-card"
        data-wide={wide ? "" : undefined}
        style={{ top: place.top, bottom: place.bottom, "--af-origin": place.origin }}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return
          e.stopPropagation()
          onClose()
        }}
      >
        {children}
      </div>
    </>
  )
}
