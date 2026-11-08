import {
  fetchAuthorizationFor,
  setRequestCompleted,
  updateAuthorizedApps,
} from "@/lib/authorizations"
import { findRow } from "../apps/appIndex"

/**
 * Onay öncesi kişinin listesinde uygulama AYNI yazılışla var mıydı? Varsa geri almak onu
 * silmez — yalnız bu onayın eklediği çıkar (`approveRequest` da tam yazılışa bakar).
 */
export function hadAppBefore(rows, { upn, app }) {
  const row = findRow(rows, upn)
  return !!row && (row.apps ?? []).includes(app)
}

/**
 * Onayı geri alır (Gmail "Geri al"): yanlış tıklama yetki verir. Satır taze okunur (onay yeni
 * satır açmış olabilir); bu onayın eklediği ad çıkar, talep yeniden bekler.
 */
export async function undoApproval({ upn, app, requestId }, had) {
  if (!had) {
    const row = await fetchAuthorizationFor(upn)
    if (row)
      await updateAuthorizedApps(
        row.id,
        row.apps.filter((a) => a !== app),
      )
  }
  await setRequestCompleted(requestId, false)
}
