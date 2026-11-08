import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/** Kullanıcı yukarı kaydırmışken yeni asistan mesajı gelince besteci üstünde beliren hap. */
export function NewMessagePill({ unread, isNearBottom, onClick }) {
  const { t } = useLocale()
  return (
    <div className="pointer-events-none relative z-10 -mb-2 flex justify-center">
      <AnimatePresence>
        {unread > 0 && !isNearBottom && (
          <motion.button
            key="new-msg-pill"
            type="button"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            className={cn(
              "pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-3 py-1.5",
              "text-xs font-medium text-foreground shadow-lg backdrop-blur",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            )}
            aria-label={t("chat.scrollToLatest")}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" strokeWidth={2} />
            <span>{t("chat.newMessagePill").replace("{count}", String(unread))}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
