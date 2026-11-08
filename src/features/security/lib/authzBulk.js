import { catalogNameKey } from "@/lib/agentName"

/**
 * Toplu "uygulama ver / al" planı — yazmadan önce kimin değişeceğini hesaplar (onay kutusu tam
 * olarak bunu söyler). Eşleşme `catalogNameKey` ile: "tyroSign" kaydı "tyroSign" sayılır.
 * Yönetici (`adminBypass` açıkken) her uygulamayı zaten açar: listesi değiştirilmez. Kaydı
 * değişmeyecek kişi (vermede zaten var, almada zaten yok) atlanır; ağ turu harcanmaz.
 *
 * @param {{ id: string, upn: string, apps: string[], isAdmin: boolean }[]} rows seçili kayıtlar
 * @param {{ mode: "grant" | "revoke", apps: string[], adminBypass?: boolean }} opts
 */
export function planBulk(rows, { mode, apps, adminBypass = true }) {
  const wanted = new Map()
  for (const a of apps ?? []) {
    const k = catalogNameKey(a)
    if (k && !wanted.has(k)) wanted.set(k, a)
  }
  const changes = []
  const admins = []
  const unchanged = []
  for (const row of rows ?? []) {
    if (adminBypass && row.isAdmin) {
      admins.push(row.id)
      continue
    }
    const own = row.apps ?? []
    let after = null
    if (mode === "grant") {
      const have = new Set(own.map(catalogNameKey))
      const missing = [...wanted].filter(([k]) => !have.has(k)).map(([, name]) => name)
      if (missing.length) after = [...own, ...missing]
    } else {
      const kept = own.filter((a) => !wanted.has(catalogNameKey(a)))
      if (kept.length !== own.length) after = kept
    }
    if (after) changes.push({ id: row.id, upn: row.upn, before: own, after })
    else unchanged.push(row.id)
  }
  return { changes, admins, unchanged }
}

/**
 * Toplu kutunun seçenekleri, sayılar SEÇİLİ kişiler içinde ("kaçında zaten var"). Vermede
 * katalog; almada yalnız seçililerin gerçekten taşıdığı adlar (katalog dışı yazılışlar dahil —
 * temizlenebilsinler), katalogdaki yazılışla.
 *
 * @param {{ apps: string[] }[]} rows
 * @param {string[]} catalog
 * @param {"grant" | "revoke"} mode
 */
export function bulkOptions(rows, catalog, mode) {
  const counts = new Map()
  const spelled = new Map((catalog ?? []).map((name) => [catalogNameKey(name), name]))
  for (const row of rows ?? []) {
    for (const k of new Set((row.apps ?? []).map(catalogNameKey))) {
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    for (const a of row.apps ?? []) {
      const k = catalogNameKey(a)
      if (!spelled.has(k)) spelled.set(k, a)
    }
  }
  const keys =
    mode === "grant"
      ? [...new Set((catalog ?? []).map(catalogNameKey))]
      : [...counts.keys()].sort((a, b) => spelled.get(a).localeCompare(spelled.get(b)))
  return keys.map((k) => ({ name: spelled.get(k), count: counts.get(k) ?? 0 }))
}

/**
 * İşleri en çok `limit` eşzamanlı koşturur (Dataverse'i 850 istekle boğmamak için). Durdurulunca
 * (`signal`) yeni iş başlamaz, süren işler biter; başlamayanlar `cancelled` listesinde döner.
 * Bir işin hatası ötekileri durdurmaz: sonuç tek tek `ok` / `error` taşır.
 *
 * @template T
 * @param {T[]} items
 * @param {(item: T) => Promise<unknown>} worker
 * @param {{ limit?: number, signal?: AbortSignal, onProgress?: (done: number, total: number) => void }} [opts]
 * @returns {Promise<{ results: { item: T, ok: boolean, error?: unknown }[], cancelled: T[] }>}
 */
export async function runQueue(items, worker, { limit = 4, signal, onProgress } = {}) {
  const results = []
  let next = 0
  let done = 0
  const lane = async () => {
    while (next < items.length && !signal?.aborted) {
      const item = items[next++]
      try {
        await worker(item)
        results.push({ item, ok: true })
      } catch (error) {
        results.push({ item, ok: false, error })
      }
      done += 1
      onProgress?.(done, items.length)
    }
  }
  const lanes = Math.max(1, Math.min(limit, items.length))
  await Promise.all(Array.from({ length: lanes }, lane))
  return { results, cancelled: items.slice(next) }
}
