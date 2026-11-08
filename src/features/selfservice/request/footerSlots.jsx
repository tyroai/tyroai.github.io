import { AdvanceLead } from "./advance/AdvanceLead"
import { ExpenseDetails } from "./expense/ExpenseDetails"
import { ExpenseTableBar } from "./ExpenseTableBar"
import { LeaveLead } from "./leave/LeaveLead"

/**
 * Alt şeridin iki yuvası (`RequestFooter`). `lead`: masaüstünde şeridin solu — masraf ızgarasında
 * kalan alanlar ("3 alan kaldı ›"), izinde gün · bakiye, avansta tutar. `info`: telefonda ⓘ'nin
 * yerine geçen düğme — yalnız masraf yazılırken: ayrıntı düğmesi (eksik varsa sarı uyarı; masrafın
 * özeti gövdede değil bu düğmenin kartında). `owners`: "Kimin adına" listesi; `expenses`: kişinin
 * masraf kayıtları; `via`: "Gönder"in yolu ("erp" · "chat", "Ne olacak?" adımları).
 */
export function footerSlots({
  kind,
  mobile,
  editing,
  table,
  review,
  form,
  idBase,
  balance,
  owners,
  expenses,
  via = "chat",
}) {
  let lead = null
  if (table && !review) lead = <ExpenseTableBar form={form} idBase={idBase} />
  else if (kind === "leave") lead = <LeaveLead values={form.values} balance={balance} />
  else if (kind === "advance") lead = <AdvanceLead values={form.values} />
  const info =
    mobile && editing ? (
      <ExpenseDetails form={form} idBase={idBase} owners={owners} history={expenses} via={via} />
    ) : null
  return { lead, info }
}
