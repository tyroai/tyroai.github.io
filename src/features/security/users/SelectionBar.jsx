import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const ACTION =
  "inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"

/**
 * Seçim çubuğu (Gmail / Linear): seçim varken listenin altında yapışkan; telefonda ekranın
 * altında başparmak bölgesinde. Sayı · Uygulama ver · Uygulama al · Seçimi temizle.
 */
export function SelectionBar({ count, onGrant, onRevoke, onClear, phone }) {
  const { t, locale } = useLocale()
  return (
    <div
      role="region"
      aria-label={t("security.sel.label")}
      className={cn(
        // Koyu temada beyaz hap sayfanın en parlak şeyi olurdu: yükseltilmiş koyu yüzey.
        "z-30 flex items-center gap-1 rounded-2xl bg-foreground px-2 py-1.5 text-background shadow-lg dark:bg-popover dark:text-popover-foreground dark:shadow-[0_0_0_1px_var(--border),0_10px_30px_-10px_rgb(0_0_0/0.6)]",
        phone
          ? "fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
          : "sticky bottom-4 mx-auto mt-3 w-fit max-w-full",
      )}
    >
      <span aria-live="polite" className="px-2 text-[0.8125rem] font-semibold tabular-nums">
        {t("security.sel.count", { n: new Intl.NumberFormat(locale).format(count) })}
      </span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={onGrant}
        className={cn(ACTION, "hover:bg-background/10 dark:hover:bg-foreground/10")}
      >
        {t("security.sel.grant")}
      </button>
      <button
        type="button"
        onClick={onRevoke}
        className={cn(ACTION, "hover:bg-background/10 dark:hover:bg-foreground/10")}
      >
        {t("security.sel.revoke")}
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={t("security.sel.clear")}
        title={t("security.sel.clear")}
        className={cn(
          ACTION,
          "w-9 justify-center px-0 hover:bg-background/10 dark:hover:bg-foreground/10 pointer-coarse:w-11",
        )}
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
      </button>
    </div>
  )
}
