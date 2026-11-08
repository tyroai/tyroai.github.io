import "@/lib/i18n/tour"
import { useEffect, useId, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { resolveTargets } from "./tourGeometry"
import { TourCard } from "./TourCard"
import { TOURS } from "./tours"
import { releaseTour, useTourTrigger } from "./useTourTrigger"
import "./coach.css"

/**
 * PENCERE İÇİ İPUÇLARI — talep formu ve Anlat gibi açık bir katmanın içinde, hedefin yanında balon
 * (Radix Popover; kart sayfa turununkiyle aynı). Sayfa turunun karartması burada çalışmaz: pencerenin
 * odak tuzağı kartı dışarıda bırakır, pencereye basmak da "dışarı" sayılırdı.
 * ⚠️ **BİLEŞEN KATMANIN İÇİNDE ÇİZİLİR** (pencerenin, çekmecenin ya da açılır kutunun çocuğu): balona
 * basmak o zaman katmanı kapatmaz. Radix olmayan katman (Self Servis'in "Yeni" menüsü) balonu
 * `[data-coach]` ile tanır.
 * Hedef `data-tour-on` ile vurgulanır (coach.css). Balonun dışına basmak ya da Esc ipuçlarını
 * kapatır; odak açılışta kartta, kapanınca eski yerinde (dışarı basıldıysa orada kalır).
 */
export function CoachTour({ id, when = true }) {
  const def = TOURS[id]
  const [run, close] = useTourTrigger(id, def, { when, insideDialog: true })
  useEffect(() => () => releaseTour(id), [id])
  if (!run || !when) return null
  return <CoachRun key={run.replay ? "replay" : "auto"} id={id} run={run} onClose={close} />
}

function CoachRun({ id, run, onClose }) {
  const reduce = useReducedMotion()
  const { steps, delta } = run
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(null)
  const anchorRef = useRef(null)
  const primaryRef = useRef(null)
  const outside = useRef(false)
  const titleId = useId()
  const bodyId = useId()

  // Kapanınca odak eski yerine (çoğunlukla formun ilk alanı) — dışarı basıldıysa kişinin seçtiği yerde.
  useEffect(() => {
    const back = document.activeElement
    return () => {
      if (!outside.current && back?.isConnected) back.focus({ preventScroll: true })
    }
  }, [])

  // Adımın hedefi: görünür değilse adım atlanır; görünürse görünür kılınır ve vurgulanır.
  useEffect(() => {
    let found = []
    const frame = requestAnimationFrame(() => {
      found = resolveTargets(steps[index])
      if (!found.length) {
        if (index < steps.length - 1) setIndex(index + 1)
        else onClose()
        return
      }
      anchorRef.current = found[0].el
      found[0].el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" })
      for (const x of found) x.el.setAttribute("data-tour-on", "")
      setShown(found.map((x) => x.name))
    })
    return () => {
      cancelAnimationFrame(frame)
      for (const x of found) x.el.removeAttribute("data-tour-on")
    }
  }, [steps, index, reduce, onClose])

  if (!shown) return null
  const step = steps[index]
  const last = index === steps.length - 1
  const next = () => (last ? onClose() : setIndex(index + 1))
  const back = () => index > 0 && setIndex(index - 1)
  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor virtualRef={anchorRef} />
      <PopoverContent
        data-coach=""
        side={step.side ?? "bottom"}
        align="start"
        sideOffset={10}
        collisionPadding={12}
        hideWhenDetached
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          primaryRef.current?.focus({ preventScroll: true })
        }}
        // Odak ya elle geri konur ya da kişinin bastığı yerde kalır.
        onCloseAutoFocus={(e) => e.preventDefault()}
        // Esc yalnız balonu kapatsın: arkadaki pencere, menü ya da sohbet rıhtımı açık kalır.
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onInteractOutside={() => {
          outside.current = true
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") next()
          else if (e.key === "ArrowLeft") back()
        }}
        className="w-[min(22.5rem,calc(100vw-1.5rem))] gap-0 rounded-2xl bg-neutral-900 p-4 text-white shadow-2xl ring-1 ring-white/10 dark:bg-neutral-800"
      >
        <PopoverPrimitive.Arrow width={14} height={7} className="coach-arrow" />
        <TourCard
          tourId={id}
          step={step}
          index={index}
          total={steps.length}
          delta={delta}
          shown={shown}
          titleId={titleId}
          bodyId={bodyId}
          primaryRef={primaryRef}
          doneKey="tour.gotIt"
          onSkip={onClose}
          onBack={back}
          onNext={next}
        />
      </PopoverContent>
    </Popover>
  )
}
