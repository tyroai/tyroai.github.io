// Plan sürümlerinin karşılaştırması (ağsız, test edilebilir).

/**
 * `a` sürümü `b`den gerçekten yeni mi? Dataverse aynı sürüm için de 304 yerine 200 dönebiliyor:
 * etiket farklı VE kayıt zamanı sonra olmalı.
 */
export function isNewer(a, b) {
  if (!a?.etag || !b?.etag || a.etag === b.etag) return false
  const ta = Date.parse(a.modifiedOn ?? "")
  const tb = Date.parse(b.modifiedOn ?? "")
  return Number.isNaN(ta) || Number.isNaN(tb) ? true : ta > tb
}
