import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { fold } from "@/lib/fold"

/**
 * Aramalı satır listesi (yansıtma şirketi: kod · unvan). Enter ilk eşleşeni seçer.
 * `options`: `{ value, title, note? }`.
 */
export function ListPicker({ options, value, onPick, searchLabel }) {
  const { t } = useLocale()
  const [q, setQ] = useState("")
  const list = useMemo(() => {
    const needle = fold(q.trim())
    return needle
      ? options.filter((o) => fold(`${o.title} ${o.note ?? ""}`).includes(needle))
      : options
  }, [options, q])
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
              onPick(list[0].value)
            }
          }}
          placeholder={searchLabel}
          aria-label={searchLabel}
          autoComplete="off"
          enterKeyHint="done"
        />
      </label>
      {list.length ? (
        <div className="af-list-rows">
          {list.map((o) => (
            <button
              key={o.value}
              type="button"
              className="af-list-row"
              aria-pressed={o.value === value}
              onClick={() => onPick(o.value)}
            >
              <b>{o.title}</b>
              {o.note && <span>{o.note}</span>}
              {o.value === value && (
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
