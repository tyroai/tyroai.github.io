import { useIsAppAdmin } from "@/hooks/useAuthorizations"
import { delegateFor } from "@/features/selfservice/lib/delegatePolicy"
import { msalInstance } from "@/lib/msal"
import { DELEGATE_ITEM, TABS } from "../kinds"

/**
 * "Yeni" menüsünün düğmeleri: üç talep (izin · masraf · avans) ve politikadaki kişide dördüncü olarak
 * Temsilci ata (`features/selfservice/lib/delegatePolicy.js`). Temsilci bir kayıt sekmesi değil, `TABS`a girmez.
 */
export function useNewKinds() {
  const isAppAdmin = useIsAppAdmin()
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  return delegateFor(account?.username, isAppAdmin) ? [...TABS, DELEGATE_ITEM] : TABS
}
