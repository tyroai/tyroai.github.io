import { useEffect, useRef } from "react"

// Büyükken bir ok basışında kayan pay (çerçevenin oranı).
const PAN = 0.15

/** Basılan tuşun işi; yoksa null. R tuşun yerine bakar: Rusça düzende de çalışsın. */
function actionOf(e, rotate, zoom) {
  if (rotate && e.code === "KeyR") return () => rotate(e.shiftKey ? -90 : 90)
  if (!zoom?.enabled) return null
  if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") return zoom.zoomIn
  if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") return zoom.zoomOut
  if (e.key === "0" || e.code === "Numpad0") return zoom.reset
  if (!zoom.zoomed) return null
  const f = zoom.frame()
  const step = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[
    e.key
  ]
  return step ? () => zoom.panBy(step[0] * f.width * PAN, step[1] * f.height * PAN) : null
}

/**
 * Işık kutusunun araç tuşları: R / Shift+R döndürür, + / − yakınlaştırır, 0 sığdırır; büyükken
 * oklar görseli kaydırır (1×'te oklar görsel değiştirir — o iş `ImageLightbox`ta, burada
 * işlenen tuşun varsayılanı engellenir, o da onu atlar). ⌘/Ctrl/Alt'lı tuşlara dokunulmaz
 * (⌘R sayfayı yeniler, ⌘+ tarayıcıyı büyütür). Dinleyici pencerenin kendisinde (`frameRef`in
 * içinde olduğu diyalog): odak hangi düğmede olursa olsun çalışır.
 */
export function useLightboxKeys(frameRef, { rotate, zoom }) {
  const latest = useRef({ rotate, zoom })
  useEffect(() => {
    latest.current = { rotate, zoom }
  })
  useEffect(() => {
    const host = frameRef.current?.closest("[role=dialog]")
    if (!host) return
    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const run = actionOf(e, latest.current.rotate, latest.current.zoom)
      if (!run) return
      e.preventDefault()
      run()
    }
    host.addEventListener("keydown", onKey)
    return () => host.removeEventListener("keydown", onKey)
  }, [frameRef])
}
