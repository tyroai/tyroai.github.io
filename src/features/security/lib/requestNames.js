import { catalogNameKey } from "@/lib/agentName"

/**
 * Talepleri katalogdaki GÜNCEL adla döndürür: eski kayıt "TYRO Trader" yazıyor olabilir,
 * katalogda "tyroTrader". Ekran o adı gösterir ve onay yetki satırına O adı yazar; ham değer
 * `requestedApp`ta kalır. Katalogda karşılığı olmayan ad olduğu gibi kalır ("Katalogda yok").
 */
export function withCatalogNames(requests, catalogNames) {
  const byKey = new Map()
  for (const name of catalogNames ?? []) {
    const key = catalogNameKey(name)
    if (key && !byKey.has(key)) byKey.set(key, String(name).trim())
  }
  return (requests ?? []).map((r) => {
    const current = byKey.get(catalogNameKey(r.app))
    return current && current !== r.app ? { ...r, app: current, requestedApp: r.app } : r
  })
}
