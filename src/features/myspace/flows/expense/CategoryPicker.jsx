import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { fold } from "@/lib/fold"
import { PhotoPicker } from "../shared/PhotoPicker"
import { quickCategories } from "./expenseArt"

/**
 * Masraf kategorisi: arama, altında sık kullanılanlar illüstrasyonlu dairelerle (yalnız arama boşken)
 * ve ERP'nin bütün kategorileri liste olarak. Enter ilk eşleşeni seçer.
 */
export function CategoryPicker({ options, value, onPick }) {
  const { t } = useLocale()
  const [q, setQ] = useState("")
  const quick = useMemo(() => quickCategories(options), [options])
  const needle = fold(q.trim())
  const list = useMemo(
    () => (needle ? options.filter((o) => fold(o).includes(needle)) : options),
    [options, needle],
  )
  return (
    <div className="af-list">
      <label className="af-search">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" />
        <input
          data-autofocus=""
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && list.length) {
              e.preventDefault()
              onPick(list[0])
            }
          }}
          placeholder={t("advanceFlow.expense.search")}
          aria-label={t("advanceFlow.expense.search")}
          autoComplete="off"
          enterKeyHint="done"
        />
      </label>
      {!needle && (
        <>
          <p className="af-card-kicker">{t("advanceFlow.expense.quick")}</p>
          <PhotoPicker
            art
            label={t("advanceFlow.expense.quick")}
            items={quick}
            value={value}
            onPick={onPick}
          />
          <p className="af-card-kicker">{t("advanceFlow.expense.all")}</p>
        </>
      )}
      {list.length ? (
        <div className="af-list-rows af-list-rows--short">
          {list.map((o) => (
            <button
              key={o}
              type="button"
              className="af-list-row"
              aria-pressed={o === value}
              onClick={() => onPick(o)}
            >
              <span className="af-list-name">{o}</span>
              {o === value && (
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.4} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="af-empty">{t("advanceFlow.empty")}</p>
      )}
    </div>
  )
}
