import { peekSelfService } from "@/hooks/useSelfService"
import { createSessionCache } from "@/lib/sessionCache"
import { fetchLeaveSummary } from "@/lib/selfServiceApi"
import { isAbsence } from "@/lib/selfServiceNames"
import { COUNTED_IN_TOTALS, statusKind } from "@/lib/selfServiceStatus"

// İzin tarihleri kişisel veri: yalnız bellekte, hesap başına, 6 saat; çıkışta silinir.
const cache = createSessionCache({ ttlMs: 6 * 3600_000, maxEntries: 1, name: "oofLeaves" })

/**
 * Onaylı (ya da onaysız işlenmiş) izin kayıtları → `{ start, end }`; evden çalışma, dış görev düşer.
 * İzin listesi okunamadıysa (`null`) sonuç da `null`: "izin yok" değil "bilinmiyor".
 */
export function approvedSpans(leaves) {
  if (!Array.isArray(leaves)) return null
  return leaves
    .filter(
      (r) =>
        r?.start &&
        isAbsence(r) &&
        COUNTED_IN_TOTALS.includes(r.statusKind ?? statusKind(r.status)),
    )
    .map((r) => ({ start: r.start, end: r.end ?? r.start }))
}

/**
 * Otomatik yanıt için onaylı izinler. Self Servis'in tam verisi tazeyse ondan (ek istek yok), yoksa
 * hafif okuma (çalışan + bakiye + bugün süren ve gelecek izinler, `fetchLeaveSummary`). Okunamazsa
 * `null` (önbelleğe girmez): soru sorulmaz — ERP'nin bir hatası "izin iptal" sanılıp kurulu yanıtın
 * kaldırılması önerilmesin; kutucuk elle kurmayı yine sunar.
 */
export function loadApprovedLeaves(account) {
  const key = account?.homeAccountId
  if (!key) return Promise.resolve(null)
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  const full = peekSelfService(account)
  const fromFull = full?.status === "ready" ? approvedSpans(full.data?.leaves) : null
  if (fromFull) {
    cache.set(key, fromFull)
    return Promise.resolve(fromFull)
  }
  return cache.dedupe(key, (commit) =>
    fetchLeaveSummary(account)
      .then((data) => {
        const spans = approvedSpans(data?.leaves)
        if (spans) commit(spans)
        return spans
      })
      .catch(() => null),
  )
}
