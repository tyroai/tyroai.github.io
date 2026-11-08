import { HugeiconsIcon } from "@hugeicons/react"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { formatCount } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import "./onenote.css"

/**
 * Defter filtresi — başlıktaki defter adına basınca açılır (masaüstünde pencere, telefonda
 * çekmece): Tüm defterler + son sayfaları listede olan defterler (sayfa sayısıyla), seçili olanda tik. Altta
 * Yenile: kart kendiliğinden yoklamaz, tazelik kişinin elinde.
 */
export function NotebookMenu({ notebooks, total, value, onPick, onRefresh, busy }) {
  const { t, locale } = useLocale()
  const options = [{ id: null, name: t("onenote.all"), count: total }, ...notebooks]
  return (
    <div className="on-menu">
      <div role="listbox" aria-label={t("onenote.filter")} className="on-menu-list">
        {options.map((nb) => {
          const on = (value ?? null) === nb.id
          return (
            <button
              key={nb.id ?? "all"}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => onPick(nb.id)}
              className={cn("on-menu-item", on && "is-on")}
            >
              <span className="on-menu-check" aria-hidden="true">
                {on && <HugeiconsIcon icon={Tick02Icon} className="size-3.5" strokeWidth={2.4} />}
              </span>
              <span dir="auto" className="on-menu-name" title={nb.name}>
                {nb.name || t("onenote.untitledNotebook")}
              </span>
              <span className="on-menu-count">{formatCount(locale, nb.count)}</span>
            </button>
          )
        })}
      </div>
      <div className="on-menu-foot">
        <button
          type="button"
          onClick={onRefresh}
          disabled={busy}
          aria-busy={busy || undefined}
          className="on-menu-refresh"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            className={cn("size-3.5", busy && "on-spin")}
            strokeWidth={2}
          />
          {t("onenote.refresh")}
        </button>
      </div>
    </div>
  )
}
