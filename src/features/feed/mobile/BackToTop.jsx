import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUp02Icon from "@hugeicons/core-free-icons/ArrowUp02Icon"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"

/**
 * Uzun akışta "Başa dön" (dokunmatik): bir buçuk ekran aşağı inince sağ altta belirir, basınca akışın
 * başına kayar (yapışkan başlık da geri gelir). Masaüstünde yok: klavyenin Home'u, tekerlek var.
 */
export function BackToTop({ scrollerRef }) {
  const { t } = useLocale()
  const coarse = useMediaQuery("(pointer: coarse)")
  const reduce = useReducedMotion()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = scrollerRef.current
    if (!coarse || !el) return undefined
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setShow(el.scrollTop > el.clientHeight * 1.5)
      })
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [coarse, scrollerRef])

  return (
    <AnimatePresence>
      {coarse && show && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.18 }}
          onClick={() =>
            scrollerRef.current?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
          }
          aria-label={t("feed.top")}
          className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-4 z-20 grid size-11 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={ArrowUp02Icon} className="size-5" strokeWidth={2} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
