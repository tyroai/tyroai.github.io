import "@/lib/i18n/tour"
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, useReducedMotion } from "motion/react"
import { bringIntoView, holesOf, placeCard, resolveTargets } from "./tourGeometry"
import { TourCard } from "./TourCard"

/**
 * Sayfa turunun koşucusu — karartma + delikler + kart; `Tour` yalnız tur açılınca yükler.
 * ⚠️ **SAYFA TUR SÜRERKEN `inert`** (`#root`; tur `body`ye portalda): odak kartın dışına kaçmaz,
 * vurgulanan alan tıklanmaz; tur bitince odak eski yerine döner.
 * ⚠️ Ölçüm her karede hedefleri YENİDEN bulur: kartlar yüklenince yer değiştirebiliyor.
 */
export function TourRun({ id, run, onClose }) {
  const reduce = useReducedMotion()
  const { steps, delta } = run
  const [index, setIndex] = useState(0)
  const [layout, setLayout] = useState(null) // { holes, shown }
  const [cardSize, setCardSize] = useState({ w: 360, h: 260 })
  const cardRef = useRef(null)
  const primaryRef = useRef(null)
  const focusedRef = useRef(null)
  const titleId = useId()
  const bodyId = useId()
  const maskId = `tour-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`

  // Tur açıkken sayfa `inert`; kapanınca odak eski yerine.
  useEffect(() => {
    const back = document.activeElement
    const root = document.getElementById("root")
    if (root) root.inert = true
    return () => {
      if (root) root.inert = false
      if (back && typeof back.focus === "function") back.focus({ preventScroll: true })
    }
  }, [])

  // Adımın hedefleri: görünür kıl, ölç; kaydırma ve boy değişiminde yeniden ölç.
  useLayoutEffect(() => {
    const step = steps[index]
    const first = resolveTargets(step)
    if (!first.length) {
      const timer = setTimeout(
        () => (index < steps.length - 1 ? setIndex(index + 1) : onClose()),
        0,
      )
      return () => clearTimeout(timer)
    }
    bringIntoView(first, cardRef.current?.offsetHeight ?? 260, reduce)
    let frame = 0
    const ro = new ResizeObserver(() => measure())
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const targets = resolveTargets(step)
        for (const x of targets) ro.observe(x.el)
        setLayout({ holes: holesOf(targets), shown: targets.map((x) => x.name) })
      })
    }
    measure()
    for (const x of first) ro.observe(x.el)
    window.addEventListener("scroll", measure, { capture: true, passive: true })
    window.addEventListener("resize", measure)
    // Hedef yerinden yeni bir öğeyle değişebilir (sohbet boş ekrandan konuşmaya geçer): seyrek yokla.
    const poll = setInterval(measure, 500)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(poll)
      ro.disconnect()
      window.removeEventListener("scroll", measure, { capture: true })
      window.removeEventListener("resize", measure)
    }
  }, [steps, index, reduce, onClose])

  // Kartın gerçek boyu konum kararına girsin (madde sayısı ve dil değiştiriyor).
  const hasLayout = layout != null
  useLayoutEffect(() => {
    const el = cardRef.current
    if (!hasLayout || !el) return undefined
    const ro = new ResizeObserver(() =>
      setCardSize((s) =>
        s.w === el.offsetWidth && s.h === el.offsetHeight
          ? s
          : { w: el.offsetWidth, h: el.offsetHeight },
      ),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [hasLayout])

  // Odak adım BAŞINA bir kez: ölçüm her kaydırmada yenileniyor; her seferinde odaklamak, Tab'la
  // "Turu geç"e geçen kişiyi geri çekerdi.
  useEffect(() => {
    if (!layout || focusedRef.current === index) return
    focusedRef.current = index
    primaryRef.current?.focus({ preventScroll: true })
  }, [index, layout])

  if (!layout) return null
  const last = index === steps.length - 1
  const next = () => (last ? onClose() : setIndex(index + 1))
  const back = () => index > 0 && setIndex(index - 1)
  const pos = placeCard(layout.holes, cardSize.w, cardSize.h)
  const tween = reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }

  return createPortal(
    <div
      className="fixed inset-0 z-[70]"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault()
          onClose()
        } else if (e.key === "ArrowRight") next()
        else if (e.key === "ArrowLeft") back()
        else if (e.key === "Tab") {
          // Kart kipli: Tab kartın düğmelerinde döner (gövdeye çizilen başka katmanlara kaçmaz).
          const items = [...(cardRef.current?.querySelectorAll("button") ?? [])].filter(
            (b) => b.checkVisibility?.({ visibilityProperty: true }) ?? true,
          )
          if (!items.length) return
          const at = items.indexOf(document.activeElement)
          const to = e.shiftKey
            ? at <= 0
              ? items.length - 1
              : at - 1
            : at === items.length - 1
              ? 0
              : at + 1
          e.preventDefault()
          items[to].focus()
        }
      }}
    >
      <svg aria-hidden="true" className="pointer-events-none fixed inset-0 size-full">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {layout.holes.map((h, i) => (
              <motion.rect
                key={i}
                rx={20}
                fill="black"
                initial={false}
                animate={{ x: h.left, y: h.top, width: h.width, height: h.height }}
                transition={tween}
              />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgb(0 0 0 / 0.5)" mask={`url(#${maskId})`} />
      </svg>
      {layout.holes.map((h, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          className="pointer-events-none fixed rounded-[1.25rem] ring-2 ring-white/80"
          initial={false}
          animate={{ top: h.top, left: h.left, width: h.width, height: h.height }}
          transition={tween}
        />
      ))}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="fixed w-[min(22.5rem,calc(100vw-1.5rem))] rounded-2xl bg-neutral-900 p-4 text-white shadow-2xl ring-1 ring-white/10 dark:bg-neutral-800"
        style={{ left: pos.left, top: pos.top }}
      >
        <TourCard
          tourId={id}
          step={steps[index]}
          index={index}
          total={steps.length}
          delta={delta}
          shown={layout.shown}
          titleId={titleId}
          bodyId={bodyId}
          primaryRef={primaryRef}
          onSkip={onClose}
          onBack={back}
          onNext={next}
        />
      </div>
    </div>,
    document.body,
  )
}
