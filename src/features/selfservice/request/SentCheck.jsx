import { createPortal } from "react-dom"
import { motion, useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"

const EASE = [0.22, 1, 0.36, 1]

/**
 * Gönderim onayı: talep TYRO'ya gidince form kapanmadan önce kısa bir ✓ — markanın dolgusunda
 * daire, içinde çizilerek beliren tik, altında "TYRO'ya gönderildi". Ekranın üstünde, perdeli
 * (form da sohbet de altında kalır); süre `useRequestSubmit`te. Hareket azaltıldıysa durağan.
 * Ekran okuyucuya bir kez duyurulur.
 */
export function SentCheck({ show }) {
  const { t } = useLocale()
  const calm = useReducedMotion()
  if (!show) return null
  const draw = calm
    ? { initial: false }
    : {
        initial: { pathLength: 0 },
        animate: { pathLength: 1 },
        transition: { duration: 0.42, ease: EASE, delay: 0.16 },
      }
  return createPortal(
    <motion.div
      role="status"
      initial={calm ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[70] grid place-items-center bg-background/55 backdrop-blur-[3px]"
    >
      <motion.div
        initial={calm ? false : { opacity: 0, scale: 0.86, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.36, ease: EASE }}
        className="flex flex-col items-center gap-4 rounded-[1.75rem] bg-popover px-10 py-8 text-center text-popover-foreground shadow-[0_32px_64px_-24px_rgb(0_0_0/0.45)] ring-1 ring-foreground/10"
      >
        <span className="relative grid size-16 place-items-center rounded-full bg-brand-fill-deep text-brand-on-brand shadow-[0_14px_30px_-10px_var(--brand-via)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(90%_70%_at_30%_15%,rgb(255_255_255/0.3),transparent_65%)]"
          />
          <svg viewBox="0 0 24 24" aria-hidden="true" className="relative size-8">
            <motion.path
              d="M5 12.5l4.2 4.2L19 7"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...draw}
            />
          </svg>
        </span>
        <span className="space-y-1">
          <span className="block text-[1.0625rem] font-semibold tracking-[-0.01em]">
            {t("selfService.form.sent.title")}
          </span>
          <span className="block text-[0.8125rem] text-muted-foreground">
            {t("selfService.form.sent.body")}
          </span>
        </span>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
