import { audienceAllows } from "@/lib/audience"

/**
 * TEMSİLCİ ATA — kim görsün, nereye gitsin. Tek kumanda noktası.
 *
 * İki giriş: izin ERP'ye işlenince başarı penceresindeki "Temsilci ata" ve "Yeni" menüsünün
 * dördüncü düğmesi. İkisi de bu politikaya bakar.
 *
 * `mode`:
 * - `"chat"` (bugün): "Gönder" atamayı İK asistanına (TYRO) bir cümleyle yollar
 *   (`features/selfservice/lib/delegateAsk.js`); atamayı HR MCP `create_delegation` yapar, önce onay ister.
 * - `"erp"`: kayıt Dataverse'teki `mserp_tryaiworkflowdelegationentities`e kişinin kendi oturumuyla
 *   yazılır (`features/selfservice/lib/delegateSubmit.js`). Bugün kapalı: yeni entity (`TRYAIWorkflowDelegationEntity`)
 *   kaydın kimliğini (Delegation ID) kendisi üretmiyor ve Dataverse onu gönderemiyor (F&O'da GUID,
 *   Dataverse'te metin — "Specified cast is not valid"); ERP düzeltince `"erp"` yapılır.
 *
 * `demo`: yalnız `"erp"` kipinde — yazım sahnelenir, hiçbir yere istek gitmez.
 * `audience`: `lib/audience.js` sözlüğü; herkes.
 */
export const DELEGATE = {
  enabled: true,
  audience: "*",
  mode: "chat",
  demo: false,
}

/** Bu oturum temsilci atamayı görür mü. */
export function delegateFor(upn, isAppAdmin, policy = DELEGATE) {
  return policy.enabled === true && audienceAllows(policy.audience, { upn, isAppAdmin })
}
