import { expenseFormData, renderExpenseForm } from "@/features/selfservice/lib/expenseFormSheet"
import { formDate } from "@/features/selfservice/lib/formShell"
import { leaveFormData, renderLeaveForm } from "@/features/selfservice/lib/leaveFormSheet"

export { formAmount, formDate } from "@/features/selfservice/lib/formShell"
export { expenseFormData, renderExpenseForm } from "@/features/selfservice/lib/expenseFormSheet"
export { leaveFormData, renderLeaveForm } from "@/features/selfservice/lib/leaveFormSheet"

/**
 * Self Servis kaydından BASILI FORM — izin formu sohbettekinin (HR MCP) aynısı, masraf formu
 * Self Servis'e özgü.
 * Ortak kabuk `formShell.js`, izin formu `leaveFormSheet.js`, masraf formu `expenseFormSheet.js`;
 * burada kayıt → form seçimi. İmza satırı ("Personel İmzası") biçimi bir SÖZLEŞME: `signedForm.js` imzayı
 * oraya koyar.
 *
 * Veri ERP'ye ikinci kez sorulmaz: ekrandaki kayıt + profil. Saf metin işlemi (DOM yok).
 */

const safe = (s, fallback) => String(s ?? "").replace(/[^\p{L}\p{N}_-]/gu, "") || fallback

/** Kaydın formu: `{ html, name }` ya da (form çıkmayan tür) `null`. */
export function recordForm(record, person) {
  if (record?.kind === "leave") {
    const d = leaveFormData(record, person)
    // Yerel gün (toISOString UTC'ye çevirip TR'de günü bir geri kaydırırdı).
    const day = formDate(record.start)
      .split(".")
      .reverse()
      .map((p) => p.padStart(2, "0"))
      .join("-")
    return {
      html: renderLeaveForm(d),
      name: `Izin_Formu_${safe(d.personnelNo, "personel")}_${day}.html`,
    }
  }
  if (record?.kind === "expense") {
    return {
      html: renderExpenseForm(expenseFormData(record, person)),
      name: `Masraf_Formu_${safe(record.number, "masraf")}.html`,
    }
  }
  return null
}
