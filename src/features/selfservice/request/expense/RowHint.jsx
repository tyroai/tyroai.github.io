import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { isFutureDate, suggestCategories } from "@/features/selfservice/lib/expenseHints"
import { cn } from "@/lib/utils"
import { useLineWarning } from "./history/lineWarningsContext"
import { warningTexts } from "./history/warningText"
import { WarnNote } from "./history/WarnNote"
import { refocus } from "./refocus"

const CHIP =
  "inline-flex h-[max(1.75rem,24px)] max-w-full items-center rounded-full border border-border bg-background px-2.5 text-[0.75rem] font-medium transition hover:border-brand/45 hover:bg-brand/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"

/**
 * Kalemin tek ipucu (en önemlisi): tarih ileriyse uyarı; sonra olası mükerrer (ERP'de eşi ya da
 * formda aynısı, `useLineWarning`); ikisi de yoksa kategori boşken açıklama ve firma adından en
 * çok iki öneri (`features/selfservice/lib/expenseHints`). Uyarılar engellemez. Öneri seçilmeden yazılmaz. Seçilince
 * öneriler kalkar: odak kalemin kategorisine geçer (`focusId`), kişi yerini yitirmez.
 */
export function RowHint({ row, onPick, focusId, className }) {
  const { t, locale } = useLocale()
  const today = useToday()
  const values = row.values
  const { note, firm, currency, category, date } = values
  const warning = useLineWarning(row)
  const options = useMemo(
    () => (category ? [] : suggestCategories({ note, firm, currency })),
    [category, note, firm, currency],
  )
  if (isFutureDate(date, today)) {
    return <WarnNote className={className}>{t("selfService.expense.future")}</WarnNote>
  }
  const warn = warningTexts(t, locale, warning, values)[0]
  if (warn) return <WarnNote className={className}>{warn}</WarnNote>
  if (!options.length) return null
  return (
    <div
      role="group"
      aria-label={t("selfService.expense.suggest")}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      <span className="text-[0.75rem] text-muted-foreground">
        {t("selfService.expense.suggest")}
      </span>
      {options.map((c) => (
        <button
          key={c}
          type="button"
          className={CHIP}
          onClick={() => {
            onPick(c)
            if (focusId) refocus(() => document.getElementById(focusId))
          }}
        >
          <span className="truncate">{c}</span>
        </button>
      ))}
    </div>
  )
}
