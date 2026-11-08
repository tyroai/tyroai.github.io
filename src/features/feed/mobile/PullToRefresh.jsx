import { useEffect, useRef, useState } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"

const THRESHOLD = 64
const MAX = 96
// Yenilenirken çark çentiğin (22 px) altında durur.
const REST = 74

/**
 * Aşağı çekip yenile (dokunmatik): sayfanın en üstünde parmak aşağı çekilince çark iner,
 * eşiği geçip bırakınca `onRefresh` (Yenile düğmesinin işi; sonucu bildirim söyler). İş sürerken
 * (`busy`, menüden de başlasa) çark döner. Yatay kaydırma (çipler, hikâyeler) çekme sayılmaz.
 * Durum bu bileşende: parmak hareketi sayfayı yeniden çizmez. Çark süs: `aria-hidden`.
 */
export function PullToRefresh({ scrollerRef, onRefresh, busy }) {
  const coarse = useMediaQuery("(pointer: coarse)")
  const [pull, setPull] = useState(0)
  const refresh = useRef(onRefresh)
  useEffect(() => {
    refresh.current = onRefresh
  })

  useEffect(() => {
    const el = scrollerRef.current
    if (!coarse || !el) return undefined
    let start = null
    let dir = null
    let dist = 0
    const down = (e) => {
      start =
        el.scrollTop <= 0 && e.touches.length === 1
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : null
      dir = null
      dist = 0
    }
    const move = (e) => {
      if (!start) return
      const dx = e.touches[0].clientX - start.x
      const dy = e.touches[0].clientY - start.y
      if (!dir) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        dir = dy > 0 && Math.abs(dy) > Math.abs(dx) ? "pull" : "other"
      }
      if (dir !== "pull" || el.scrollTop > 0) return
      // Tarayıcının kendi esneme/yenileme hareketi değil, bizimki.
      if (e.cancelable) e.preventDefault()
      dist = Math.min(MAX, dy * 0.5)
      setPull(dist)
    }
    const up = () => {
      if (dir === "pull" && dist >= THRESHOLD) refresh.current?.()
      start = null
      dir = null
      dist = 0
      setPull(0)
    }
    el.addEventListener("touchstart", down, { passive: true })
    el.addEventListener("touchmove", move, { passive: false })
    el.addEventListener("touchend", up)
    el.addEventListener("touchcancel", up)
    return () => {
      el.removeEventListener("touchstart", down)
      el.removeEventListener("touchmove", move)
      el.removeEventListener("touchend", up)
      el.removeEventListener("touchcancel", up)
    }
  }, [coarse, scrollerRef])

  if (!coarse) return null
  const y = busy && !pull ? REST : pull
  const progress = Math.min(1, pull / THRESHOLD)
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
      style={{
        transform: `translateY(${y}px)`,
        opacity: busy || pull > 0 ? 1 : 0,
        transition: pull ? "none" : "transform 0.25s ease-out, opacity 0.2s",
      }}
    >
      <span className="-mt-11 grid size-9 place-items-center rounded-full bg-card shadow-md ring-1 ring-border">
        <svg
          viewBox="0 0 24 24"
          className={cn("size-5 text-brand", busy && "animate-spin motion-reduce:animate-none")}
          style={busy ? undefined : { transform: `rotate(${progress * 270}deg)` }}
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="2.5"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${busy ? 14 : Math.max(2, progress * 42)} 57`}
          />
        </svg>
      </span>
    </div>
  )
}
