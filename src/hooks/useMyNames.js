import { useMemo } from "react"
import { useMsal } from "@azure/msal-react"

/** Oturumdaki kişinin görünen adları (hesap adı, belirteçteki ad ve ad + soyad): toplantı
 *  görevinin sahibiyle karşılaştırmak için (`lib/actionOwner`). */
export function useMyNames() {
  const { accounts } = useMsal()
  const account = accounts[0]
  return useMemo(() => {
    const claims = account?.idTokenClaims ?? {}
    const full =
      claims.given_name && claims.family_name ? `${claims.given_name} ${claims.family_name}` : null
    return [account?.name, claims.name, full].filter(Boolean)
  }, [account])
}
