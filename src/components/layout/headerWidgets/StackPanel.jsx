import { useEffect, useId, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { HeaderCardHandle } from "./HeaderCardHandle"
import { headerLookOf, headerTitleKey } from "./headerStore"
import { setStackTop, useStackTop } from "./stackTop"
import { trayIcon } from "./trayIcon"
import { WidgetPanel } from "./trayParts"

const SWIPE = 48

/**
 * Toplu tepsinin içi — header'a sığmayan ikonlar tek düğmede, açılınca burada: üstte ikon
 * sekmeleri (WAI-ARIA sekme kalıbı: oklar, Home/End), altta seçili widget. Dokunmatikte
 * yana kaydırınca sıradakine geçer; geçiş geldiği yönden kısa bir kayma. Son bakılan "üstte"
 * kalır (`stackTop`): düğme onu gösterir, tepsi yeniden açılınca o gelir.
 */
export function StackPanel({ items, looks, className }) {
  const { t } = useLocale()
  const top = useStackTop()
  const [at, setAt] = useState(() => Math.max(0, items.indexOf(top)))
  const [dir, setDir] = useState(1)
  // Klavyeyle gezinince ve hareket azaltılmışsa kayma yok; yön sağdan sola dilde ters.
  const [byKey, setByKey] = useState(false)
  const reduce = useReducedMotion()
  const rtl = typeof document !== "undefined" && document.dir === "rtl"
  const tabs = useRef([])
  const start = useRef(null)
  const base = useId()
  const i = Math.min(at, items.length - 1)
  const id = items[i]
  useEffect(() => setStackTop(id), [id])

  function go(next, focus = false) {
    const n = (next + items.length) % items.length
    setDir(n >= i ? 1 : -1)
    setByKey(focus)
    setAt(n)
    if (focus) tabs.current[n]?.focus()
  }

  function onKeyDown(e) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (step) go(i + step, true)
    else if (e.key === "Home") go(0, true)
    else if (e.key === "End") go(items.length - 1, true)
    else return
    e.preventDefault()
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div role="tablist" aria-label={t("headerWidgets.title")} className="flex items-center gap-1">
        {items.map((x, n) => (
          <button
            key={x}
            ref={(el) => (tabs.current[n] = el)}
            type="button"
            role="tab"
            id={`${base}-${x}`}
            aria-selected={n === i}
            aria-controls={`${base}-panel`}
            tabIndex={n === i ? 0 : -1}
            onClick={() => go(n)}
            onKeyDown={onKeyDown}
            title={t(headerTitleKey(x))}
            className={cn(
              "grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11",
              n === i && "bg-accent text-foreground",
            )}
          >
            <HugeiconsIcon
              icon={trayIcon(x)}
              className="size-5"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="sr-only">{t(headerTitleKey(x))}</span>
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-${id}`}
        onPointerDown={(e) => {
          start.current = e.pointerType === "touch" ? { x: e.clientX, y: e.clientY } : null
        }}
        onPointerUp={(e) => {
          const s = start.current
          start.current = null
          if (!s || items.length < 2) return
          const dx = e.clientX - s.x
          if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5)
            go(i + (dx < 0 ? 1 : -1))
        }}
      >
        <motion.div
          key={id}
          initial={reduce || byKey ? false : { opacity: 0, x: dir * (rtl ? -24 : 24) }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="group/stack relative"
        >
          <WidgetPanel id={id} look={headerLookOf(looks, id)} />
          <HeaderCardHandle id={id} look={headerLookOf(looks, id)} />
        </motion.div>
      </div>
    </div>
  )
}
