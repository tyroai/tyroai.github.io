import { useRef } from "react"

// Bu kadar sürüklenince kaydırma sayılır (dokunuş değil); bu kadar ya da hızlı fiske bir istasyon.
const DRAG_PX = 8
const STEP_PX = 40

/**
 * Kartı yana kaydırmak istasyon değiştirir: sola sonraki, sağa önceki; her kaydırma tek istasyon
 * (kartta tek istasyon görünür, atlanan görünmezdi). Kaydırmanın sonundaki tıklama çalmaz.
 */
export function useSwipeStep(onStep) {
  const gesture = useRef(null)
  const swallow = useRef(false)
  const end = (e) => {
    const g = gesture.current
    gesture.current = null
    if (!g?.moving) return
    const dx = e.clientX - g.x
    const v = dx / Math.max(1, performance.now() - g.t)
    if (Math.abs(dx + v * 80) >= STEP_PX) onStep(dx < 0 ? 1 : -1)
  }
  return {
    onPointerDown(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return
      swallow.current = false
      gesture.current = { x: e.clientX, y: e.clientY, t: performance.now(), moving: false }
    },
    onPointerMove(e) {
      const g = gesture.current
      if (!g || g.moving) return
      const dx = e.clientX - g.x
      if (Math.abs(dx) < DRAG_PX || Math.abs(dx) < Math.abs(e.clientY - g.y)) return
      g.moving = true
      swallow.current = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
    },
    onPointerUp: end,
    onPointerCancel: end,
    onClickCapture(e) {
      if (!swallow.current) return
      swallow.current = false
      e.stopPropagation()
      e.preventDefault()
    },
  }
}
