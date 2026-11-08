import { useEffect, useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { COMPANIES } from "@/data/hrValues"
import { fetchExpenseOwners } from "@/features/selfservice/lib/expenseOwnersApi"
import { isMsalConfigured } from "@/lib/msal"

/**
 * Masraf formunun "Kimin adına" listesi: kişinin kendisi + yetki verenler (İK'nın vekâlet tablosu).
 * `status`: "loading" · "ready" · "error". Önbellek yok — form her açılışta bir kez okur, liste
 * form kapanınca gider (kişisel veri bellekte kalmaz). Okunamazsa form "yalnız kendim" çalışır.
 * Dönen nesne liste değişmedikçe aynı: masrafın başlığı her tuşta yeniden çizilmesin (`memo`).
 *
 * `me` (Self Servis profili: `{ name, companyCode }`): "Kendim" yerine yazılan ad (`name`; yoksa
 * oturumun adı) ve formun açıldığı şirket (`company`): İK görünümünün şirket kodu şirket
 * listesinde varsa o kod — başlıkta listeden seçilmiş gibi kod · tam adıyla gelir. Kod yoksa (İK
 * kaydı bulunamadı) ya da listede değilse boş: form "Kendi şirketim" ile açılır. Graph'tan gelen
 * şirket adı sayılmaz. Kimin adına yine SELF gönderilir: İK MCP'si kişiyi kendisi çözer.
 */
export function useExpenseOwners(enabled, me = null) {
  const { accounts } = useMsal()
  const account = accounts[0] ?? null
  const live = enabled && isMsalConfigured && Boolean(account)
  const [state, setState] = useState(() => ({
    status: live ? "loading" : "ready",
    owners: [],
  }))

  useEffect(() => {
    if (!live) return undefined
    let alive = true
    fetchExpenseOwners(account)
      .then((owners) => alive && setState({ status: "ready", owners }))
      .catch(() => alive && setState({ status: "error", owners: [] }))
    return () => {
      alive = false
    }
  }, [live, account])

  const self = account?.username ?? ""
  const name = String(me?.name ?? "").trim() || String(account?.name ?? "").trim()
  const code = String(me?.companyCode ?? "")
    .trim()
    .toUpperCase()
  const company = COMPANIES[code] ? code : ""
  return useMemo(() => ({ ...state, self, name, company }), [state, self, name, company])
}
