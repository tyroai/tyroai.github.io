import { motion, AnimatePresence } from "motion/react"
import { TyroAppIcon } from "@/components/brand/TyroAppIcon"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { usePwaInstall } from "@/hooks/usePwaInstall"
import { startInstall } from "@/lib/pwaInstall"
import { cn } from "@/lib/utils"

/**
 * Yardım'daki kurulum kartı, kullanıcı menüsündeki satırla aynı dil (simge, ad, tek satır fayda).
 * İstek açılışta yakalanır (`lib/pwaInstall`), sayfa sonra açılsa da gelir; iPhone/iPad
 * Safari'de iki adımlı tarifi açar.
 */
export function PwaInstallButton({ className }) {
  const { t } = useLocale()
  const { canPrompt, ios } = usePwaInstall()
  const touch = useMediaQuery("(pointer: coarse)")

  if (!canPrompt && !ios) return null

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        onClick={() => startInstall()}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all duration-200 hover:border-brand/40 hover:shadow-lg",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <TyroAppIcon className="size-11" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold leading-tight">{t("pwa.menu.install")}</p>
            <p className="text-xs text-muted-foreground">
              {t(ios || touch ? "pwa.menu.subPhone" : "pwa.menu.subDesktop")}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-brand-deep">
          {ios ? t("pwa.promo.how") : t("pwa.install.cta")}
        </span>
      </motion.button>
    </AnimatePresence>
  )
}
