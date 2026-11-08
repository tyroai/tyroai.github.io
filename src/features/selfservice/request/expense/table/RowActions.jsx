import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { ActionTip } from "../../field/ActionTip"

const BTN =
  "relative grid size-[max(1.625rem,24px)] shrink-0 place-items-center rounded-[0.4375rem] text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-35 pointer-coarse:size-11 [&_svg]:size-[0.9375rem]"

// Kopyala ve sil fareyle yalnız satırın üstündeyken ya da satır yazılırken görünür (yirmi kalemde
// kırk simge gürültü olur); dokunmatikte hep görünür. Sekmeyle gelince satır odakta: görünür.
const REVEAL =
  "flex items-center gap-0.5 transition-opacity duration-150 pointer-fine:opacity-0 pointer-fine:group-hover/row:opacity-100 pointer-fine:group-focus-within/row:opacity-100 pointer-fine:group-data-[active]/row:opacity-100"

/**
 * Kalemin eylemleri: yapışık çift "+" (yeni kalem, `below` ise hemen altına) | "⌄" (Ayrıntı:
 * dolu alan sayısı ya da hata rozetiyle), kopyala, sil. Çiftin çerçevesi yalnız satır
 * üstündeyken ya da yazılırken belirir; kopyala ve sil de (fareyle). Ayrıntıda hatalı alan varsa
 * düğme bunu ekran okuyucuya da söyler (`bad`). Sil anında olur, geri alma alt şeritte. Her ikonun
 * üstünde adı balonla (`ActionTip`).
 */
export function RowActions({
  n,
  base,
  open,
  badge,
  bad,
  canAdd,
  canRemove,
  below,
  onAdd,
  onDetails,
  onCopy,
  onRemove,
}) {
  const { t } = useLocale()
  // "+" kalemin hemen altına ekler; o işlem yoksa sona (ad buna göre).
  const addLabel = below
    ? t("selfService.expense.grid.addBelow", { n })
    : t("selfService.form.addRow")
  return (
    <div className="flex h-10 items-center justify-end gap-0.5 pointer-coarse:h-11">
      <div className="me-0.5 flex items-center rounded-[0.5rem] ring-1 ring-transparent transition-shadow group-hover/row:ring-black/[0.08] group-focus-within/row:ring-black/[0.08] group-data-[active]/row:ring-black/[0.08] dark:group-hover/row:ring-white/[0.1] dark:group-focus-within/row:ring-white/[0.1] dark:group-data-[active]/row:ring-white/[0.1]">
        <ActionTip label={addLabel}>
          <button
            type="button"
            data-action="add"
            disabled={!canAdd}
            onClick={onAdd}
            aria-label={addLabel}
            className={cn(BTN, "rounded-e-none")}
          >
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" strokeWidth={2} />
          </button>
        </ActionTip>
        <ActionTip label={t("selfService.form.detailsFor", { n })}>
          <button
            type="button"
            data-action="details"
            onClick={onDetails}
            aria-expanded={open}
            aria-controls={open ? `${base}-details` : undefined}
            aria-label={t("selfService.form.detailsFor", { n })}
            aria-describedby={bad ? `${base}-details-error` : undefined}
            className={cn(
              BTN,
              "rounded-s-none",
              open && "bg-foreground/[0.06] text-foreground",
              bad && "text-danger-ink",
            )}
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              aria-hidden="true"
              strokeWidth={2}
              className={cn("transition-transform duration-200", open && "rotate-180")}
            />
            {(badge > 0 || bad) && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.6875rem] font-semibold leading-none tabular-nums ring-2 ring-card",
                  bad
                    ? "bg-danger text-white dark:text-background"
                    : "bg-brand-fill-deep text-brand-on-brand",
                )}
              >
                {bad ? "!" : badge}
              </span>
            )}
            {bad && (
              <span id={`${base}-details-error`} className="sr-only">
                {t("selfService.expense.grid.detailsError")}
              </span>
            )}
          </button>
        </ActionTip>
      </div>
      <div className={REVEAL}>
        <ActionTip label={t("selfService.form.rowCopy", { n })}>
          <button
            type="button"
            data-action="copy"
            disabled={!canAdd}
            onClick={onCopy}
            aria-label={t("selfService.form.rowCopy", { n })}
            className={BTN}
          >
            <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" strokeWidth={1.8} />
          </button>
        </ActionTip>
        <ActionTip label={t("selfService.form.rowRemove", { n })}>
          <button
            type="button"
            data-action="remove"
            disabled={!canRemove}
            onClick={onRemove}
            aria-label={t("selfService.form.rowRemove", { n })}
            className={cn(BTN, "hover:bg-danger/10 hover:text-danger-ink")}
          >
            <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" strokeWidth={1.8} />
          </button>
        </ActionTip>
      </div>
    </div>
  )
}
