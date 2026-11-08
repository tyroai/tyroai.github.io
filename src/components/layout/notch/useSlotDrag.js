import { useEffect, useRef, useState } from "react"
import { useMotionValue } from "motion/react"

// Basılı tutup bu kadar kayınca sürükleme başlar: altındaki tıklama (ekle) bozulmasın.
const THRESHOLD = { mouse: 4, pen: 4, touch: 6 }
// Yuva şeridinin çevresinde bırakmayı hâlâ şeride sayan pay (px): parmak şeridin kenarını örter.
const SLACK = 16

/**
 * Yuva seçicisinin sürüklemesi — fare, kalem ve dokunmatik TEK yoldan (Pointer Events; HTML5
 * sürüklemesi dokunmatikte yok). Hayalet `x`/`y` motion değeriyle izler: kare başına React durumu
 * yok, durum yalnız hedef yuva değişince güncellenir. Şerit `[data-wells]`, yuvalar `[data-well]`;
 * hedef işaretçiye yatayda en yakın yuva. `onDrop({ id, from, index, outside })`.
 */
export function useSlotDrag(onDrop) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [drag, setDrag] = useState(null)
  const live = useRef(null)
  const dropRef = useRef(onDrop)
  const lastEnd = useRef(0)
  const cleanup = useRef(null)
  useEffect(() => {
    dropRef.current = onDrop
  })
  useEffect(() => () => cleanup.current?.(), [])

  function target(px, py) {
    const strip = document.querySelector("[data-wells]")
    const r = strip?.getBoundingClientRect()
    const inside =
      r &&
      px >= r.left - SLACK &&
      px <= r.right + SLACK &&
      py >= r.top - SLACK &&
      py <= r.bottom + SLACK
    if (!inside) return { index: null, outside: true }
    let best = null
    for (const el of strip.querySelectorAll("[data-well]")) {
      const b = el.getBoundingClientRect()
      const d = Math.abs(px - (b.left + b.width / 2))
      if (!best || d < best.d) best = { d, index: Number(el.dataset.well) }
    }
    return { index: best?.index ?? null, outside: false }
  }

  /** `from`: "well" (çentikteki) ya da "list" (eklenebilen). */
  function begin(e, id, from) {
    if (e.pointerType === "mouse" && e.button !== 0) return
    const sx = e.clientX
    const sy = e.clientY
    const need = THRESHOLD[e.pointerType] ?? 4
    let started = false

    const move = (ev) => {
      if (ev.pointerId !== e.pointerId) return
      if (!started) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < need) return
        started = true
      }
      ev.preventDefault()
      x.set(ev.clientX)
      y.set(ev.clientY)
      const at = target(ev.clientX, ev.clientY)
      const prev = live.current
      if (prev && prev.index === at.index && prev.outside === at.outside) return
      live.current = { id, from, ...at }
      setDrag(live.current)
    }
    const end = (ev) => {
      if (ev.pointerId !== e.pointerId) return
      stop()
      if (!started) return
      lastEnd.current = performance.now()
      const done = live.current
      live.current = null
      setDrag(null)
      if (ev.type === "pointerup" && done) dropRef.current(done)
    }
    const stop = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", end)
      cleanup.current = null
    }
    cleanup.current?.()
    cleanup.current = stop
    window.addEventListener("pointermove", move, { passive: false })
    window.addEventListener("pointerup", end)
    window.addEventListener("pointercancel", end)
  }

  // Sürükleme biter bitmez gelen tıklama ekleme/çıkarma sayılmasın.
  const justDragged = () => performance.now() - lastEnd.current < 250
  return { drag, x, y, begin, justDragged }
}
