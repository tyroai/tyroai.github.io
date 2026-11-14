import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import CloudAlertIcon from "@hugeicons/core-free-icons/CloudAlertIcon"
import { useLocale } from "@/hooks/useLocale"
import { getServiceHealth, subscribeServiceHealth, tickServiceHealth } from "@/lib/serviceHealth"

/** Microsoft'un herkese açık durum sayfası (eski status.office365.com cevap vermiyor). */
const STATUS_URL = "https://status.cloud.microsoft"
// Açıkken pencere zamanla boşalsın: istek olmasa da şerit kendiliğinden kapanabilsin.
const TICK_MS = 30_000
// Üç ve daha çok servis etkilenmişse "genel olarak yavaş" denir.
const GENERAL_FROM = 3

/**
 * MICROSOFT 365 DURUMU — her sayfada, üst çubuğun altında tek şerit (`lib/serviceHealth`): Graph
 * istekleri art arda 5xx, zaman aşımı ya da çok yavaş cevap alıyorsa "sorun Microsoft tarafında"
 * der, hangi servislerin etkilendiğini sayar ve son bilinen bilgilerin gösterildiğini söyler. 429'da
 * "çok yoğun" der. Kapatılabilir (bu bölüm için); servis düzelince kendiliğinden kalkar.
 * Uygulama kesintinin küresel olduğunu bilemez: metin yalnız gördüğünü söyler.
 */
export function ServiceHealthBanner() {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const health = useSyncExternalStore(subscribeServiceHealth, getServiceHealth, getServiceHealth)
  const [dismissed, setDismissed] = useState(0)
  const open = health.status !== "ok" && dismissed !== health.since

  useEffect(() => {
    if (health.status === "ok") return undefined
    const timer = setInterval(() => tickServiceHealth(), TICK_MS)
    return () => clearInterval(timer)
  }, [health.status])

  const services = useMemo(() => {
    const names = health.services.filter((s) => s !== "other").map((s) => t(`health.service.${s}`))
    if (!names.length) return ""
    try {
      return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(names)
    } catch {
      return names.join(", ")
    }
  }, [health.services, locale, t])

  const general = health.services.filter((s) => s !== "other").length >= GENERAL_FROM
  const title =
    health.status === "busy"
      ? t("health.busy.title")
      : general || !services
        ? t("health.degraded.generalTitle")
        : t("health.degraded.title", { services })
  const body = t(health.status === "busy" ? "health.busy.body" : "health.degraded.body")

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="shrink-0 overflow-hidden"
        >
          <div className="mx-3 mt-2 flex items-start gap-3 rounded-tile bg-foreground/[0.045] px-3 py-2.5 md:mx-4 md:items-center">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-warning/15 text-warning-ink"
            >
              <HugeiconsIcon icon={CloudAlertIcon} className="size-[1.125rem]" strokeWidth={1.9} />
            </span>
            <p className="min-w-0 flex-1 text-callout leading-snug">
              <span className="font-semibold text-foreground">{title}</span>{" "}
              <span className="text-foreground/75">{body}</span>{" "}
              <a
                href={STATUS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {t("health.statusLink")}
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={2}
                />
              </a>
            </p>
            <button
              type="button"
              onClick={() => setDismissed(health.since)}
              aria-label={t("health.dismiss")}
              className="relative grid size-8 shrink-0 place-items-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                aria-hidden="true"
                className="size-4"
                strokeWidth={2}
              />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
