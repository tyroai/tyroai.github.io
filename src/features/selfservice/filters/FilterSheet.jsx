import { useId, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import FilterRemoveIcon from "@hugeicons/core-free-icons/FilterRemoveIcon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { afterBackSettles } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { applyFilters, statusOptions } from "@/features/selfservice/lib/selfServiceFilters"
import { STATUS_TONE } from "@/lib/selfServiceStatus"
import { cn } from "@/lib/utils"
import { CHIP, GHOST } from "../chips"
import { number, TONE_DOT } from "../kinds"
import { useMonthOptions } from "./useMonthOptions"

const NONE = { status: null, facet: null, month: null }
const sameFilters = (a, b) => a.status === b.status && a.facet === b.facet && a.month === b.month

// Çekmecede seçilmemiş çip çerçevesiz dolgu: uzun kategori listesi kutu yığınına dönmesin.
const CHIP_IDLE = "bg-foreground/[0.05] font-medium text-foreground/80 hover:bg-foreground/[0.08]"
// Dolgulu seçeneklerin arasında seçili olan belirgin (koyu dolgu).
const CHIP_PICKED = "bg-foreground font-semibold text-background"

/** Tek seçimli çip grubu: "Tümü" + seçenekler, sayılarıyla. */
function ChoiceGroup({ label, allLabel, total, options, value, onChange }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="min-w-0">
      <h3
        id={id}
        className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
      >
        {label}
      </h3>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-1.5">
        {[{ key: null, label: allLabel, count: total }, ...options].map((o) => {
          const on = (value ?? null) === o.key
          return (
            <button
              key={o.key ?? "all"}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.key)}
              className={cn(
                CHIP,
                on ? CHIP_PICKED : CHIP_IDLE,
                "max-w-full justify-center pointer-coarse:min-w-11",
              )}
            >
              {o.dot && (
                <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", o.dot)} />
              )}
              <span lang={o.lang} className="truncate">
                {o.label}
              </span>
              {o.count != null && <span className="tabular-nums opacity-70">{o.count}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Telefonun süzgeç çekmecesi — durum, tür/kategori ve ay tek yerde, çip grupları olarak (geniş
 * ekranda araç çubuğundaki seçiciler ve durum çipleri). Seçimler çekmecede taslak; sayılar ve
 * "Sonuçları göster (n)" taslağa göre. Çekmece nasıl kapanırsa kapansın (düğme, ×, dışarı
 * dokunuş, Geri) taslak tek seferde ve çekmecenin geçmiş adımı geri alındıktan sonra adrese
 * yazılır (`onApply`, `afterBackSettles`): süzgeç geçmişe adım bırakmaz. Adreste `status`, `f`, `m`.
 */
export function FilterSheet({ open, onOpenChange, tab, view, query, onApply }) {
  const { t, locale } = useLocale()
  const months = useMonthOptions(view.monthOptions)
  const [draft, setDraft] = useState(view.filters)
  // Her açılış adresteki süzgeçlerle başlar.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft(view.filters)
  }
  const pick = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))
  // Durum çiplerinin sayısı öteki süzgeçlere ve aramaya uyanlardan (`useRecordsView` ile aynı).
  const preview = useMemo(() => {
    const narrowed = applyFilters(view.periodRecords, { ...draft, status: null, query })
    const counts = new Map(statusOptions(narrowed).map((o) => [o.id, o.count]))
    const shown = draft.status ? (counts.get(draft.status) ?? 0) : narrowed.length
    return { total: narrowed.length, counts, shown }
  }, [view.periodRecords, draft, query])
  const close = (next) => {
    if (next) return onOpenChange(true)
    onOpenChange(false)
    const chosen = { ...NONE, ...draft }
    if (!sameFilters(chosen, view.filters)) afterBackSettles(() => onApply(chosen))
  }
  const statuses = view.statusOptions.map((o) => ({
    key: o.id,
    label: t(`selfService.status.${o.id}`),
    count: preview.counts.get(o.id) ?? 0,
    dot: TONE_DOT[STATUS_TONE[o.id]],
  }))
  const facets = view.facetOptions.map((o) => ({ ...o, lang: "tr" }))
  const active = Boolean(draft.status || draft.facet || draft.month)
  return (
    <BottomSheet
      open={open}
      onOpenChange={close}
      title={t("selfService.filter.label")}
      closeOnBack
      footer={
        <div className="flex items-center justify-between gap-2 pb-1">
          <button
            type="button"
            onClick={() => setDraft(NONE)}
            disabled={!active}
            className={cn(GHOST, "-ms-2 px-3")}
          >
            <HugeiconsIcon icon={FilterRemoveIcon} aria-hidden="true" strokeWidth={1.9} />
            {t("selfService.filter.clear")}
          </button>
          <button
            type="button"
            onClick={() => close(false)}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand-fill-deep px-5 text-[0.875rem] font-semibold text-brand-on-brand transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
          >
            {t("selfService.filter.apply")}
            <span className="tabular-nums opacity-80">({number(preview.shown, locale)})</span>
          </button>
        </div>
      }
    >
      <div className="space-y-5 pb-3">
        {statuses.length > 0 && (
          <ChoiceGroup
            label={t("selfService.statusFilter")}
            allLabel={t("selfService.status.all")}
            total={preview.total}
            options={statuses}
            value={draft.status}
            onChange={pick("status")}
          />
        )}
        {facets.length > 0 && (
          <ChoiceGroup
            label={t(`selfService.facet.${tab}`)}
            allLabel={t("selfService.facet.all")}
            options={facets}
            value={draft.facet}
            onChange={pick("facet")}
          />
        )}
        {months.length > 1 && (
          <ChoiceGroup
            label={t("selfService.month.label")}
            allLabel={t("selfService.month.all")}
            options={months}
            value={draft.month}
            onChange={pick("month")}
          />
        )}
      </div>
    </BottomSheet>
  )
}
