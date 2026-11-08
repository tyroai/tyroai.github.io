import { useCallback, useEffect, useRef } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
import { animate } from "motion/react"
import type { AnimationPlaybackControls } from "motion/react"
import { releaseVelocity, rubber, shouldDismiss } from "@/lib/gesture"

/** Alt çekmeceyle aynı yaylar (`useSheetDrag`): geri oturuş ve kapanış. */
const SNAP = { type: "spring", stiffness: 438, damping: 34, restDelta: 0.4, restSpeed: 8 } as const
const FLING = { type: "spring", stiffness: 300, damping: 35, restDelta: 1, restSpeed: 30 } as const
/** Parmak bu kadar (px) oynamadan sürükleme başlamaz. */
const SLOP = 6
/** Sola (açık yöne) çekişte lastiğin en çok payı (px). */
const RUBBER_MAX = 24
/** Sol kenardaki tutma şeridi (px): iOS'un geri kaydırma bölgesi kadar. */
const EDGE = 20

type Sample = { pos: number; t: number }
type State = {
  x: number
  id: number | null
  startX: number
  base: number
  on: boolean
  samples: Sample[]
  anim: AnimationPlaybackControls | null
  running: boolean
}

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/**
 * Sağdan açılan tam ekran telefon paneli (To-Do ayrıntısı, posta okuyucu) için iOS'taki gibi sol
 * kenardan sağa kaydırıp kapatma. `useSheetDrag`in yatay eşi: panel parmağı 1:1 izler (DOM'a doğrudan
 * `translate`, yeniden çizim yok), bırakınca hız + mesafe karar verir, yay bulunduğu yerden sürer.
 * Ayrı dosya: alt çekmece ilk pakette, bu yalnız tembel panellerde yüklenir.
 * Dönüş: `contentRef` (SheetContent'e), `overlayRef` (karartıya), `edge` (sol kenar şeridinin özellikleri).
 */
export function useEdgeSwipe(onDismiss: () => void) {
  const content = useRef<HTMLElement | null>(null)
  const overlay = useRef<HTMLElement | null>(null)
  const state = useRef<State>({
    x: 0,
    id: null,
    startX: 0,
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
  const contentRef = useCallback((el: HTMLElement | null) => {
    const s = state.current
    s.anim?.stop()
    Object.assign(s, { x: 0, running: false, anim: null, on: false, id: null })
    content.current = el
  }, [])
  const overlayRef = useCallback((el: HTMLElement | null) => {
    overlay.current = el
  }, [])

  const paint = useCallback((x: number) => {
    const el = content.current
    if (!el) return
    state.current.x = x
    el.style.translate = x ? `${x}px 0` : ""
    const o = overlay.current
    if (o) o.style.opacity = x > 0 ? String(Math.max(0, 1 - x / el.offsetWidth)) : ""
  }, [])

  const run = useCallback(
    (to: number, velocity: number, spec: typeof SNAP | typeof FLING, done?: () => void) => {
      const s = state.current
      s.anim?.stop()
      s.running = true
      s.anim = animate(s.x, to, {
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

  const settle = (v: number) => {
    const el = content.current
    const s = state.current
    if (!el) return
    const size = el.offsetWidth
    if (!shouldDismiss({ pos: s.x, v, size })) {
      if (reduced()) paint(0)
      else run(0, v, SNAP)
      return
    }
    const close = () => {
      // Panel zaten dışarıda: Radix'in CSS çıkışı ikinci kez kaydırmasın.
      el.style.animationName = "none"
      if (overlay.current) overlay.current.style.animationName = "none"
      dismiss.current?.()
    }
    if (reduced()) close()
    else run(size + 24, v, FLING, close)
  }

  const edge = {
    "aria-hidden": true as const,
    "data-edge-swipe": "",
    // Fiziksel sol kenar: panel her dilde sağdan açılır. Dikey kaydırma bu şeritte yok, bilerek.
    style: {
      position: "absolute",
      insetBlock: 0,
      left: 0,
      width: EDGE,
      zIndex: 10,
      touchAction: "none",
    } satisfies CSSProperties,
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse") return
      const s = state.current
      s.id = e.pointerId
      s.startX = e.clientX
      s.on = false
      s.samples = []
      if (s.running) {
        s.anim?.stop()
        s.running = false
        s.on = true
        s.base = s.x
        e.currentTarget.setPointerCapture?.(e.pointerId)
      } else s.base = 0
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const s = state.current
      if (e.pointerId !== s.id) return
      const dx = e.clientX - s.startX
      if (!s.on) {
        if (Math.abs(dx) < SLOP) return
        s.on = true
        s.base = s.x
        if (content.current) content.current.style.transition = "none"
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }
      const raw = s.base + dx
      paint(raw >= 0 ? raw : -rubber(-raw, RUBBER_MAX))
      s.samples.push({ pos: raw, t: e.timeStamp })
      if (s.samples.length > 8) s.samples.shift()
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      const s = state.current
      if (e.pointerId !== s.id) return
      s.id = null
      if (!s.on) return
      s.on = false
      settle(releaseVelocity(s.samples, e.timeStamp))
    },
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => {
      const s = state.current
      if (e.pointerId !== s.id) return
      s.id = null
      if (s.on) settle(0)
      s.on = false
    },
  }
  return { contentRef, overlayRef, edge }
}
