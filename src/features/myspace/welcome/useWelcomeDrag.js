import { useCallback, useEffect, useRef } from "react"
import { animate, useMotionValue, useTransform } from "motion/react"
import { releaseVelocity, rubber, shouldDismiss } from "@/lib/gesture"

// Alt çekmecenin (`useSheetDrag`) yayları: aynı fizik, ters yön. Geri oturuş hafif esner,
// fırlatılan çekmece esnemez.
const SNAP = { type: "spring", stiffness: 438, damping: 34, restDelta: 0.4, restSpeed: 8 }
export const FLING = { type: "spring", stiffness: 300, damping: 35, restDelta: 1, restSpeed: 30 }
// Açılış ve düğmeyle kapanış: kuvvet uygulanmadı, sekme yok.
export const CALM = { type: "spring", bounce: 0, duration: 0.55 }
export const QUICK = { type: "spring", bounce: 0, duration: 0.34 }
const FADE = { duration: 0.2, ease: "easeOut" }
/** Parmak bu kadar (px) oynamadan sürükleme başlamaz: düğmeye dokunma bozulmaz. */
const SLOP = 6
/** Aşağı çekişte lastiğin varabileceği en çok pay (px). */
const RUBBER_MAX = 40
/** Kapanınca gölgesi de ekrandan çıksın. */
const OFF = 32

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
// Sürükleyerek kapatmanın kesinleştiği an kısa bir titreşim (destekleyen telefonda; iOS'ta yok).
const tick = () => {
  try {
    navigator.vibrate?.(8)
  } catch {
    // Tarayıcı titreşimi engelledi: dokunuşsuz sürer.
  }
}

/**
 * Yukarıdan inen karşılama çekmecesinin hareketi. `y` 0 (açık) → −boy (kapalı): basılıyken parmağı
 * 1:1 izler (motion değeri, yeniden çizim yok), aşağı çekiş lastiklenir; bırakınca hız ve mesafe
 * karar verir (`lib/gesture` › `shouldDismiss`, yön ters çevrilerek) ve yay parmağın hızıyla
 * sürer — sürerken yeniden tutulabilir. Sürükleme çekmecenin de karartının da her yerinden.
 * Azaltılmış harekette kayma yok: çekmece solar (`fade`), parmağı izleme kalır.
 *
 * Dönen: `y`, `fade`, `progress` (açıklık 0…1: karartı ve yazı ondan türer), `bind` (kök öğenin
 * olayları), `open()`, `close(hız, yay)`.
 */
export function useWelcomeDrag(panelRef, onClosed) {
  // İlk çizimde ekranın dışında: ölçülünce yukarıdan iner (kısa bir an açık görünmesin).
  const y = useMotionValue(-2000)
  const fade = useMotionValue(1)
  const size = useRef(1)
  const st = useRef({ id: null, startY: 0, base: 0, on: false, dragged: false, samples: [] })
  const anim = useRef(null)
  const closing = useRef(false)
  const done = useRef(onClosed)
  useEffect(() => {
    done.current = onClosed
  })
  useEffect(() => () => anim.current?.stop(), [])

  const measure = useCallback(() => {
    size.current = panelRef.current?.offsetHeight || 1
    return size.current
  }, [panelRef])

  const progress = useTransform(
    () => Math.min(1, Math.max(0, 1 + y.get() / size.current)) * fade.get(),
  )

  const run = useCallback((value, to, spec, velocity = 0, after) => {
    anim.current?.stop()
    anim.current = animate(value, to, { ...spec, velocity, onComplete: after })
  }, [])

  const finish = useCallback(() => done.current?.(), [])

  const close = useCallback(
    (velocity = 0, spec = CALM) => {
      if (closing.current) return
      closing.current = true
      if (reduced()) run(fade, 0, FADE, 0, finish)
      else run(y, -(measure() + OFF), spec, velocity, finish)
    },
    [fade, finish, measure, run, y],
  )

  const open = useCallback(() => {
    const h = measure()
    if (reduced()) {
      y.set(0)
      fade.set(0)
      run(fade, 1, FADE)
      return
    }
    y.set(-(h + OFF))
    run(y, 0, CALM)
  }, [fade, measure, run, y])

  const settle = useCallback(
    (v) => {
      const h = measure()
      // Yardımcı aşağıyı kapanış sayar: yukarı kapanan çekmecede konum ve hız çevrilir.
      if (shouldDismiss({ pos: -y.get(), v: -v, size: h })) {
        tick()
        close(v, FLING)
      } else if (reduced()) y.set(0)
      else run(y, 0, SNAP, v)
    },
    [close, measure, run, y],
  )

  const bind = {
    // Kaydırmayı tarayıcı yapmasın: sayfa çekmece açıkken kaymaz, sürükleme kesilmez.
    style: { touchAction: "none" },
    onPointerDown(e) {
      if ((e.pointerType === "mouse" && e.button !== 0) || closing.current) return
      const s = st.current
      s.id = e.pointerId
      s.startY = e.clientY
      s.samples = []
      s.dragged = false
      s.base = y.get()
      // Yay sürerken tutuldu: o anki konumdan devam.
      s.on = y.isAnimating()
      if (s.on) {
        anim.current?.stop()
        s.base = y.get()
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }
    },
    onPointerMove(e) {
      const s = st.current
      if (e.pointerId !== s.id) return
      const dy = e.clientY - s.startY
      if (!s.on) {
        if (Math.abs(dy) < SLOP) return
        s.on = true
        s.base = y.get() - dy
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }
      s.dragged = true
      const raw = s.base + dy
      y.set(raw <= 0 ? raw : rubber(raw, RUBBER_MAX))
      s.samples.push({ pos: raw, t: e.timeStamp })
      if (s.samples.length > 8) s.samples.shift()
    },
    onPointerUp(e) {
      const s = st.current
      if (e.pointerId !== s.id) return
      s.id = null
      if (!s.on) return
      s.on = false
      settle(releaseVelocity(s.samples, e.timeStamp))
    },
    onPointerCancel(e) {
      const s = st.current
      if (e.pointerId !== s.id) return
      s.id = null
      if (s.on) settle(0)
      s.on = false
    },
    // Sürüklemenin sonundaki tıklama düğmeye ya da karartıya ulaşmasın.
    onClickCapture(e) {
      if (!st.current.dragged) return
      st.current.dragged = false
      e.preventDefault()
      e.stopPropagation()
    },
  }

  return { y, fade, progress, bind, open, close }
}
