import { useCallback, useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { isMsalConfigured } from "@/lib/msal"
import { fetchSelfService } from "@/lib/selfServiceApi"
import { createSessionCache } from "@/lib/sessionCache"
import { worstSelfService } from "@/dev/worstCase/selfService"

/**
 * Self Servis verisi: `status` — "loading" · "ready" · "notFound" (ERP'de çalışan kaydı yok)
 * · "denied" (izin/onay yok) · "error" · "signedOut". Hazırken `data` = `{ worker, balance,
 * leaves, expenses, advances, failed, truncated }` (bölüm düşerse `null`); `updatedAt` son
 * başarılı okumanın zamanı (ms) — dönem çubuğundaki "Güncellendi 14:32".
 *
 * ⚠️ Önbellek YALNIZ BELLEKTE, hesap başına ve çıkışta silinir (`lib/sessionCache`): izin ve
 * masraf kayıtları kişisel veri. Çıkıştan sonra dönen cevap yazılmaz. 5 dakika taze; sayfaya
 * dönüşte beklemeden çizilir, "Yenile" zorlar.
 *
 * `poll()`: arka plan yoklaması (yeni kayıt gözcüsü). Düşerse yüklü sayfa kalır, yalnız
 * `pollFailed` işaretlenir — kullanıcının bir şey yapmadığı istek sayfayı hata ekranına çevirmez.
 */
const cache = createSessionCache({ ttlMs: 5 * 60 * 1000, maxEntries: 1, name: "selfService" })

/**
 * Tam verinin tazesi (aynı hesap, 5 dk içinde) — başka kancalar ağa çıkmadan okusun. `stale`:
 * süresi geçmiş son okuma da (çentik göstergesi; çıkışta yine silinir).
 */
export function peekSelfService(account, { stale = false } = {}) {
  const key = account?.homeAccountId
  return key ? (cache.get(key, { stale }) ?? null) : null
}

/** Uçuştaki tam okuma (aynı hesap) ya da null — hafif okuma onu beklesin, ikinci istek gitmesin. */
export function pendingSelfService(account) {
  const key = account?.homeAccountId
  return key ? (cache.pending(key) ?? null) : null
}

export function clearSelfServiceCache() {
  cache.clear()
}

function load(account, { force = false, interactive = false } = {}) {
  const key = account.homeAccountId
  if (!force && cache.has(key)) return Promise.resolve(cache.get(key))
  return cache.dedupe(
    key,
    (commit) =>
      fetchSelfService(account, { interactive })
        .then((data) => {
          const updatedAt = Date.now()
          const value = data.worker
            ? { status: "ready", data, updatedAt }
            : { status: "notFound", data: null, updatedAt }
          commit(value)
          return value
        })
        .catch((err) => ({
          status: err?.kind === "denied" ? "denied" : "error",
          data: null,
          detail: err?.message,
        })),
    { share: !interactive },
  )
}

export function useSelfService() {
  const { accounts } = useMsal()
  const account = accounts[0] ?? null
  const signedIn = isMsalConfigured && Boolean(account)
  const key = signedIn ? account.homeAccountId : null
  // { key, value, pollFailed } — yalnız aynı hesabın durumu gösterilir.
  const [state, setState] = useState(() => {
    const last = key ? cache.get(key, { stale: true }) : undefined
    return last ? { key, value: last } : null
  })
  const [busy, setBusy] = useState(false)

  const run = useCallback(
    (opts = {}) => {
      if (!signedIn) return
      const owner = account.homeAccountId
      setBusy(true)
      load(account, opts).then((value) => {
        setState((prev) => {
          const keep =
            opts.quiet &&
            value.status !== "ready" &&
            prev?.key === owner &&
            prev.value.status === "ready"
          // Neden kodu (`detail`) da tutulur: yoklama satırı nedenini yazsın.
          return keep
            ? { ...prev, pollFailed: true, pollDetail: value.detail }
            : { key: owner, value }
        })
        setBusy(false)
      })
    },
    [account, signedIn],
  )

  // Açılışta ve hesap değişince okunur (`busy` işareti eşzamanlı kalkar).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run()
  }, [run])

  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstSelfService() : null
  const current =
    worst ??
    (key && state?.key === key
      ? state.value
      : { status: signedIn ? "loading" : "signedOut", data: null })
  return {
    ...current,
    pollFailed: Boolean(key && state?.key === key && state.pollFailed),
    pollDetail: key && state?.key === key && state.pollFailed ? (state.pollDetail ?? null) : null,
    busy,
    refresh: () => run({ force: true }),
    poll: () => run({ force: true, quiet: true }),
    connect: () => run({ force: true, interactive: true }),
  }
}
