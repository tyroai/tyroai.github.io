import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { WarnMark } from "../history/WarnMark"

const POP = { type: "spring", stiffness: 520, damping: 26 }

// Rozetin görünüşü durumuna göre. Tamam: yeşil ✓ (yan yana yirmi kalemde göz yormasın diye
// tonlu; açık kartın başlığında dolu, `solid`). Hata: kırmızı numara. Öteki: sakin ya da (yazılan
// kalem) marka tonunda numara — `rest` sınıfı yerine göre değişir.
const LOOK = {
  done: "bg-success/14 text-success-ink",
  doneSolid: "bg-success text-white dark:text-background",
  error: "bg-danger/12 text-danger-ink",
  active: "bg-brand-fill-deep text-brand-on-brand",
}

/**
 * Kalemin numara rozeti, durumuyla (ızgara, kalem kartı ve kapalı kalem satırı aynı dil):
 * `state` "done" → yeşil ✓ (tik çizilerek belirir; fareyle üstüne gelince numara), "error" →
 * kırmızı numara, yoksa numara (`rest`: o yerin sakin sınıfı; `active`: açık kalem, marka).
 * Olası mükerrerde köşede sarı nokta (`warn`). Süs: durum metni kalemin görünmez yazısında.
 */
export function NumberBadge({
  n,
  state = null,
  solid = false,
  active = false,
  warn,
  rest,
  className,
}) {
  const reduced = useReducedMotion()
  const done = state === "done"
  const look = done
    ? LOOK[solid ? "doneSolid" : "done"]
    : state === "error"
      ? LOOK.error
      : active
        ? LOOK.active
        : rest
  const hidden = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4 }
  return (
    <span
      aria-hidden="true"
      data-state={state ?? undefined}
      className={cn(
        "group/num relative grid size-6 shrink-0 place-items-center rounded-full text-[0.75rem] font-semibold tabular-nums transition-colors duration-200 motion-reduce:transition-none",
        look,
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {done ? (
          <motion.span
            key="done"
            initial={hidden}
            animate={{ opacity: 1, scale: 1 }}
            exit={hidden}
            transition={reduced ? { duration: 0.12 } : POP}
            className="col-start-1 row-start-1 grid place-items-center"
          >
            <svg
              viewBox="0 0 16 16"
              // Görünürlük hareketin satır içi stilinde: üstüne gelince gizleme simgede.
              className="size-3.5 transition-opacity duration-150 pointer-fine:group-hover/num:opacity-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                initial={reduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              />
            </svg>
          </motion.span>
        ) : (
          <motion.span
            key="n"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="col-start-1 row-start-1"
          >
            {n}
          </motion.span>
        )}
      </AnimatePresence>
      {/* Tamam kalemin numarası: imleç rozetin üstündeyken ✓'nin yerinde ("Kalem 3"ü bulmak için). */}
      {done && (
        <span className="col-start-1 row-start-1 opacity-0 transition-opacity duration-150 pointer-fine:group-hover/num:opacity-100">
          {n}
        </span>
      )}
      {warn && <WarnMark />}
    </span>
  )
}
