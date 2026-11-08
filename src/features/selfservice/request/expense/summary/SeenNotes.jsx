import { useLocale } from "@/hooks/useLocale"
import { countText, day, money } from "../../../kinds"
import { LineChips, Warn } from "./WarnRow"
import { TXT_BTN } from "./summaryUi"
import { SEEN_ONE_BY_ONE } from "./warnCount"

/**
 * ERP'de eşi olabilecek kalemler (`expenseInsights().submitted`): "Kalem 2 daha önce girilmiş
 * olabilir" ve altında eşi (15 Eki · Ulaşım (Yurtiçi) · ₺450,00 · EXP-0310), "Göster" kalemin
 * tutarına götürür. Çoksa tek satır ve kalem numaraları. Engellemez.
 */
export function SeenNotes({ list, onField }) {
  const { t, locale } = useLocale()
  if (!list?.length) return null
  const row = (n) => t("selfService.form.row", { n })
  if (list.length > SEEN_ONE_BY_ONE) {
    return (
      <Warn
        actions={<LineChips list={list} label={row} onPick={(rowId) => onField(rowId, "amount")} />}
      >
        {countText(t, locale, "selfService.expense.summary.seenMany", list.length)}
      </Warn>
    )
  }
  return list.map(({ rowId, n, match }) => (
    <Warn
      key={rowId}
      detail={[
        day(match.date, locale, false),
        match.category,
        money(match.amount, match.currency, locale),
        match.number,
      ].filter(Boolean)}
      actions={
        <button type="button" className={TXT_BTN} onClick={() => onField(rowId, "amount")}>
          {t("selfService.leave.show")}
          <span className="sr-only"> · {row(n)}</span>
        </button>
      }
    >
      {t("selfService.expense.summary.seen", { n })}
    </Warn>
  ))
}
