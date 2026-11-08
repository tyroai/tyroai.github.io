import { useEffect, useRef, useState } from "react"

/** Basılı tutma bu süreden sonra duraklatma sayılır (dokunuş değil). */
const HOLD_MS = 220
/** Bu kadar kayan basış dokunuş değil, sürüklemedir. */
const SLOP = 10
/** Yana kaydırma bu kadar gidince hikâye geçer. */
const SWIPE = 48
/** Aşağı çekme bu kadar gidince görüntüleyici kapanır. */
const DISMISS = 96

/**
 * Hikâye görüntüleyicisinin dokunma hareketleri (Instagram): kısa dokunuş bölgenin düğmesine
 * bırakılır (önceki / sonraki — klavyedeki Enter de aynı yoldan), basılı tutmak duraklatır,
 * yana kaydırmak geçer, aşağı çekmek (`onClose` verildiyse) kartı parmakla indirip kapatır.
 * Hareketten sonra gelen tıklama yutulur: bir kaydırma ayrıca "sonraki" saymasın.
 * Dönen `bind` iki bölge düğmesine yayılır; `held` süreyi durdurur.
 */
export function useStoryGestures({ cardRef, onPrev, onNext, onClose }) {
  const [held, setHeld] = useState(false)
  const g = useRef(null)
  const swallow = useRef(false)

  useEffect(() => () => clearTimeout(g.current?.timer), [])

  // Tıklama pointerup'ın hemen ardından gelir; gelmezse işaret bir sonraki dokunuşu yutmasın.
  const swallowNextClick = () => {
    swallow.current = true
    setTimeout(() => {
      swallow.current = false
    }, 0)
  }
  const settle = () => {
    const el = cardRef.current
    if (!el) return
    el.style.transform = ""
    el.style.opacity = ""
  }
  const onPointerDown = (e) => {
    if (e.button !== 0) return
    clearTimeout(g.current?.timer)
    const timer = setTimeout(() => {
      if (!g.current) return
      g.current.held = true
      setHeld(true)
    }, HOLD_MS)
    g.current = { x: e.clientX, y: e.clientY, timer, held: false, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    const s = g.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.moved && Math.hypot(dx, dy) > SLOP) {
      s.moved = true
      clearTimeout(s.timer)
    }
    const el = cardRef.current
    if (onClose && s.moved && dy > 0 && dy > Math.abs(dx) && el) {
      el.style.transform = `translateY(${dy}px)`
      el.style.opacity = String(Math.max(0.4, 1 - dy / 600))
    }
  }
  const onPointerUp = (e) => {
    const s = g.current
    g.current = null
    if (!s) return
    clearTimeout(s.timer)
    if (s.held) {
      setHeld(false)
      swallowNextClick()
      return
    }
    if (!s.moved) return
    swallowNextClick()
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    settle()
    if (onClose && dy > DISMISS && dy > Math.abs(dx)) onClose()
    else if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? onNext : onPrev)()
  }
  const onPointerCancel = () => {
    clearTimeout(g.current?.timer)
    g.current = null
    setHeld(false)
    settle()
  }
  /** Bölgenin tıklaması: hareketin ardından geldiyse yutulur, değilse `action` çalışır. */
  const tap = (action) => () => {
    if (!swallow.current) action()
  }

  return {
    held,
    tap,
    bind: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  }
}
