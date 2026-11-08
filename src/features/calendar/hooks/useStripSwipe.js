import { useCallback, useEffect, useRef } from "react"
import { animate } from "motion/react"
import { releaseVelocity, rubber, stripCommit } from "@/lib/gesture"

const SNAP = { type: "spring", stiffness: 420, damping: 38, restDelta: 0.4, restSpeed: 8 }
const SLOP = 8
const RUBBER_MAX = 72

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/**
 * Telefon hafta şeridinin yana kaydırması: şerit parmağı 1:1 izler (`translate`, yeniden çizim
 * yok); bırakınca hız + mesafe haftayı değiştirir. Değişirken eski hafta parmağın hızıyla dışarı
 * kayar, yenisi karşı yönden yayla gelir. Yay sürerken tutulursa anlık konumdan devam edilir.
 * Genişliğin ötesi lastikli. Hareketi azalt: kayma yok, hafta anında değişir.
 * `ref` şeride bağlanır; `bind` olay dinleyicileri; `onSwipe(dir)`: +1 sonraki, -1 önceki.
 */
export function useStripSwipe(onSwipe) {
  const ref = useRef(null)
  const swipe = useRef(onSwipe)
  useEffect(() => {
    swipe.current = onSwipe
  })
  const st = useRef({ x: 0, id: null, startX: 0, base: 0, on: false, samples: [], anim: null })
  useEffect(() => () => st.current.anim?.stop(), [])

  const paint = useCallback((x) => {
    st.current.x = x
    if (ref.current) ref.current.style.translate = x ? `${x}px 0` : ""
  }, [])

  const run = useCallback(
    (to, velocity, done) => {
      const s = st.current
      s.anim?.stop()
      s.anim = animate(s.x, to, {
        ...SNAP,
        velocity,
        onUpdate: paint,
        onComplete: () => {
          s.anim = null
          done?.()
        },
      })
    },
    [paint],
  )

  const settle = useCallback(
    (v) => {
      const el = ref.current
      const size = el?.offsetWidth || 360
      const commit = stripCommit({ pos: st.current.x, v, size })
      if (!commit) return run(0, v)
      run(-commit * size, v, () => {
        swipe.current?.(commit)
        // Yeni hafta işlenene dek eski şerit dışarıda kalır; sonra karşı yönden yerine oturur.
        paint(commit * size)
        requestAnimationFrame(() => requestAnimationFrame(() => run(0, 0)))
      })
    },
    [paint, run],
  )

  const bind = {
    onPointerDown: (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      const s = st.current
      s.id = e.pointerId
      s.startX = e.clientX
      s.samples = []
      s.on = false
      s.base = 0
      if (s.anim) {
        s.anim.stop()
        s.anim = null
        s.on = true
        s.base = s.x
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }
    },
    onPointerMove: (e) => {
      const s = st.current
      if (e.pointerId !== s.id) return
      const dx = e.clientX - s.startX
      if (!s.on) {
        if (Math.abs(dx) < SLOP) return
        s.on = true
        s.base = s.x
        if (!reduced()) e.currentTarget.setPointerCapture?.(e.pointerId)
      }
      const raw = s.base + (e.clientX - s.startX)
      s.samples.push({ pos: raw, t: e.timeStamp })
      if (s.samples.length > 8) s.samples.shift()
      if (reduced()) return
      const size = ref.current?.offsetWidth || 360
      const over = Math.abs(raw) - size
      paint(over > 0 ? Math.sign(raw) * (size + rubber(over, RUBBER_MAX)) : raw)
    },
    onPointerUp: (e) => {
      const s = st.current
      if (e.pointerId !== s.id) return
      s.id = null
      if (!s.on) return
      s.on = false
      const v = releaseVelocity(s.samples, e.timeStamp)
      if (reduced()) {
        const size = ref.current?.offsetWidth || 360
        const last = s.samples[s.samples.length - 1]?.pos ?? 0
        const commit = stripCommit({ pos: last, v, size })
        if (commit) swipe.current?.(commit)
        return
      }
      settle(v)
    },
    onPointerCancel: (e) => {
      const s = st.current
      if (e.pointerId !== s.id) return
      s.id = null
      if (s.on && !reduced()) settle(0)
      s.on = false
    },
  }
  return { ref, bind }
}
