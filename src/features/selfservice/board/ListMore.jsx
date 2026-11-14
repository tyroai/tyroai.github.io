import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { GHOST } from "../chips"
import { number } from "../kinds"

/**
 * Uzun listenin sonu: "Daha fazla göster" (bir parça daha) ve "Tümünü göster"; altında kaçının
 * göründüğü (ekran okuyucuya da duyurulur).
 */
export function ListMore({ shown, total, onMore, onAll }) {
  const { t, locale } = useLocale()
  if (shown >= total) return null
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onMore}
          className={cn(GHOST, "bg-muted hover:bg-accent px-4")}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" strokeWidth={2} />
          {t("selfService.list.more")}
        </button>
        <button type="button" onClick={onAll} className={cn(GHOST, "px-3")}>
          {t("selfService.list.showAll")}
        </button>
      </div>
      <p role="status" className="text-[0.6875rem] tabular-nums text-muted-foreground">
        {t("selfService.list.shownOf", {
          shown: number(shown, locale),
          total: number(total, locale),
        })}
      </p>
    </div>
  )
}
