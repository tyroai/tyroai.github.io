import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { cn } from "@/lib/utils"

/** Kalemin altındaki uyarı satırı (engellemez, uyarı tonu): ileri tarih, olası mükerrer. */
export function WarnNote({ children, className }) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-[0.75rem] leading-4 text-warning-ink",
        className,
      )}
    >
      <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" className="size-3.5 shrink-0 mt-px" />
      <span className="min-w-0">{children}</span>
    </p>
  )
}
