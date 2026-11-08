/**
 * Katalog (agent · AI ürünü · iş uygulaması) — Dataverse cevabıyla önbelleğin birleşmesi (saf).
 * Tek kaynak Dataverse: tabloda ne tanımlıysa o, başka satır yok. Pakete gömülü yedek liste
 * kaldırıldı (eski "TYRO HR" gibi adlar sunucu okunamayınca katalog sanılıyor, erişim talebi
 * açılıyordu); önbellekten yalnız `tyro_logo` taşınır.
 */

export const COLLECTIONS = ["agents", "aiApps", "businessApps"]

// Koleksiyon türü zaten belli: adın küçük harfli hâli, sunucudaki tyro_NameTypeKey'in yarısı.
const nameKey = (x) => (x.name ?? "").trim().toLowerCase()

/**
 * Taze Dataverse cevabı + önceki durum → yeni durum: listeler sunucununki; `tyro_logo` dosya
 * kolonu cevapta gelmediği için önbellekteki logo önce kimlikle, sonra adla taşınır.
 */
export function mergeServerData(prev, data) {
  const merged = {}
  for (const key of COLLECTIONS) {
    const serverList = data?.[key] || []
    const prevList = prev?.[key] || []
    const prevById = new Map(prevList.map((x) => [x.id, x]))
    const prevByName = new Map(prevList.map((x) => [nameKey(x), x]))
    merged[key] = serverList.map((row) => {
      const cached = prevById.get(row.id) || prevByName.get(nameKey(row))
      return cached?.logo ? { ...row, logo: cached.logo } : row
    })
  }
  return merged
}
