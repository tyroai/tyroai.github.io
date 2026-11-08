import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { countText } from "../../../kinds"
import { RULE } from "./summaryUi"

/**
 * Sıkı özetin durum düğmesi, durum renkleriyle: kırmızı eksik alan sayısı (gönderme denendiyse
 * alt şeritteki hata sayısı, `errors`) ya da yeşil "Tüm kalemler hazır", varsa sarı uyarı
 * sayısı; basınca özetin ayrıntısı
 * (eksikler, fişler, kategoriler, yönetici) açılır. Telefonda toplamın altında tam genişlik
 * satır, şeritte toplamın sağında.
 */
export function StatusToggle({ missing, errors, warnings, tried, open, onToggle, controls }) {
  const { t, locale } = useLocale()
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className={cn(
        RULE,
        "flex min-h-11 w-full items-center gap-x-3 gap-y-1 border-t px-4 text-start text-[0.8125rem] transition hover:bg-foreground/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
        "@[36rem]/summary:w-auto @[36rem]/summary:self-stretch @[36rem]/summary:border-s @[36rem]/summary:border-t-0 @[36rem]/summary:px-5",
      )}
    >
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 font-semibold",
          missing ? "text-danger-ink" : "text-success-ink",
        )}
      >
        {missing ? (
          // Eksik: kırmızı halka; denendikten sonra dolu (hata).
          <span
            aria-hidden="true"
            className={cn(
              "size-2 shrink-0 rounded-full border-[1.5px] border-danger",
              tried ? "bg-danger" : "bg-danger/15",
            )}
          />
        ) : (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            aria-hidden="true"
            className="size-4 shrink-0"
            strokeWidth={2}
          />
        )}
        <span className="truncate">
          {!missing
            ? t("selfService.expense.summary.ready")
            : tried
              ? t("selfService.form.err.summary", { n: errors })
              : countText(t, locale, "selfService.expense.summary.missingCount", missing)}
        </span>
      </span>
      {warnings > 0 && (
        <span className="flex shrink-0 items-center gap-1 font-medium text-warning-ink">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" className="size-3.5 shrink-0" />
          {countText(t, locale, "selfService.expense.summary.warnCount", warnings)}
        </span>
      )}
      <span className="flex shrink-0 items-center gap-1 font-semibold text-foreground/75">
        {t("selfService.form.details")}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          aria-hidden="true"
          strokeWidth={2}
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </span>
    </button>
  )
}
