import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * "TYRO'ya gönder" simgesi — "Gönder" ERP'ye yazan formlarda (izin, masraf) yalnız uygulama
 * yöneticisine, talebi eskisi gibi sohbete yollamak için. Masaüstünde pencerenin başlığında
 * "Anlat"ın solunda (`placement` "header"), telefonda alt şeritte (`"footer"`). `onClick`: formun
 * TYRO gönderimi (`useRequestSubmit.submit`).
 */
export function TyroSendButton({ onClick, busy = false, placement = "header" }) {
  const { t } = useLocale()
  const label = t("selfService.form.sendTyro")
  const foot = placement === "footer"
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={label}
      title={label}
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-brand-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60",
        foot
          ? "size-12 border border-border bg-background shadow-xs hover:bg-brand/[0.06]"
          : "relative me-1 size-8 bg-brand/[0.08] hover:bg-brand/[0.13] pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5",
      )}
    >
      <HugeiconsIcon
        icon={AiChat02Icon}
        aria-hidden="true"
        className={foot ? "size-[1.125rem]" : "size-4"}
        strokeWidth={1.9}
      />
    </button>
  )
}
