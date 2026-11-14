import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import Login03Icon from "@hugeicons/core-free-icons/Login03Icon"
import { useLocale } from "@/hooks/useLocale"
import { useReconnect } from "@/hooks/useReconnect"
import { useSessionExpired } from "@/hooks/useSessionExpired"

/**
 * Oturumun süresi dolunca her sayfada, üst çubuğun hemen altında tek uyarı (`lib/sessionHealth`):
 * neden boş geldiği ve tek düğmeyle yeniden giriş. Düğme açılıştaki kurtarmanın aynısı: yerel
 * oturum silinir (`clearLocalSession` — Entra oturumu açık kalır) ve sessiz giriş (`prompt=none`,
 * tam sayfa) denenir; Entra oturumu yaşıyorsa kullanıcı şifre yazmadan aynı sayfaya döner, yoksa
 * giriş ekranı gelir (dönüşteki hata sessiz denemeyi kapatır, döngü yok). Sayfaların kendi hata
 * kartları yerinde kalır; bu şerit ne yapılacağını söyler.
 */
export function SessionExpiredBanner() {
  const { t } = useLocale()
  const expired = useSessionExpired()
  const { reconnect, busy } = useReconnect()
  const reduce = useReducedMotion()
  return (
    <AnimatePresence initial={false}>
      {expired && (
        <motion.div
          role="alert"
          initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 overflow-hidden"
        >
          <div className="mx-3 mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 md:mx-4">
            <HugeiconsIcon
              icon={Alert02Icon}
              aria-hidden="true"
              className="size-5 shrink-0 self-start text-warning-ink sm:self-center"
              strokeWidth={2}
            />
            <p className="min-w-0 flex-1 basis-[calc(100%-2rem)] text-[0.8125rem] leading-snug sm:basis-auto">
              <span className="font-semibold text-foreground">{t("session.expired.title")}</span>{" "}
              <span className="text-foreground/80">{t("session.expired.body")}</span>
            </p>
            <button
              type="button"
              onClick={reconnect}
              aria-busy={busy}
              disabled={busy}
              className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 sm:w-auto text-[0.8125rem] font-semibold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
            >
              <HugeiconsIcon
                icon={Login03Icon}
                aria-hidden="true"
                className="size-4"
                strokeWidth={2}
              />
              {t("session.expired.action")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
