import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { useLocale } from "@/hooks/useLocale"
import "@/lib/i18n/widgetEdit"

/**
 * Kataloğun üst çubuğu: SOLDA bölüm çipleri, SAĞDA arama düğmesi. Çipler `aria-pressed`li
 * düğmeler (filtre, sekme değil: liste aramayla da daralıyor); sayı o bölümde aramaya uyan
 * widget sayısı. Arama kapalıyken yuvarlak düğme; basınca (ya da katalogda yazmaya başlayınca,
 * `WidgetCatalog`) alan açılır, boşken odaktan çıkınca kapanır. Telefonda çipler tek satırlık
 * kaydırmalı şerit (sonu kesik görünür).
 */
export function CatalogFilters({
  inputRef,
  query,
  onQuery,
  searching,
  onSearching,
  groups,
  group,
  onGroup,
  total,
}) {
  const { t } = useLocale()
  const open = searching || Boolean(query)
  return (
    <div className="widget-catalog__filters">
      <div role="group" aria-label={t("widgetEdit.groups")} className="widget-catalog__chips">
        <Chip pressed={group == null} onClick={() => onGroup(null)} count={total}>
          {t("widgetEdit.all")}
        </Chip>
        {groups.map((g) => (
          <Chip
            key={g.id}
            pressed={group === g.id}
            onClick={() => onGroup(group === g.id ? null : g.id)}
            count={g.count}
            disabled={!g.count}
          >
            {t(`widgetEdit.group.${g.id}`)}
          </Chip>
        ))}
      </div>
      <div className="widget-catalog__search" data-open={open || undefined}>
        {open ? (
          <>
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={1.8}
              aria-hidden="true"
              className="widget-catalog__search-icon"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              onBlur={() => !query && onSearching(false)}
              placeholder={t("widgetEdit.search")}
              aria-label={t("widgetEdit.search")}
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              className="widget-catalog__input"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  onQuery("")
                  inputRef.current?.focus()
                }}
                aria-label={t("widgetEdit.searchClear")}
                title={t("widgetEdit.searchClear")}
                className="widget-catalog__clear"
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.2} className="size-3.5" />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => onSearching(true)}
            aria-label={t("widgetEdit.search")}
            title={t("widgetEdit.search")}
            className="widget-catalog__search-btn"
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

function Chip({ pressed, onClick, count, disabled, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-disabled={(disabled && !pressed) || undefined}
      onClick={() => !(disabled && !pressed) && onClick()}
      className="widget-catalog__chip"
    >
      {children}
      <span className="widget-catalog__count">{count}</span>
    </button>
  )
}
