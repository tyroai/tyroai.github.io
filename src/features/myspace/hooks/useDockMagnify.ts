import { useEffect, type RefObject } from "react"
import { dockTarget, springStep } from "../lib/dockMagnify"

// Simge 14 px, öneri 30 px: 1,5 katında simge önerinin kutusundan taşmaz (alttan büyür).
const PEAK = 1.5
const DISTANCE = 210
const ICON = 14
// Büyüyen simge yazıya yaslanmasın: yazı fazlanın bu kadarı kadar yana çekilir.
const NUDGE = 0.3

type State = { scale: number; velocity: number; drawn: number }

/**
 * Öneri sırasına Dock büyümesi (yalnız fare ve klavye odağı). Değerler doğrudan `transform`a
 * yazılır, React durumu yok; yay durulunca döngü kendiliğinden biter. Azaltılmış harekette kapalı.
 */
export function useDockMagnify(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const root = ref.current
    if (!root || !enabled) return undefined
    const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)")
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (!fine?.matches || reduce?.matches) return undefined

    const states = new Map<HTMLElement, State>()
    let nodes: HTMLElement[] = []
    let centers: number[] = []
    let focus: number | null = null
    let raf = 0
    let last = 0
    const rtl = () => getComputedStyle(root).direction === "rtl"

    const measure = () => {
      nodes = Array.from(root.children) as HTMLElement[]
      centers = nodes.map((n) => {
        const r = n.getBoundingClientRect()
        return r.left + r.width / 2
      })
    }

    const draw = (node: HTMLElement, scale: number, sign: number) => {
      const icon = node.querySelector("svg")
      const text = node.querySelector("span")
      const rest = scale === 1
      if (icon) icon.style.transform = rest ? "" : `scale(${scale.toFixed(4)})`
      if (text) {
        const dx = sign * ICON * (scale - 1) * NUDGE
        text.style.transform = rest ? "" : `translateX(${dx.toFixed(2)}px)`
      }
    }

    const tick = (now: number) => {
      raf = 0
      const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000))
      last = now
      const steps = Math.max(1, Math.ceil(dt * 240))
      const sign = rtl() ? -1 : 1
      let moving = false
      nodes.forEach((node, i) => {
        let s = states.get(node)
        if (!s) states.set(node, (s = { scale: 1, velocity: 0, drawn: 1 }))
        const target = dockTarget(centers[i], focus, PEAK, DISTANCE)
        for (let k = 0; k < steps; k++) {
          ;[s.scale, s.velocity] = springStep(s.scale, s.velocity, target, dt / steps)
        }
        if (Math.abs(s.velocity) < 0.002 && Math.abs(target - s.scale) < 0.001) {
          s.scale = target
          s.velocity = 0
        } else moving = true
        if (s.scale === s.drawn) return
        s.drawn = s.scale
        draw(node, s.scale, sign)
      })
      if (moving) raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const point = (x: number) => {
      measure()
      focus = x
      wake()
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") point(e.clientX)
    }
    const release = () => {
      if (focus === null) return
      focus = null
      wake()
    }
    // Klavyeyle gezerken odaktaki öneri büyür (Dock'taki gibi).
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (el.parentElement !== root || !el.matches(":focus-visible")) return
      const r = el.getBoundingClientRect()
      point(r.left + r.width / 2)
    }

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", release)
    root.addEventListener("focusin", onFocus)
    root.addEventListener("focusout", release)
    return () => {
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", release)
      root.removeEventListener("focusin", onFocus)
      root.removeEventListener("focusout", release)
      cancelAnimationFrame(raf)
      nodes.forEach((n) => draw(n, 1, 1))
    }
  }, [ref, enabled])
}
