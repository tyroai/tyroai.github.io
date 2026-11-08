import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { expenseSummary } from "@/features/selfservice/lib/requestFormItems"
import { money } from "../../../kinds"
import { MAX_ROWS } from "../../useExpenseRows"
import { PasteStrip } from "../paste/PasteStrip"
import { UndoStrip } from "./UndoStrip"

/**
 * Izgaranın alt şeridi — kartın içinde, kaydırınca altta yapışık cam: solda "Kalem ekle" (20'de
 * kapalı, "En çok 20 kalem"), silinen kalemin ve Excel'den yapıştırmanın (`paste`) geri alınması;
 * sağda "Toplam · n kalem" ve para birimine göre toplamlar (TRY önce, çevrilmez: kur kaynağı yok).
 */
export function GridFoot({ rows, onAdd, undo, onUndo, paste }) {
  const { t, locale } = useLocale()
  const full = rows.length >= MAX_ROWS
  const { count, totals } = useMemo(() => expenseSummary(rows, locale), [rows, locale])
  return (
    <div className="xg-glass sticky bottom-[var(--xg-bottom,0px)] z-20 flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 rounded-b-[0.8125rem] border-t border-black/[0.06] bg-card/95 py-1.5 ps-2 pe-4 backdrop-blur-xl dark:border-white/[0.08]">
      <button
        type="button"
        disabled={full}
        onClick={() => onAdd()}
        className="group/add relative inline-flex h-9 items-center gap-2 rounded-lg ps-1.5 pe-2.5 text-[0.8125rem] font-semibold text-foreground/85 transition hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:text-muted-foreground pointer-coarse:h-11"
      >
        <span
          aria-hidden="true"
          className="grid size-6 place-items-center rounded-full bg-brand/[0.1] text-brand-ink transition group-hover/add:bg-brand-fill-deep group-hover/add:text-brand-on-brand group-disabled/add:bg-foreground/[0.06] group-disabled/add:text-muted-foreground"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" strokeWidth={2.2} />
        </span>
        {full ? t("selfService.form.rowsFull", { n: MAX_ROWS }) : t("selfService.form.addRow")}
      </button>
      <UndoStrip undo={undo} onUndo={onUndo} />
      {paste && <PasteStrip paste={paste} />}
      <p className="ms-auto flex min-w-0 flex-wrap items-baseline justify-end gap-x-4 gap-y-0.5">
        <span className="text-[0.75rem] font-medium text-muted-foreground">
          {t("selfService.form.total", { n: count })}
        </span>
        {totals.length ? (
          totals.map(([cur, sum]) => (
            <span
              key={cur}
              className="text-[0.9375rem] font-semibold tracking-[-0.01em] tabular-nums text-foreground"
            >
              {money(sum, cur, locale)}
            </span>
          ))
        ) : (
          <span className="text-[0.9375rem] font-semibold text-muted-foreground">—</span>
        )}
      </p>
    </div>
  )
}
