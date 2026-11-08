// Yenilikler kuralları — listeden bağımsız saf fonksiyonlar. Arşiv (`changelog.js`, metinli) ve dizin
// (`changelogIndex.js`, yalnız karar alanları) AYNI kuralları kullanır: açılışta dizinle verilen karar
// (pencere, okunmamış rozeti) sayfadaki arşiv listesiyle hiçbir zaman ayrışmaz. Gerekçeler
// `changelog.js`teki yardımcıların başında.

export const KIND_ORDER = { feature: 0, improvement: 1, fix: 2 }

const OPEN_EVERYWHERE = () => true

/** Kullanıcının bu yüzeyde görebileceği kayıtlar (kitle, düzeltme yüzeyi, açılamayan sayfa). */
export function visibleIn(
  list,
  { isAdmin = false, surface = "page", canOpen = OPEN_EVERYWHERE } = {},
) {
  return list.filter((e) => {
    if (e.audience === "admins" && !isAdmin) return false
    if (e.kind === "fix" && (surface !== "page" || !isAdmin)) return false
    if (e.route && !canOpen(e.route)) return false
    if (e.to && !canOpen(e.to)) return false
    return true
  })
}

/** Listenin en yeni kaydının kimliği. */
export const latestIdIn = (entries) => entries?.[0]?.id ?? null

/** Kimlik katalogda var mı (yaş ve onarım soruları süzülmüş listeye değil kataloğa sorulur). */
export const hasIdIn = (all, id) => all.some((e) => e.id === id)

/** `seenId`den sonra eklenenler; sıra katalogdaki yerdir. İşaret katalogda yoksa boş. */
export function sinceIn(all, seenId, entries) {
  if (!seenId) return []
  const at = all.findIndex((e) => e.id === seenId)
  if (at === -1) return []
  const seenIds = new Set(all.slice(at).map((e) => e.id))
  return entries.filter((e) => !seenIds.has(e.id))
}
