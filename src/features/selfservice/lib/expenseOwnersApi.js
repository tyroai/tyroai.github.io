import { aliasesOf } from "@/lib/selfServiceApi"
import { anyOf, list, token } from "@/lib/selfServiceHttp"
import {
  DELEGATION_SELECT,
  DELEGATION_SET,
  delegationFilter,
  ownersFromDelegations,
  titleCaseName,
} from "@/features/selfservice/lib/expenseOwners"

/**
 * Kişinin masraf girebileceği öteki kişiler — tarayıcıdan, kişinin KENDİ oturumuyla (Self Servis
 * sorgularının yolu). Adlar ERP'nin çalışan tablosundan; o sorgu düşerse e-postadan türetilir.
 * Yetki tablosu okunamazsa hata fırlar (çağıran "yalnız kendim" kipine düşer).
 */
export async function fetchExpenseOwners(account) {
  const self = aliasesOf(account)
  if (!self.length) return []
  const auth = await token(false)
  const rows = await list(auth, DELEGATION_SET, {
    $select: DELEGATION_SELECT,
    $filter: delegationFilter(self),
  })
  const emails = [...new Set(rows.map((r) => String(r.mserp_delegatingemail ?? "").trim()))]
  const names = {}
  if (emails.some(Boolean)) {
    try {
      const people = await list(auth, "mserp_tryaiworkersentities", {
        $select: "mserp_userinfo_networkalias,mserp_dirperson_name",
        $filter: anyOf("mserp_userinfo_networkalias", emails.filter(Boolean).slice(0, 20)),
      })
      for (const p of people) {
        const key = String(p.mserp_userinfo_networkalias ?? "").toLowerCase()
        if (key && p.mserp_dirperson_name) names[key] = titleCaseName(p.mserp_dirperson_name)
      }
    } catch {
      // Adlar süs: e-postadan türetilen ad yeter.
    }
  }
  return ownersFromDelegations(rows, { self, names })
}
