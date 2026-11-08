import { HugeiconsIcon } from "@hugeicons/react"
import Invoice03Icon from "@hugeicons/core-free-icons/Invoice03Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { countText } from "../../../kinds"
import { columnLabel } from "../../formUi"
import { SeenNotes } from "./SeenNotes"
import { TXT_BTN } from "./summaryUi"
import { TWIN_LINES } from "./warnCount"
import { LineChips, Note, Warn } from "./WarnRow"

/**
 * Dikkat notları ve fişler: önce ileri tarihli kalemler (tarihine götürür), ERP'de eşi olabilecek
 * kalemler (`SeenNotes`) ve birbirinin aynısı görünen kalemler (uyarı tonu); sonra masrafın
 * fişleri — kalemin değil masrafın (ERP'de başlığa eklenir, ⓘ): yeşil "3 fiş eklendi"
 * (`info.receipts`) ya da sarı "Fiş yok" ve başlığın fiş seçicisini açan "Fiş ekle"
 * (`onReceipt`). Hiçbiri gönderimi engellemez.
 */
export function ReceiptNotes({ info, onField, onReceipt, className }) {
  const { t, locale } = useLocale()
  const receipts = info.receipts ?? 0
  const row = (n) => t("selfService.form.row", { n })
  const dateLabel = columnLabel(t, locale, "date")
  return (
    <div className={cn("space-y-3", className)}>
      {info.future.length > 0 && (
        <Warn
          actions={
            <LineChips
              list={info.future}
              label={(n) => `${row(n)} · ${dateLabel}`}
              onPick={(rowId) => onField(rowId, "date")}
            />
          }
        >
          {countText(t, locale, "selfService.expense.summary.future", info.future.length)}
        </Warn>
      )}
      <SeenNotes list={info.submitted} onField={onField} />
      {info.duplicates.slice(0, TWIN_LINES).map((d) => (
        <Warn
          key={d.rowId}
          actions={
            <button type="button" className={TXT_BTN} onClick={() => onField(d.rowId, "amount")}>
              {t("selfService.leave.show")}
              <span className="sr-only"> · {row(d.n)}</span>
            </button>
          }
        >
          {t("selfService.expense.summary.duplicate", { a: d.of, b: d.n })}
        </Warn>
      ))}
      <Note
        tone={receipts ? "success" : "warning"}
        icon={Invoice03Icon}
        tip={t("selfService.expense.summary.erpNote")}
        end={
          !receipts && (
            // Satırın boyunu büyütmesin (24 px hedef korunur).
            <button type="button" className={cn(TXT_BTN, "-my-0.5")} onClick={onReceipt}>
              <HugeiconsIcon
                icon={PlusSignIcon}
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={2}
              />
              {t("selfService.form.receiptAdd")}
            </button>
          )
        }
      >
        <span className="tabular-nums">
          {receipts
            ? t("selfService.expense.receipts.added", {
                count: countText(t, locale, "selfService.expense.summary.receipts", receipts),
              })
            : t("selfService.expense.summary.noReceipts")}
        </span>
      </Note>
    </div>
  )
}
