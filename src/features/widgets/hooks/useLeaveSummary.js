import { useCallback, useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { peekSelfService, pendingSelfService } from "@/hooks/useSelfService"
import { errorCause } from "@/lib/errorCause"
import { isMsalConfigured } from "@/lib/msal"
import { fetchLeaveSummary } from "@/lib/selfServiceApi"
import { createSessionCache } from "@/lib/sessionCache"

/**
 * "İzin bakiyem" kartının verisi. Self Servis'in tam verisi tazeyse (sayfa 5 dk içinde açıldı) o
 * okunur, ek istek yok; tam okuma o an uçuştaysa (ör. panoda Taleplerim de var) o beklenir;
 * değilse HAFİF okuma (`fetchLeaveSummary`: çalışan + bakiye + gelecek izinler). Durum `useSelfService`inkiyle aynı: loading · ready · notFound · denied · error ·
 * signedOut. Önbellek yalnız bellekte, hesap başına, 5 dk; çıkışta silinir
 * (`lib/sessionCache`) — izin kayıtları kişisel veri.
 */
const cache = createSessionCache({ ttlMs: 5 * 60 * 1000, maxEntries: 1, name: "leaveSummary" })

/** Bellekteki son hafif okuma (aynı hesap, taze) ya da `null`; istek atmaz. */
export function peekLeaveSummary(account) {
  const key = account?.homeAccountId
  return key ? (cache.get(key) ?? null) : null
}

export function clearLeaveSummaryCache() {
  cache.clear()
}

/** Kartın okuması (kanca ve birim testi). */
export function loadLeaveSummary(account, { force = false, interactive = false } = {}) {
  const key = account.homeAccountId
  const full = peekSelfService(account)
  if (!force && full?.status === "ready") return Promise.resolve(full)
  if (!force && cache.has(key)) return Promise.resolve(cache.get(key))
  return cache.dedupe(
    key,
    (commit) => {
      const light = () =>
        fetchLeaveSummary(account, { interactive }).then((data) => {
          const value = data.worker ? { status: "ready", data } : { status: "notFound", data: null }
          commit(value)
          return value
        })
      // Bir mikro görev sonra bakılır: aynı karede bağlanan Taleplerim'in tam okuması o an başlamış
      // olur (efekt sırası panodaki sıraya bağlı). Tam okumanın sonucu neyse o: aynı ERP'ye ikinci
      // istek yetkiyi ya da kaydı değiştirmez.
      return Promise.resolve()
        .then(() => (force || interactive ? null : pendingSelfService(account)))
        .then((shared) => shared ?? light())
        .catch((err) => ({
          status: err?.kind === "denied" ? "denied" : "error",
          // Ekranda neden: ERP hatası kendi kodunu taşır, öteki hata (ağ, zaman aşımı) çözülür.
          detail: err?.kind ? err.message : errorCause("erp", err),
          data: null,
        }))
    },
    { share: !interactive },
  )
}

export function useLeaveSummary() {
  const { accounts } = useMsal()
  const account = accounts[0] ?? null
  const signedIn = isMsalConfigured && Boolean(account)
  const key = signedIn ? account.homeAccountId : null
  const [state, setState] = useState(null) // { key, value }

  const run = useCallback(
    (opts = {}) => {
      if (!signedIn) return
      const owner = account.homeAccountId
      loadLeaveSummary(account, opts).then((value) => setState({ key: owner, value }))
    },
    [account, signedIn],
  )

  useEffect(() => {
    run()
  }, [run])

  const current =
    key && state?.key === key
      ? state.value
      : { status: signedIn ? "loading" : "signedOut", data: null }
  return { ...current, connect: () => run({ force: true, interactive: true }) }
}
