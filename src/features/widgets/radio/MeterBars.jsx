import { useEffect, useRef, useState } from "react"
import { readMeter, subscribeMeter } from "@/lib/radioMeter"
import { useRest } from "@/lib/restMode"
import { cn } from "@/lib/utils"
import { Equalizer } from "./radioParts"

// Gerçek veriye geçiş ve dönüş (kare): şarkı arasındaki kısa sessizlik dansı bozmasın.
const ON_FRAMES = 3
const OFF_FRAMES = 90
const BARS = [0, 1, 2, 3]

/**
 * Header'daki çubuklar MÜZİĞE GÖRE: bas · alt orta · üst orta · tiz (`radioMeter`). Her bant
 * kendi son birkaç saniyesine göre ölçeklenir (yavaş düşen tepe, yavaş yükselen taban): müzik
 * bantları hep yüksek seyrediyor, sabit ölçekte çubuklar tavana yapışıyordu. Ölçülemiyorsa
 * (Safari/Firefox, CORS'suz yayın, ilk an) `Equalizer`ın kendi dansı; çalmıyorken, sessizken ve
 * azaltılmış harekette alçak ve durgun. Çubuklar React'e uğramadan her karede (`transform`):
 * yumuşatma burada (CSS geçişi her karede yeni bir geçiş kurup atıyordu), değişmeyen çubuğa
 * yazılmaz. Dinlenme kipinde (`lib/restMode`) döngü durur, çubuklar yerinde kalır.
 */
export function MeterBars({ playing, className, bar }) {
  const box = useRef(null)
  const [real, setReal] = useState(false)
  const rest = useRest()
  useEffect(() => {
    if (!playing || rest || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      return undefined
    const unsubscribe = subscribeMeter()
    const out = new Float32Array(BARS.length)
    const peak = new Float32Array(BARS.length).fill(0.6)
    const floor = new Float32Array(BARS.length).fill(0.4)
    const shown = new Float32Array(BARS.length).fill(0.3)
    let raf = 0
    let on = 0
    let off = 0
    let live = false
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (readMeter(out)) {
        on++
        off = 0
      } else {
        off++
        on = 0
      }
      if (!live && on === ON_FRAMES) {
        live = true
        setReal(true)
      } else if (off === OFF_FRAMES) {
        live = false
        setReal(false)
      }
      const bars = live ? box.current?.children : null
      if (!bars) return
      for (let i = 0; i < bars.length; i++) {
        peak[i] = Math.max(out[i], peak[i] - 0.003)
        floor[i] = Math.min(out[i], floor[i] + 0.0015)
        const v = Math.min(1, Math.max(0, (out[i] - floor[i]) / Math.max(0.06, peak[i] - floor[i])))
        const next = shown[i] + (0.2 + 0.8 * v - shown[i]) * 0.5
        if (Math.abs(next - shown[i]) < 0.004) continue
        shown[i] = next
        bars[i].style.transform = `scaleY(${next.toFixed(3)})`
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      unsubscribe()
    }
  }, [playing, rest])

  if (!real || !playing) return <Equalizer playing={playing} className={className} bar={bar} />
  return (
    <span
      ref={box}
      aria-hidden="true"
      data-meter="live"
      className={cn("flex h-3.5 items-end gap-[2px]", className)}
    >
      {BARS.map((i) => (
        <span
          key={i}
          className={cn("h-full w-[3px] origin-bottom rounded-full", bar)}
          style={{ transform: "scaleY(0.3)" }}
        />
      ))}
    </span>
  )
}
