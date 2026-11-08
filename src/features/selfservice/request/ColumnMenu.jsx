import { useId } from "react"
import { Reorder, useDragControls } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import ColumnInsertIcon from "@hugeicons/core-free-icons/ColumnInsertIcon"
import DragDropVerticalIcon from "@hugeicons/core-free-icons/DragDropVerticalIcon"
import Refresh01Icon from "@hugeicons/core-free-icons/Refresh01Icon"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { isLocked } from "@/features/selfservice/lib/expenseColumns"
import { cn } from "@/lib/utils"
import { columnLabel } from "./formUi"

// Sohbet rıhtımı Escape'i pencerede dinliyor: menüyü kapatan Escape rıhtımı kapatmasın.
const keepEscape = (e) => e.stopPropagation()
const ARROW =
  "grid size-6 place-items-center rounded-md text-muted-foreground/70 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-30 pointer-coarse:size-9"

/**
 * Izgaranın başlık satırındaki "Kolonları düzenle" (ikonu marka tonunda) — kolon menüsü: hangi alan ızgarada görünsün
 * (zorunlular hep görünür) ve hangi sırayla. Sıra tutamaçla sürüklenir ya da oklarla taşınır
 * (klavye, dokunmatik). Izgarada olmayan alanlar kalemin "Ayrıntı"sında kalır. Düzen yerel
 * depoda (`useExpenseColumns`).
 */
export function ColumnMenu({ columns }) {
  const { t, locale } = useLocale()
  const titleId = useId()
  const { layout } = columns
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[0.75rem] font-semibold text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-brand/[0.08] data-[state=open]:text-brand-ink pointer-coarse:h-11"
        >
          <HugeiconsIcon
            icon={ColumnInsertIcon}
            aria-hidden="true"
            className="size-4 text-brand-ink"
            strokeWidth={1.8}
          />
          {t("selfService.form.cols.edit")}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        onEscapeKeyDown={keepEscape}
        aria-labelledby={titleId}
        className="w-[19rem] gap-0 rounded-2xl p-0 text-[0.8125rem]"
      >
        <div className="border-b border-border/60 px-4 pt-3.5 pb-3">
          <p id={titleId} className="text-[0.875rem] font-semibold text-foreground">
            {t("selfService.form.cols.title")}
          </p>
          <p className="mt-0.5 text-[0.75rem] leading-snug text-muted-foreground">
            {t("selfService.form.cols.hint")} {t("selfService.expense.grid.colsDetail")}
          </p>
        </div>
        <Reorder.Group
          as="ul"
          axis="y"
          values={layout.order}
          onReorder={columns.reorder}
          className="max-h-[min(27rem,60dvh)] overflow-y-auto p-1.5"
        >
          {layout.order.map((id, i) => (
            <ColumnItem
              key={id}
              id={id}
              label={columnLabel(t, locale, id)}
              shown={layout.shown.includes(id)}
              first={i === 0}
              last={i === layout.order.length - 1}
              columns={columns}
            />
          ))}
        </Reorder.Group>
        <div className="flex justify-end border-t border-border/60 px-2 py-1.5">
          <button
            type="button"
            onClick={columns.reset}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[0.75rem] font-medium text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={Refresh01Icon} aria-hidden="true" className="size-3.5" />
            {t("selfService.form.cols.reset")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ColumnItem({ id, label, shown, first, last, columns }) {
  const { t } = useLocale()
  const drag = useDragControls()
  const locked = isLocked(id)
  const boxId = `col-${id}`
  return (
    <Reorder.Item
      as="li"
      value={id}
      dragListener={false}
      dragControls={drag}
      className="relative flex items-center gap-1 rounded-xl bg-popover px-1 py-0.5 data-[dragging]:shadow-md"
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 24px -10px rgb(0 0 0 / 0.35)" }}
    >
      <button
        type="button"
        aria-label={t("selfService.form.cols.drag", { label })}
        onPointerDown={(e) => drag.start(e)}
        className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground/60 transition hover:text-foreground active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        tabIndex={-1}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} aria-hidden="true" className="size-4" />
      </button>
      <label
        htmlFor={boxId}
        className={cn(
          "flex min-h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5",
          locked ? "cursor-default" : "cursor-pointer",
        )}
      >
        <Checkbox
          id={boxId}
          checked={shown}
          disabled={locked}
          onCheckedChange={(on) => columns.show(id, on === true)}
        />
        <span className={cn("min-w-0 truncate", shown ? "text-foreground" : "text-foreground/70")}>
          {label}
        </span>
        {locked && (
          <span className="ms-auto shrink-0 text-[0.6875rem] text-muted-foreground">
            {t("selfService.form.cols.required")}
          </span>
        )}
      </label>
      <button
        type="button"
        disabled={first}
        onClick={() => columns.move(id, -1)}
        aria-label={t("selfService.form.cols.up", { label })}
        className={ARROW}
      >
        <HugeiconsIcon icon={ArrowUp01Icon} aria-hidden="true" className="size-3.5" />
      </button>
      <button
        type="button"
        disabled={last}
        onClick={() => columns.move(id, 1)}
        aria-label={t("selfService.form.cols.down", { label })}
        className={ARROW}
      >
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className="size-3.5" />
      </button>
    </Reorder.Item>
  )
}
