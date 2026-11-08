import { useEffect, useRef } from "react"
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import PauseIcon from "@hugeicons/core-free-icons/PauseIcon"
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon"
import { useLocale } from "@/hooks/useLocale"
import { FILLED } from "../radioStyles"
import { BIG_D, reachOf, slotFor, visibleRing } from "./stageModel"
import { StageVinyl } from "./StageVinyl"

const SPRING = { type: "spring", bounce: 0, duration: 0.5 }
// Bu kadar sürüklenince kaydırma sayılır (dokunuş değil); bir yuva ~ bu kadar piksel.
const DRAG_PX = 8
const STEP_PX = 110

/** Yuvanın hareket değerleri: yer ve boy, büyük halkanın kendi eninin yüzdesiyle. */
function place(offset, layout) {
  const s = slotFor(offset, layout)
  return {
    x: `${(s.x / BIG_D) * 100}%`,
    y: `${(s.y / BIG_D) * 100}%`,
    scale: s.d / BIG_D,
    opacity: s.opacity,
    zIndex: 5 - Math.min(4, Math.abs(offset)),
  }
}

/**
 * Sahnenin istasyon halkaları: ortada çalan (basınca çal/duraklat), solda önceki, sağda sonraki
 * (basınca o istasyona geçer); kenarlardaki küçük çiftler iki ve üç sonrası (`layout="row"`:
 * yatay kartta iki yanda giderek küçülen tek sıra, dört sonrasına kadar). İstasyon değişince
 * halkalar yaylı süzülür (bulundukları yerden, yarıda yakalanabilir). Yatay kaydırmak da geçer
 * (hızlı fiske birden çok); ok tuşları önceki/sonraki. Tek sekme durağı her halka için değil:
 * ortadaki ve iki yanındaki (küçükler fareyle ve dokunuşla).
 */
export function StageRing({ ring, index, radio, layout = "pairs", onToggle, onPick, onStep }) {
  const { t } = useLocale()
  const n = ring.length
  const drag = useMotionValue(0)
  const gesture = useRef(null)
  const box = useRef(null)
  // Ok tuşuyla geçince odak yeni ortadaki halkaya (eskisi yana kaydı).
  const follow = useRef(false)
  useEffect(() => {
    if (!follow.current) return
    follow.current = false
    box.current?.querySelector("[data-center]")?.focus({ preventScroll: true })
  }, [index])
  const swallow = useRef(false)
  const current = ring[index]
  const reach = reachOf(layout)
  const live = radio.station?.id === current?.id
  const state = !live
    ? "paused"
    : radio.status === "loading"
      ? "loading"
      : radio.status === "playing"
        ? "playing"
        : "paused"

  const end = (e) => {
    const g = gesture.current
    gesture.current = null
    if (!g?.moving) return
    const dx = e.clientX - g.x
    const v = dx / Math.max(1, performance.now() - g.t)
    // Hız mesafeye eklenir (fiske ileri atar), ama sıradan bir kaydırma tek istasyon.
    const steps = Math.max(-3, Math.min(3, -Math.round((dx + v * 80) / STEP_PX)))
    if (steps) onStep(steps)
    animate(drag, 0, SPRING)
  }

  return (
    <div
      ref={box}
      role="group"
      aria-label={t("widgets.radio.stations")}
      className="stage-ring"
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
        e.preventDefault()
        follow.current = true
        onStep(e.key === "ArrowLeft" ? -1 : 1)
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return
        swallow.current = false
        gesture.current = { x: e.clientX, y: e.clientY, t: performance.now(), moving: false }
      }}
      onPointerMove={(e) => {
        const g = gesture.current
        if (!g) return
        const dx = e.clientX - g.x
        if (!g.moving) {
          if (Math.abs(dx) < DRAG_PX || Math.abs(dx) < Math.abs(e.clientY - g.y)) return
          g.moving = true
          swallow.current = true
          e.currentTarget.setPointerCapture?.(e.pointerId)
        }
        // Parmağı izler ama yumuşak: halkalar yuvalarına göre yer değiştirir, şerit yalnız ipucu.
        drag.set(dx * 0.45)
      }}
      onPointerUp={end}
      onPointerCancel={end}
      // Kaydırmanın sonundaki tıklama halkayı çalmasın.
      onClickCapture={(e) => {
        if (!swallow.current) return
        swallow.current = false
        e.stopPropagation()
        e.preventDefault()
      }}
    >
      <motion.div className="stage-ring-track" style={{ x: drag }}>
        <AnimatePresence initial={false}>
          {visibleRing(index, n, reach + 1).map(({ index: j, offset }) => {
            const st = ring[j]
            const center = offset === 0
            const near = Math.abs(offset) <= 1
            const label = center
              ? t(state === "paused" ? "widgets.radio.playNamed" : "widgets.radio.pauseNamed", {
                  name: st.name,
                })
              : t("widgets.radio.playNamed", { name: st.name })
            return (
              <motion.button
                key={st.id}
                type="button"
                initial={false}
                animate={place(offset, layout)}
                exit={{ opacity: 0, scale: 0.2 }}
                transition={SPRING}
                tabIndex={near ? 0 : -1}
                aria-hidden={Math.abs(offset) > reach || undefined}
                aria-label={label}
                aria-current={center || undefined}
                data-center={center || undefined}
                data-state={center ? state : undefined}
                onClick={() => (center ? onToggle() : onPick(st))}
                className="stage-orb"
              >
                {/* Her halkada plak yapısı: kenara kayan eski ortadaki yavaşlayıp düz görsele döner. */}
                <StageVinyl station={st} />
                {center && <CenterFace state={state} />}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/** Ortadaki halkanın yüzü: duraklıyken oynat, çalarken üstüne gelince duraklat, bağlanırken halka. */
function CenterFace({ state }) {
  return (
    <>
      {state === "loading" && <span aria-hidden="true" className="stage-spin" />}
      <span aria-hidden="true" className="stage-play">
        <span>
          <HugeiconsIcon
            icon={state === "paused" ? PlayIcon : PauseIcon}
            className={`stage-play-icon ${FILLED}`}
            strokeWidth={2}
          />
        </span>
      </span>
    </>
  )
}
