import { memo, useMemo, useState } from "react"
import { AnimatePresence } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { firstEmptyColumn, missingFields } from "@/features/selfservice/lib/expenseColumns"
import { detailError, filledCount } from "@/features/selfservice/lib/requestFormItems"
import { cn } from "@/lib/utils"
import { ExpenseCell } from "./ExpenseCell"
import { ExpenseRowDetails } from "./ExpenseRowDetails"
import { RowActions } from "./expense/table/RowActions"
import { RowNumber } from "./expense/table/RowNumber"
import { RowHint } from "./expense/RowHint"

/**
 * Masraf ızgarasının bir kalemi: # (durumuyla) · kişinin sütunları (sırasıyla) · eylemler; altında
 * gerekirse ince ipucu satırı (kategori önerisi, ileri tarih ya da olası mükerrer; kategorinin
 * hizasında) ve
 * "Ayrıntı" paneli. Yazılan satır vurgulanır, alanları kutu olur (`grid.css`). Fiş kalemde
 * değil (masrafın başlığında): satıra bırakılan dosya gövdenin bırakma alanına gider. `memo`:
 * yalnız kendi kalemi ya da hatası değişince yeniden çizilir; mükerrer uyarısı bağlamdan
 * (`LineWarningsProvider`) yalnız numarayı ve ipucunu yeniden çizer.
 */
function Row({ row, n, idBase, columns, fields, errors, open, canAdd, canRemove, below, api }) {
  const { t } = useLocale()
  const base = `${idBase}-${row.id}`
  const rowName = t("selfService.form.row", { n })
  const { visible, grid } = columns
  const missing = useMemo(() => missingFields(visible, row.values), [visible, row.values])
  const start = firstEmptyColumn(visible, row.values)
  const names = fields.map((f) => f.name)
  const badge = filledCount(row.values, names)
  const invalid = Boolean(errors && Object.keys(errors).length)
  // Tarih takvimi açıkken odak pencerenin dışında: satır yine "yazılan" görünür (`grid.css`).
  const [active, setActive] = useState(false)
  const onSet = (name, value) => api.set(row.id, name, value)
  // İpucu kategori sütununun hizasında başlar (kişi sütunları taşısa da).
  const hintAt = Math.max(visible.indexOf("category"), 0) + 2

  return (
    <div
      id={base}
      role="group"
      aria-label={rowName}
      data-row={row.id}
      data-active={active || undefined}
      className={cn(
        "xg-row group/row relative grid scroll-mb-16 scroll-mt-12 items-start gap-x-2 px-2 py-1.5 transition-colors",
        "hover:bg-foreground/[0.018]",
        open && "bg-foreground/[0.012]",
        "has-[[data-morph-open]]:z-30",
      )}
      style={{ gridTemplateColumns: grid }}
    >
      <RowNumber row={row} n={n} invalid={invalid} missing={missing} />
      {visible.map((id) => (
        <ExpenseCell
          key={id}
          id={id}
          row={row}
          base={base}
          rowName={rowName}
          errors={errors}
          onSet={onSet}
          onPopover={setActive}
          start={id === start}
        />
      ))}
      <RowActions
        n={n}
        base={base}
        open={open}
        badge={badge}
        bad={detailError(errors, names)}
        canAdd={canAdd}
        canRemove={canRemove}
        below={below}
        onAdd={() => api.add(row.id)}
        onDetails={() => api.details(row.id)}
        onCopy={() => api.copy(row.id)}
        onRemove={() => api.remove(row.id, n)}
      />
      <div className="min-w-0" style={{ gridColumn: `${hintAt} / -1` }}>
        <RowHint
          row={row}
          onPick={(c) => onSet("category", c)}
          focusId={`${base}-category`}
          className="pb-1 ps-1 pt-1"
        />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <ExpenseRowDetails
            id={`${base}-details`}
            n={n}
            base={base}
            row={row}
            rowName={rowName}
            fields={fields}
            errors={errors}
            onSet={onSet}
            onPin={api.pin}
            style={{ gridColumn: "2 / -1" }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Hatalar her çizimde yeni nesne: içerik aynıysa satır yeniden çizilmez.
const sameErrors = (a, b) => {
  if (a === b) return true
  const ka = Object.keys(a ?? {})
  return ka.length === Object.keys(b ?? {}).length && ka.every((k) => a[k] === b?.[k])
}

export const ExpenseTableRow = memo(
  Row,
  (a, b) =>
    a.row === b.row &&
    a.n === b.n &&
    a.columns === b.columns &&
    a.fields === b.fields &&
    a.open === b.open &&
    a.canAdd === b.canAdd &&
    a.canRemove === b.canRemove &&
    a.below === b.below &&
    a.api === b.api &&
    a.idBase === b.idBase &&
    sameErrors(a.errors, b.errors),
)
