import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { cn } from "@/lib/utils"

// Dokunmatikte görünmez pay: 32 px ok, ~44 px hedef.
const BTN =
  "relative grid size-8 place-items-center rounded-full text-foreground/70 ring-1 ring-inset ring-border transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-35 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5"

/**
 * Sayfalı kartın altlığı: solda "1–3 / 9 ekip", sağda sayfa noktaları ve ‹ ›. Kartın dibine
 * yaslanır (`mt-auto`), yan yana kartların altlıkları aynı hizada kalır.
 */
export function Pager({ at, pages, label, onPage, prev, next }) {
  return (
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/50 pt-3">
      <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="me-1 flex gap-1">
          {Array.from({ length: pages }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === at ? "w-4 bg-brand" : "w-1.5 bg-foreground/20",
              )}
            />
          ))}
        </span>
        <button
          type="button"
          onClick={() => onPage(at - 1)}
          disabled={at === 0}
          aria-label={prev}
          className={BTN}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 rtl:rotate-180" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => onPage(at + 1)}
          disabled={at === pages - 1}
          aria-label={next}
          className={BTN}
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 rtl:rotate-180"
            strokeWidth={2}
          />
        </button>
      </span>
    </div>
  )
}
