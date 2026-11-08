import { audienceAllows } from "@/lib/audience"

/**
 * Talep formunun "Gönder"i ERP'ye mi, sohbete mi yazar — kim, hangi formda. Tek kumanda noktası;
 * ayrıntı docs/features/self-servis-talep-erp.md.
 *
 * - `kinds`: "Gönder"in ERP'ye yazdığı formlar. Listede olmayan formda (iş avansı) "Gönder" talebi
 *   TYRO'ya (sohbete) yollar. Avans ERP tarafında "insert not allowed for field CashAdvanceNumber"
 *   ile düşüyor (entity'nin kendi doldurduğu alan); ERP düzeltince listeye `"advance"` eklenir —
 *   kurucusu ve yazımı hazır (`erpPayloads.js` › `advancePayload`, `erpSubmit.js` › `submitAdvance`).
 * - `audience`: herkes. Yazma kişinin KENDİ yetkisiyle yapılır; ERP Dataverse'ündeki rolünde bu
 *   tablolara oluşturma yetkisi olmayan kişide ERP 401/403 döner ve talep KENDİLİĞİNDEN TYRO'ya
 *   gider (`useErpSubmit` › `onDenied`) — kimse takılmaz, yetki verilince ERP yolu kendiliğinden
 *   çalışır. Tek tek kişi: UPN listesi; yalnız yöneticiler: `"appAdmins"`.
 */
export const ERP_DIRECT = Object.freeze({
  enabled: true,
  audience: "*",
  kinds: Object.freeze(["leave", "expense"]),
})

/** `isAppAdmin`: `useIsAppAdmin`in cevabı (`undefined` = henüz bilinmiyor → kapalı). */
export function erpDirectFor(kind, upn, policy = ERP_DIRECT, isAppAdmin = undefined) {
  return (
    policy.enabled === true &&
    policy.kinds.includes(kind) &&
    audienceAllows(policy.audience, { upn, isAppAdmin })
  )
}
