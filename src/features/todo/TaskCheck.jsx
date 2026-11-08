import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { cn } from "@/lib/utils"

/** Satırın küçük bilgi çipi: ikon + metin (ya da yalnız ikon ve ekran okuyucu etiketi). */
export function MetaChip({ icon, children, tone, label }) {
  return (
    <span
      title={label}
      className={cn(
        "inline-flex items-center gap-1 text-[0.6875rem] leading-4",
        tone === "overdue"
          ? "font-medium text-amber-700 dark:text-amber-400"
          : tone === "today"
            ? "font-medium text-brand-ink"
            : "text-muted-foreground",
      )}
    >
      {icon && (
        <HugeiconsIcon icon={icon} className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
      )}
      {children}
      {!children && label && <span className="sr-only">{label}</span>}
    </span>
  )
}

export function TaskCheck({ done, pending, onToggle, label, size = "md" }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      disabled={pending}
      onClick={onToggle}
      className={cn(
        "group/check grid shrink-0 place-items-center rounded-full border-[1.5px] outline-none transition",
        "focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50",
        size === "lg" ? "size-6" : size === "sm" ? "size-[0.9375rem] border" : "size-[1.125rem]",
        done
          ? "border-transparent bg-gradient-to-br from-brand-from via-brand-via to-brand-to text-brand-on-ramp"
          : "border-foreground/30 text-transparent hover:border-brand hover:text-brand/60",
      )}
    >
      <HugeiconsIcon
        icon={Tick02Icon}
        className={size === "lg" ? "size-3.5" : size === "sm" ? "size-2" : "size-2.5"}
        strokeWidth={3}
      />
    </button>
  )
}

/** Çoklu seçimin kutusu — tamamlama dairesinden ayrılsın diye kare. */
export function SelectCheck({ checked, onToggle, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative grid size-[1.125rem] shrink-0 place-items-center rounded-full border-[1.5px] outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-3",
        // Seçili: paletin koyu düz dolgusu + beyaz tik (küçük dairede degrade bulanık görünüyordu).
        checked
          ? "border-transparent bg-brand-fill-deep text-brand-on-brand shadow-sm"
          : "border-foreground/30 text-transparent hover:border-brand",
      )}
    >
      <HugeiconsIcon icon={Tick02Icon} className="size-3" strokeWidth={2.6} />
    </button>
  )
}
