import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useCause } from "@/hooks/useCause"
import { causeReport } from "@/lib/causeText"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const buildOf = () => document.querySelector('meta[name="tyro-build"]')?.content?.slice(0, 7) ?? ""

/**
 * Okunamayan bir kaynağın altında: önce sade neden cümlesi (ne oldu, ne yapılır), altında kapalı
 * "Teknik ayrıntı" (servis, HTTP, eksik yetki, tablo, kod, sayfa, zaman, sürüm) ve "Kopyala": BT'ye
 * yapıştırılacak düz metin rapor. Kod kişisel veri içermez (`lib/errorCause`). `detail` yoksa
 * hiçbir şey çizmez. `tone="warn"`: sarı uyarı kutusunun içinde (yazı kutunun renginde).
 */
export function ErrorCause({ detail, tone, className }) {
  const { t, locale } = useLocale()
  const cause = useCause(detail)
  const [copied, setCopied] = useState(false)
  if (!cause) return null
  const warn = tone === "warn"
  const ink = warn ? "text-amber-800 dark:text-amber-300" : "text-muted-foreground"
  // Ekranın eklediği satırlar: hangi sayfa, ne zaman, hangi sürüm.
  const extra = () => [
    [t("cause.row.page"), window.location.pathname],
    [t("cause.row.time"), new Date().toLocaleString(locale)],
    [t("cause.row.build"), buildOf()],
  ]
  const rows = () => [...cause.rows, ...extra()]
  const copy = async () => {
    const text = causeReport(t, cause, extra())
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Pano kapalı: kod satırı seçilebilir (select-all), elle kopyalanır.
    }
  }
  return (
    <div className={cn("mt-3 max-w-md space-y-1.5", className)} data-error-cause="">
      {cause.sentence && (
        <p
          className={cn(
            "text-[0.8125rem] leading-relaxed",
            warn ? "text-amber-800 dark:text-amber-300" : "text-foreground/80",
          )}
        >
          {cause.sentence}
        </p>
      )}
      {/* Kopyala özetin İÇİNDE değil yanında: düğme içinde düğme olmaz (a11y). */}
      <div className="flex items-start gap-2">
        <details className={cn("min-w-0 flex-1 text-[0.6875rem]", ink)}>
          <summary className="flex cursor-pointer items-center gap-2">
            <span className="underline underline-offset-2">{t("cause.tech")}</span>
          </summary>
          <div className="mt-1.5 space-y-0.5">
            {rows().map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="shrink-0">{k}:</span>
                <code
                  dir="ltr"
                  className={cn(
                    "min-w-0 select-all font-mono [overflow-wrap:anywhere]",
                    warn ? "" : "text-foreground/80",
                  )}
                >
                  {v}
                </code>
              </div>
            ))}
          </div>
        </details>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium hover:bg-background pointer-coarse:min-h-11 text-[0.6875rem]",
            ink,
          )}
          onClick={copy}
        >
          <HugeiconsIcon
            icon={copied ? Tick02Icon : Copy01Icon}
            className="size-3.5"
            aria-hidden="true"
          />
          <span aria-live="polite">{copied ? t("cause.copied") : t("cause.copy")}</span>
        </button>
      </div>
    </div>
  )
}
