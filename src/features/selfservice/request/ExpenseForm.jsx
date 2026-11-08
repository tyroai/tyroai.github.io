import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { lineRuns } from "@/features/selfservice/lib/expenseLine"
import { cn } from "@/lib/utils"
import { LineUndo } from "./expense/line/LineUndo"
import { EDGE } from "./expense/line/lineUi"
import { ExpenseRow } from "./ExpenseRow"
import { MAX_ROWS } from "./useExpenseRows"

// Odak nereye: kalemin ilk alanı (yeni, kopya, açılan, geri alınan), açık kartın başlığı
// (silinince öncekine geçildi) ya da kapanan kalemin satırı.
const TARGET = {
  start: "[data-row-start] button, [data-row-start] input",
  head: "[data-line-head]",
  row: "button[aria-expanded='false']",
}
// Silinen kalem 8 saniye geri alınabilir (ızgaranın geri almasıyla aynı süre).
const UNDO_MS = 8000
const ENTER = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }
const EXIT = { opacity: 0, scale: 0.98 }

/** Kalem görünür olur (uzun kartın başı), odak hedefine geçer — bir sonraki çizimde. */
function focusLine(idBase, id, target = "start") {
  if (!id) return
  requestAnimationFrame(() => {
    const el = document.getElementById(`${idBase}-${id}`)
    if (!el) return
    el.scrollIntoView({ block: "nearest" })
    el.querySelector(TARGET[target])?.focus({ preventScroll: true })
  })
}

// Kapalı kümedeki satırlar arası çizgi: yazının başından (numara ve kategori simgesinin sağından).
const DIVIDER =
  "before:pointer-events-none before:absolute before:end-0 before:start-[6.125rem] before:top-0 before:h-px before:bg-black/[0.06] dark:before:bg-white/[0.08]"

/**
 * Masraf girişi, telefon ve dar pencere (68rem altı): kalemler alt alta, bir anda tek kalem açık
 * kartında; arka arkaya kapalı kalemler tek bir liste kartı gibi (kategori, tarih, tutar).
 * "Kalem ekle" yeni kalemi açar (tarih ve para birimi öncekinden); kopyala ve sil kartta, silinen
 * kalem 8 saniye geri alınabilir (kalemin yerinde satır, `LineUndo`). Silme hep çizili bir canlı
 * bölgeyle duyurulur (metniyle eklenen bölgeyi ekran okuyucular çoğu kez okumaz). Yeni, kopya ya
 * da geri alınan kalem görünür olur, odak ilk alanına.
 */
export function ExpenseForm({ form, idBase }) {
  const { t } = useLocale()
  const { rows, active } = form.expense
  const full = rows.length >= MAX_ROWS
  const runs = useMemo(
    () =>
      lineRuns(
        rows.map((r) => r.id),
        active,
      ),
    [rows, active],
  )
  const go = (id, target) => focusLine(idBase, id, target)
  // Son silinen: `{ entry, n, after }` — geri alma satırı `after` kaleminin ardında durur.
  const [undo, setUndo] = useState(null)
  useEffect(() => {
    if (!undo) return
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS)
    return () => window.clearTimeout(timer)
  }, [undo])

  const remove = (row, n, at) => {
    const prev = rows[at > 0 ? at - 1 : 1]?.id
    const entry = form.expense.remove(row.id)
    if (!entry) return
    setUndo({ entry, n, after: prev })
    go(prev, "head")
  }
  const restore = () => {
    form.expense.restore(undo.entry)
    go(undo.entry.row.id)
    setUndo(null)
  }
  // Geri alma satırı silinenin yerinde (açılan önceki kalemin ardında); o kalem kapandıysa
  // kapalı kümeyi bölmesin diye listenin sonunda.
  const undoAfter = undo && (undo.after === active ? undo.after : rows[rows.length - 1]?.id)

  return (
    <div className="space-y-3">
      <ol aria-label={t("selfService.form.rows.title")} className="flex flex-col">
        <AnimatePresence initial={false}>
          {rows.map((r, i) => {
            const run = runs[i]
            const line = (
              <motion.li
                key={r.id}
                id={`${idBase}-${r.id}`}
                layout="position"
                {...ENTER}
                exit={EXIT}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative scroll-my-3 has-[[data-morph-open]]:z-30",
                  run.first && i > 0 && "mt-2.5",
                  !run.open && ["border-x bg-card", EDGE],
                  !run.open && run.first && "rounded-t-[1.125rem] border-t",
                  !run.open && run.last && "rounded-b-[1.125rem] border-b",
                  !run.open && !run.first && DIVIDER,
                )}
              >
                <ExpenseRow
                  form={form}
                  row={r}
                  n={i + 1}
                  idBase={idBase}
                  open={run.open}
                  errors={form.rowErrors?.[i]}
                  canAdd={!full}
                  first={run.first}
                  last={run.last}
                  onOpen={() => {
                    form.expense.activate(r.id)
                    go(r.id)
                  }}
                  onCollapse={() => {
                    form.expense.activate(null)
                    go(r.id, "row")
                  }}
                  onCopy={() => go(form.expense.duplicate(r.id))}
                  onRemove={rows.length > 1 ? () => remove(r, i + 1, i) : null}
                />
              </motion.li>
            )
            if (undoAfter !== r.id) return line
            return [
              line,
              <motion.li
                key={`undo-${undo.entry.row.id}`}
                layout="position"
                {...ENTER}
                exit={EXIT}
                transition={{ duration: 0.2 }}
                className="mt-2.5"
              >
                <LineUndo n={undo.n} onUndo={restore} />
              </motion.li>,
            ]
          })}
        </AnimatePresence>
      </ol>
      <button
        type="button"
        disabled={full}
        onClick={() => go(form.expense.append())}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[1.125rem] bg-brand/[0.06] text-[0.875rem] font-semibold text-brand-ink transition hover:bg-brand/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:bg-foreground/[0.04] disabled:text-muted-foreground"
      >
        <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" className="size-4" strokeWidth={2} />
        {full ? t("selfService.form.rowsFull", { n: MAX_ROWS }) : t("selfService.form.addRow")}
      </button>
      <p role="status" className="sr-only">
        {undo ? t("selfService.expense.removed", { n: undo.n }) : ""}
      </p>
    </div>
  )
}
