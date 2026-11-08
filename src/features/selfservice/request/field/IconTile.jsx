import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./StatusBadge"
import { TONES } from "./tones"

const SIZES = {
  md: { box: "size-9 rounded-[0.625rem]", icon: "size-[1.125rem]" },
  sm: { box: "size-7 rounded-lg", icon: "size-4" },
  xs: { box: "size-5 rounded-md", icon: "size-3" },
}

/**
 * Alanın ikon kutusu: tonlu zemin, ortada ikon, köşede durum rozeti (`state`). İkon değişince
 * (izin türü seçildi) yenisi kısa bir büyümeyle gelir; `swap` hangi ikonun çizildiğinin anahtarı.
 */
export function IconTile({ icon, tone = "brand", state = null, swap, size = "md", className }) {
  const reduced = useReducedMotion()
  const s = SIZES[size]
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center transition-colors duration-200",
        s.box,
        TONES[tone] ?? TONES.brand,
        className,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={swap ?? "icon"}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="grid place-items-center"
        >
          <HugeiconsIcon icon={icon} className={s.icon} strokeWidth={1.8} />
        </motion.span>
      </AnimatePresence>
      {state && <StatusBadge state={state} />}
    </span>
  )
}
