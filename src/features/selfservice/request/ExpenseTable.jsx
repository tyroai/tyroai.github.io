import { useMemo, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { EXPENSE_ROW_OMIT, formFields } from "@/lib/requestForm"
import { ColumnMenu } from "./ColumnMenu"
import { ExpenseTableRow } from "./ExpenseTableRow"
import { GridFoot } from "./expense/table/GridFoot"
import { GridHead } from "./expense/table/GridHead"
import { KeyHint } from "./expense/table/KeyHint"
import { useGridApi } from "./expense/table/useGridApi"
import { useRowUndo } from "./expense/table/useRowUndo"
import { useStickyEdges } from "./expense/table/useStickyEdges"
import { MAX_ROWS } from "./useExpenseRows"
import "./expense/table/grid.css"

const ROW_IN = { opacity: 0, y: 6 }
const ROW_SHOWN = { opacity: 1, y: 0 }
const ROW_OUT = { opacity: 0, height: 0, overflow: "hidden" }
const ROW_TIME = { duration: 0.18 }

/**
 * MASRAF IZGARASI — masaüstünde 1–20 kalemin girişi (dar pencere ve telefonda kartlar). Her kalem
 * bir satır, hepsi aynı anda görünür; dinlenen satır sakin bir liste, yazılan satırın alanları
 * kutu olur. Sütunlar kişinin ("Sütunlar" menüsü); ızgarada olmayan isteğe bağlı alanlar kalemin
 * "Ayrıntı"sında. Başlık ve alt şerit (Kalem ekle · geri al · toplam) kartın içinde yapışık;
 * altında klavye ipucu. Klavye ve kalem işlemleri `useGridApi`de; ızgara en dar genişliğinin altına
 * inmez (`columns.minRem`: tutar ve para birimi hiç daralmaz), sığmazsa gövde yana kayar.
 * Excel'den yapıştırılan satırlar kalem olur (`paste`: gövdenin `usePasteRows`u; ilk ekrandan
 * yapıştırmanın sonucu da ızgaraya taşınır). Satırların giriş-çıkışı yerleşimi etkilemez
 * (`presenceAffectsLayout`): her tuşta bütün satırların hareketli alt ağacı yeniden çizilmesin,
 * `memo` yalnız yazılan kalemi çizsin.
 */
export function ExpenseTable({ form, idBase, columns, paste }) {
  const { t } = useLocale()
  const { rows, details } = form.expense
  const undo = useRowUndo()
  const api = useGridApi({ form, idBase, columns, undo, paste })
  const cardRef = useRef(null)
  useStickyEdges(cardRef)
  const extra = useMemo(() => formFields("expense", EXPENSE_ROW_OMIT).extra, [])
  const fields = useMemo(
    () => extra.filter((f) => !columns.visible.includes(f.name)),
    [extra, columns.visible],
  )
  const canAdd = rows.length < MAX_ROWS
  const below = typeof form.expense.insertAfter === "function"
  const titleId = `${idBase}-lines`

  return (
    // Klavye (Enter, Alt+N, Ctrl/⌘+Z) ve Excel'den yapıştırma bütün bölümde: "Sütunlar"dan da.
    <section
      aria-labelledby={titleId}
      data-tour="req-lines"
      onKeyDown={api.onKeyDown}
      onPaste={api.onPaste}
      className="min-w-0"
      style={{ minWidth: `${columns.minRem}rem` }}
    >
      <div className="mb-2 flex items-center gap-2 ps-1">
        <h3 id={titleId} className="text-[0.8125rem] font-semibold text-foreground">
          {t("selfService.form.rows.title")}
        </h3>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-foreground/[0.06] px-1.5 text-[0.75rem] font-semibold tabular-nums text-foreground/70">
          {rows.length}
        </span>
        <span className="flex-1" />
        <ColumnMenu columns={columns} />
      </div>
      <div
        ref={cardRef}
        className="xg relative rounded-[0.875rem] border border-black/[0.08] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-16px_rgb(0_0_0/0.12)] dark:border-white/[0.1]"
      >
        <GridHead columns={columns} />
        <div>
          <AnimatePresence initial={false} presenceAffectsLayout={false}>
            {rows.map((r, i) => (
              <motion.div
                key={r.id}
                initial={ROW_IN}
                animate={ROW_SHOWN}
                exit={ROW_OUT}
                transition={ROW_TIME}
                // Ayraç numaradan sonra başlar (iOS listesi gibi içeriden).
                className="xg-line relative before:pointer-events-none before:absolute before:end-0 before:start-[2.75rem] before:top-0 before:z-[1] before:h-px before:bg-black/[0.06] first:before:hidden has-[[data-morph-open]]:z-30 dark:before:bg-white/[0.07]"
              >
                <ExpenseTableRow
                  row={r}
                  n={i + 1}
                  idBase={idBase}
                  columns={columns}
                  fields={fields}
                  errors={form.rowErrors?.[i]}
                  open={details.has(r.id)}
                  canAdd={canAdd}
                  canRemove={rows.length > 1}
                  below={below}
                  api={api}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <GridFoot rows={rows} onAdd={api.add} undo={undo} onUndo={api.restore} paste={paste} />
      </div>
      <KeyHint />
    </section>
  )
}
