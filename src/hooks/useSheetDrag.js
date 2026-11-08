import { useCallback, useEffect, useRef } from "react"
import { animate } from "motion/react"
import { releaseVelocity, rubber, shouldDismiss } from "@/lib/gesture"

/** Çekmece yayı: sönümlü, geri oturuşta hafif esneme (Apple çekmece: 0.8 / 0.3 sn). */
const SNAP = { type: "spring", stiffness: 438, damping: 34, restDelta: 0.4, restSpeed: 8 }
/** Kapanış yayı: aşağı fırlayan çekmece geri esnemez (kritik sönüm). */
const FLING = { type: "spring", stiffness: 300, damping: 35, restDelta: 1, restSpeed: 30 }
/** Parmak bu kadar (px) oynamadan sürükleme başlamaz: dokunma (kapat düğmesi) bozulmaz. */
const SLOP = 6
/** Yukarı çekişte lastiğin varabileceği en çok pay (px). */
const RUBBER_MAX = 40

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/**
 * Alt çekmece tutamağı/başlığı için sürükleyerek kapatma. Çekmece parmağı 1:1 izler (DOM'a doğrudan
 * `translate`, yeniden çizim yok); bırakınca hız + mesafe karar verir ve yay, parmağın hızıyla
 * bulunduğu yerden sürer. Yay sürerken yeniden tutulabilir: yeni sürükleme anlık konumdan başlar.
 * Yukarı çekiş üstte lastiklenir. Kapanışta Radix'in CSS çıkışı atlanır (çekmece zaten dışarıda).
 * Dönüş: `contentRef` (SheetContent'e), `overlayRef` (karartıya), `grip` (tutamak bölgesi olayları).
 */
export function useSheetDrag(onDismiss) {
  const content = useRef(null)
  const overlay = useRef(null)
  const state = useRef({
    y: 0,
    id: null,
    startY: 0,
    base: 0,
    on: false,
    samples: [],
    anim: null,
    running: false,
  })
  const dismiss = useRef(onDismiss)
  useEffect(() => {
    dismiss.current = onDismiss
  })
  useEffect(() => () => state.current.anim?.stop(), [])
  // Çekmece her açılışta yeni öğedir: önceki sürüşün konumu ve yayı taşınmasın.
  const contentRef = useCallback((el) => {
    const s = state.current
    s.anim?.stop()
    Object.assign(s, { y: 0, running: false, anim: null, on: false, id: null })
    content.current = el
  }, [])
  const overlayRef = useCallback((el) => {
    overlay.current = el
  }, [])

  const paint = useCallback((y) => {
    const el = content.current
    if (!el) return
    const s = state.current
    s.y = y
    el.style.translate = y ? `0 ${y}px` : ""
    // Yukarı lastikte alt kenarda açılan boşluğu çekmece rengiyle kapat.
    el.style.boxShadow = y < 0 ? "0 80px 0 0 var(--background)" : ""
    const o = overlay.current
    if (o) o.style.opacity = y > 0 ? String(Math.max(0, 1 - y / (el.offsetHeight * 1.1))) : ""
  }, [])

  const run = useCallback(
    (to, velocity, spec, done) => {
      const s = state.current
      s.anim?.stop()
      s.running = true
      s.anim = animate(s.y, to, {
        ...spec,
        velocity,
        onUpdate: paint,
        onComplete: () => {
          s.running = false
          done?.()
        },
      })
    },
    [paint],
  )

  const settle = useCallback(
    (v) => {
      const el = content.current
      const s = state.current
      if (!el) return
      const size = el.offsetHeight
      if (!shouldDismiss({ pos: s.y, v, size })) {
        if (reduced()) paint(0)
        else run(0, v, SNAP)
        return
      }
      const close = () => {
        el.style.animationName = "none"
        if (overlay.current) overlay.current.style.animationName = "none"
        dismiss.current?.()
        // Üst bileşen kapatmayı reddederse (kirli form) çekmece geri gelir.
        setTimeout(() => {
          if (!el.isConnected || el.dataset.state !== "open") return
          el.style.animationName = ""
          if (overlay.current) overlay.current.style.animationName = ""
          run(0, 0, SNAP)
        }, 80)
      }
      if (reduced()) close()
      else run(size + 48, v, FLING, close)
    },
    [paint, run],
  )

  const grip = {
    // Dokunmatik ekran bu bölgede kaydırmayı tarayıcıya bırakmaz; yoksa pointercancel gelir.
    style: { touchAction: "none" },
    onPointerDown: (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      const s = state.current
      s.id = e.pointerId
      s.startY = e.clientY
      s.on = false
      s.samples = []
      // Yay sürerken tutuldu: o anki konumdan devam (animasyon DURMADAN okunur).
      if (s.running) {
        s.anim.stop()
        s.running = false
        s.on = true
        s.base = s.y
        e.currentTarget.setPointerCapture?.(e.pointerId)
      } else {
        s.base = 0
      }
    },
    onPointerMove: (e) => {
      const s = state.current
      if (e.pointerId !== s.id) return
      const dy = e.clientY - s.startY
      if (!s.on) {
        if (Math.abs(dy) < SLOP) return
        s.on = true
        s.base = s.y
        if (content.current) content.current.style.transition = "none"
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }
      const raw = s.base + (e.clientY - s.startY)
      paint(raw >= 0 ? raw : -rubber(-raw, RUBBER_MAX))
      s.samples.push({ pos: raw, t: e.timeStamp })
      if (s.samples.length > 8) s.samples.shift()
    },
    onPointerUp: (e) => {
      const s = state.current
      if (e.pointerId !== s.id) return
      s.id = null
      if (!s.on) return
      s.on = false
      settle(releaseVelocity(s.samples, e.timeStamp))
    },
    onPointerCancel: (e) => {
      const s = state.current
      if (e.pointerId !== s.id) return
      s.id = null
      if (s.on) settle(0)
      s.on = false
    },
  }
  return { contentRef, overlayRef, grip }
}
