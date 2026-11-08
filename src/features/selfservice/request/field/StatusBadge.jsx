import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

const POP = { type: "spring", stiffness: 520, damping: 26 }

/**
 * İkon kutusunun köşesindeki durum rozeti: dolu alanda yeşil ✓ (tik çizilerek belirir), hatalı
 * alanda kırmızı ünlem. Form açılırken dolu gelen alanlarda hareket yok (`initial={false}`);
 * yalnız değişince oynar. Süs: durum alanın kendisinden (değer, `aria-invalid`) okunur.
 */
export function StatusBadge({ state, className }) {
  const reduced = useReducedMotion()
  const shown = state === "done" || state === "error"
  const hidden = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4 }
  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.span
          key={state}
          aria-hidden="true"
          initial={hidden}
          animate={{ opacity: 1, scale: 1 }}
          exit={hidden}
          transition={reduced ? { duration: 0.12 } : POP}
          className={cn(
            "pointer-events-none absolute -bottom-1 -end-1 grid size-[1.0625rem] place-items-center rounded-full text-white ring-2 ring-card dark:text-background",
            state === "done" ? "bg-success" : "bg-danger",
            className,
          )}
        >
          <svg
            viewBox="0 0 16 16"
            className="size-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {state === "done" ? (
              <motion.path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                initial={reduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              />
            ) : (
              <path d="M8 3.5v5.5M8 12.5v.01" />
            )}
          </svg>
        </motion.span>
      )}
    </AnimatePresence>
  )
}
