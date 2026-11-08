import { useEffect, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { setRadioVolume } from "@/lib/radioPlayer"
import { PCT } from "../radioStyles"
import { CARD_W, DIAL, clamp01, dialRotation, dragValue, tapValue, tickValue } from "./stageModel"

const TICKS = Array.from({ length: DIAL.ticks }, (_, i) => i)
const TOP = DIAL.cy - DIAL.r
// Kadranın şeridi: tasarımın alt 80 birimi (çentikler, gösterge, alt işaret); kartın her boyunda
// aynı oranda, altta ortalı (`stage.css` › `.stage-dial`).
const BAND = "0 316 360 80"
// Değer bu kadar süre görünür kalır (dokunuş, tuş, tekerlek); sürüklerken sürekli.
const SHOW_MS = 1100
const KEY_STEP = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05 }

/**
 * SES KADRANI — kartın altındaki yay (iOS kamerasının yakınlaştırma kadranı gibi): çentikler bir
 * yayda, ortadaki beyaz gösterge sabit, kadran döner. Kadranı yana çekmek sesi değiştirir
 * (çentikler parmakla gider: sola çekmek açar), bir çentiğe dokunmak oraya götürür, tekerlek ve
 * ok tuşları da. Göstergenin solundaki çentikler (ses düzeyi kadarı) parlak. Değer göstergenin
 * üstünde, yalnız değişirken. Erişilebilirlikte `slider` (0–100, yüzde dilin biçiminde). Şerit hem
 * çizim hem dokunma alanı: sürüklemenin birimi şeridin eninden (tasarımın 360 birimi).
 */
export function StageDial({ radio }) {
  const { t, locale } = useLocale()
  const level = radio.muted ? 0 : clamp01(radio.volume)
  const shown = getNumberFormat(locale, PCT).format(level)
  const [dragging, setDragging] = useState(false)
  const [flash, setFlash] = useState(false)
  const timer = useRef(0)
  const press = useRef(null)
  const hit = useRef(null)

  const set = (v) => {
    setRadioVolume(clamp01(v))
    setFlash(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setFlash(false), SHOW_MS)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  // Tekerlek sayfayı kaydırmasın: pasif olmayan dinleyici (React'in onWheel'i pasif).
  const levelRef = useRef(level)
  useEffect(() => {
    levelRef.current = level
  }, [level])
  useEffect(() => {
    const el = hit.current
    if (!el) return undefined
    const onWheel = (e) => {
      e.preventDefault()
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : -e.deltaY
      set(levelRef.current + d * 0.0012)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const unitsOf = (el) => CARD_W / Math.max(1, el.getBoundingClientRect().width)

  return (
    <div
      ref={hit}
      role="slider"
      tabIndex={0}
      aria-label={t("widgets.radio.volume")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(level * 100)}
      aria-valuetext={shown}
      data-show={dragging || flash || undefined}
      className="stage-dial"
      onKeyDown={(e) => {
        const step = KEY_STEP[e.key]
        const page = e.key === "PageUp" ? 0.1 : e.key === "PageDown" ? -0.1 : 0
        let next = null
        if (step) next = level + step
        else if (page) next = level + page
        else if (e.key === "Home") next = 0
        else if (e.key === "End") next = 1
        if (next == null) return
        e.preventDefault()
        set(next)
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return
        e.currentTarget.setPointerCapture?.(e.pointerId)
        press.current = {
          x: e.clientX,
          start: level,
          units: unitsOf(e.currentTarget),
          moved: false,
        }
      }}
      onPointerMove={(e) => {
        const p = press.current
        if (!p) return
        const dx = (e.clientX - p.x) * p.units
        if (!p.moved && Math.abs(dx) < 3) return
        if (!p.moved) {
          p.moved = true
          setDragging(true)
        }
        set(dragValue(p.start, dx))
      }}
      onPointerUp={(e) => {
        const p = press.current
        press.current = null
        setDragging(false)
        if (!p || p.moved) return
        // Dokunuş: göstergeden uzaklık kadar öteki çentik.
        const r = e.currentTarget.getBoundingClientRect()
        set(tapValue(level, (e.clientX - (r.left + r.width / 2)) * p.units))
      }}
      onPointerCancel={() => {
        press.current = null
        setDragging(false)
      }}
    >
      <svg viewBox={BAND} aria-hidden="true" className="stage-dial-svg">
        <g
          className="stage-ticks"
          data-dragging={dragging || undefined}
          style={{ transform: `rotate(${dialRotation(level)}deg)` }}
        >
          {TICKS.map((i) => (
            <line
              key={i}
              x1={DIAL.cx}
              y1={TOP}
              x2={DIAL.cx}
              y2={TOP + DIAL.tick}
              transform={`rotate(${i * DIAL.step} ${DIAL.cx} ${DIAL.cy})`}
              className="stage-tick"
              data-lit={tickValue(i) <= level + 1e-6 || undefined}
            />
          ))}
        </g>
        <rect
          x={DIAL.cx - 1.5}
          y={TOP - 2}
          width="3"
          height={DIAL.tick + 4}
          rx="1.5"
          className="stage-needle"
        />
        <line x1={DIAL.cx} y1="381" x2={DIAL.cx} y2="396" className="stage-mark" />
      </svg>
      <span aria-hidden="true" className="stage-dial-value">
        {shown}
      </span>
    </div>
  )
}
