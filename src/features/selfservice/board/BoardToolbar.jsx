import { HugeiconsIcon } from "@hugeicons/react"
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon"
import FilterRemoveIcon from "@hugeicons/core-free-icons/FilterRemoveIcon"
import Tag01Icon from "@hugeicons/core-free-icons/Tag01Icon"
import { useLocale } from "@/hooks/useLocale"
import { FacetMenu } from "../filters/FacetMenu"
import { StatusChips } from "../filters/StatusChips"
import { useMonthOptions } from "../filters/useMonthOptions"
import { ExpandingSearch } from "./ExpandingSearch"
import "./boardToolbar.css"

/**
 * Listenin araç çubuğu: SOLDA durum çipleri (listenin kapsamı — göz önce onu okur), SAĞDA araçlar:
 * tür/kategori ve ay seçici, Temizle ve arama (yalnız büyüteç; basınca ya da "/" ile açılır —
 * `ExpandingSearch`). Süzgeçler adreste (`f`, `m`,
 * `status`); arama yerel. Geniş kapta (≥ 64rem) tek satır, arama sağda sabit genişlikte
 * (`boardToolbar.css`); daha dar kapta üstte tam en çipler, altta araçlar ve kalan eni dolduran
 * arama. Arapçada düzen aynalanır (flex + mantıksal yön).
 */
export function BoardToolbar({ tab, query, onQuery, view, onFacet, onMonth, onStatus, onClear }) {
  const { t } = useLocale()
  const months = useMonthOptions(view.monthOptions)
  const active = Boolean(query || view.filters.status || view.filters.facet || view.filters.month)

  return (
    <div data-tour="ss-tools" className="flex flex-wrap items-center gap-2">
      {view.statusOptions.length > 0 && (
        <div className="w-full min-w-0 @[64rem]/ss:w-auto">
          <StatusChips
            options={view.statusOptions}
            total={view.statusTotal}
            value={view.filters.status}
            onChange={onStatus}
          />
        </div>
      )}
      <div className="flex min-w-0 flex-1 basis-40 items-center justify-end gap-2">
        {view.facetOptions.length > 0 && (
          <FacetMenu
            icon={Tag01Icon}
            label={t(`selfService.facet.${tab}`)}
            allLabel={t("selfService.facet.all")}
            value={view.filters.facet}
            options={view.facetOptions}
            onSelect={onFacet}
            compact
          />
        )}
        {months.length > 1 && (
          <FacetMenu
            icon={Calendar01Icon}
            label={t("selfService.month.label")}
            allLabel={t("selfService.month.all")}
            value={view.filters.month}
            options={months}
            onSelect={onMonth}
            compact
          />
        )}
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
          >
            <HugeiconsIcon icon={FilterRemoveIcon} aria-hidden="true" className="size-3.5" />
            {t("selfService.filter.clear")}
          </button>
        )}
        <ExpandingSearch
          value={query}
          onChange={onQuery}
          placeholder={t(`selfService.search.${tab}`)}
          shortcut
          className="ss-search flex-1 basis-40 @[40rem]/ss:basis-56"
        />
      </div>
    </div>
  )
}
