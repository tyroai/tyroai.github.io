import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import FilterHorizontalIcon from "@hugeicons/core-free-icons/FilterHorizontalIcon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { FilterSheet } from "../filters/FilterSheet"
import { number } from "../kinds"
import { ExpandingSearch } from "./ExpandingSearch"

/**
 * Telefonun araç çubuğu: arama (büyüteç; basınca açılır, `ExpandingSearch`) + tek "Süzgeç" düğmesi — durum,
 * tür/kategori ve ay alttan çekmecede (`FilterSheet`). Etkin süzgeç sayısı düğmede rozet; süzgeç
 * varken düğme seçili tonda. Sekmede süzülecek bir şey yoksa düğme çizilmez.
 */
export function PhoneToolbar({ tab, query, onQuery, view, onFilters }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const { status, facet, month } = view.filters
  const active = [status, facet, month].filter(Boolean).length
  const any =
    active > 0 ||
    view.statusOptions.length > 0 ||
    view.facetOptions.length > 0 ||
    view.monthOptions.length > 1
  return (
    <div data-tour="ss-tools" className="flex min-w-0 items-center gap-2">
      <ExpandingSearch
        value={query}
        onChange={onQuery}
        placeholder={t(`selfService.search.${tab}`)}
        shortcut
        className="flex-1"
      />
      {any && (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className={cn(
            // Araç çubuğu standardı: ikincil eylem gri kapsül (`control`), 500.
            "inline-flex h-control shrink-0 items-center gap-1.5 rounded-full px-3.5 text-callout transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            active
              ? "bg-brand/[0.1] text-foreground ring-1 ring-inset ring-brand/40"
              : "bg-muted text-foreground hover:bg-accent",
          )}
        >
          <HugeiconsIcon
            icon={FilterHorizontalIcon}
            aria-hidden="true"
            className={cn("size-4", active && "text-brand-ink")}
            strokeWidth={1.9}
          />
          {t("selfService.filter.label")}
          {active > 0 && (
            <>
              <span
                aria-hidden="true"
                className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-fill-deep px-1 text-[0.6875rem] font-bold tabular-nums text-brand-on-brand"
              >
                {number(active, locale)}
              </span>
              <span className="sr-only">{t("selfService.filter.active", { n: active })}</span>
            </>
          )}
        </button>
      )}
      <FilterSheet
        open={open}
        onOpenChange={setOpen}
        tab={tab}
        view={view}
        query={query}
        onApply={onFilters}
      />
    </div>
  )
}
