import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { countText } from "../../../kinds"
import { columnLabel } from "../../formUi"
import { CHIP, CHIP_ERROR, CHIP_NEED, COUNT, TXT_BTN, title } from "./summaryUi"

// Açık gösterilen kalem sayısı; fazlası "+n kalem daha" ile açılır.
const LIMIT = 3

/** Eksikleri kalem kalem toplar: `[{ rowId, n, fields: [{ field, error }] }]`. */
function byLine(items) {
  const out = []
  for (const it of items) {
    const last = out[out.length - 1]
    if (last?.rowId === it.rowId) last.fields.push(it)
    else out.push({ rowId: it.rowId, n: it.n, fields: [it] })
  }
  return out
}

/**
 * "Eksikler": gönderimi engelleyen alanlar, kalem kalem; her alan onu açan bir düğme ("Kalem 2 ·
 * Kategori"). Durum renkleri: çipler hafif kırmızı (eksik); gönderme denendikten sonra başlık
 * kırmızı ve alt şeritteki sayıyla aynı (`errors`), hatası görünen kalemlerin (`errorRows`)
 * çipleri net kırmızı. Eksik yoksa yeşil ✓ "Tüm kalemler hazır" (gözden geçirme adımı ⓘ'de).
 * `items`: `expenseInsights().missing`; `tried`: gönderme denendi ve hâlâ hata var; `side`: yan
 * panelin başlık boyu.
 */
export function MissingList({ items, tried, errors, errorRows, side, onGo, className }) {
  const { t, locale } = useLocale()
  const [all, setAll] = useState(false)
  const lines = useMemo(() => byLine(items), [items])

  if (!lines.length) {
    return (
      <div className={className}>
        <p className={cn(title(side), "text-success-ink")}>
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success/14">
            <HugeiconsIcon
              icon={Tick02Icon}
              aria-hidden="true"
              className="size-3.5"
              strokeWidth={2.4}
            />
          </span>
          {t("selfService.expense.summary.ready")}
          <InfoTip
            text={t("selfService.expense.summary.how3")}
            className="-ms-1 text-muted-foreground"
          />
        </p>
      </div>
    )
  }

  const shown = all ? lines : lines.slice(0, LIMIT)
  const hidden = lines.length - LIMIT
  return (
    <div className={className}>
      <p className={cn(title(side), tried && "text-danger-ink")}>
        {tried
          ? t("selfService.form.err.summary", { n: errors })
          : t("selfService.expense.summary.missing")}
        {!tried && (
          <span className={cn(COUNT, "bg-danger/10 text-danger-ink")}>{items.length}</span>
        )}
      </p>
      <ul className="mt-2 space-y-1.5">
        {shown.map((line) => {
          const row = t("selfService.form.row", { n: line.n })
          return (
            <li key={line.rowId} className="flex items-start gap-2">
              <span className="min-w-[3.75rem] shrink-0 whitespace-nowrap text-[0.75rem] leading-[max(1.75rem,24px)] text-muted-foreground tabular-nums pointer-coarse:leading-[2.75rem]">
                {row}
              </span>
              <span className="flex min-w-0 flex-wrap gap-1.5">
                {line.fields.map(({ field, error }) => {
                  const name = columnLabel(t, locale, field)
                  const label =
                    error === "amount"
                      ? t("selfService.expense.summary.invalid", { field: name })
                      : name
                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => onGo(line.rowId, field)}
                      aria-label={`${row} · ${label}`}
                      className={cn(
                        CHIP,
                        tried && errorRows?.has(line.rowId) ? CHIP_ERROR : CHIP_NEED,
                      )}
                    >
                      <span className="truncate">{label}</span>
                    </button>
                  )
                })}
              </span>
            </li>
          )
        })}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll((v) => !v)}
          className={cn(TXT_BTN, "mt-2")}
        >
          {all
            ? t("selfService.leave.hide")
            : countText(t, locale, "selfService.expense.summary.moreLines", hidden)}
        </button>
      )}
    </div>
  )
}
