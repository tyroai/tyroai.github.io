import { useMyManager } from "@/hooks/useMyManager"
import { ApproverRow } from "../../ApproverRow"
import { CategoryBars } from "./CategoryBars"
import { openHeadReceipts } from "../receipts/headReceipts"
import { MissingList } from "./MissingList"
import { ReceiptNotes } from "./ReceiptNotes"

/**
 * Özetin bölümleri: eksikler · uyarılar ve fişler · kategoriler · yönetici (başkası adına yok:
 * kişinin kendi yöneticisi o masrafın onayıyla ilgisiz; yönetici bilinmiyorsa satır da boş hücre de
 * yok). `summary`: `useExpenseSummary`; `cls(i)`:
 * i. bölümün hücre sınıfı (yerleşime göre); `onJump`: bir alana ya da fiş seçicisine götürmeden
 * önce çağrılır (telefonun ayrıntı kartı kapansın).
 */
export function SummaryParts({ side, summary, idBase, onBehalf, cls, onJump }) {
  const manager = useMyManager()
  const { info, tried, errors, errorRows } = summary
  const go = (rowId, field) => {
    onJump?.()
    summary.go(rowId, field)
  }
  return (
    <>
      <MissingList
        side={side}
        items={info.missing}
        tried={tried}
        errors={errors}
        errorRows={errorRows}
        onGo={go}
        className={cls(0)}
      />
      <ReceiptNotes
        info={info}
        onField={go}
        onReceipt={() => {
          onJump?.()
          openHeadReceipts(idBase)
        }}
        className={cls(1)}
      />
      {(info.categories.top.length > 0 || !side) && (
        <CategoryBars side={side} cats={info.categories} className={cls(2)} />
      )}
      {!onBehalf && manager && (
        <div className={cls(3)}>
          <ApproverRow manager={manager} />
        </div>
      )}
    </>
  )
}
