import { catalogNameKey } from "@/lib/agentName"
import { fold } from "@/lib/fold"

/**
 * Yetkiler çalışma alanının saf hesapları. Uygulama adı satırda METİN olarak durur ve eski
 * yazılışlar ("tyroSign") katalogdakiyle ("tyroSign") aynı uygulamadır: eşleşme her yerde
 * `catalogNameKey` ile (kilit denetimiyle aynı kural).
 */

/** Satır bu uygulamaya açıkça yetkili mi (yönetici olmasından bağımsız). */
export const hasApp = (row, app) => {
  const k = catalogNameKey(app)
  return (row?.apps ?? []).some((a) => catalogNameKey(a) === k)
}

/** Katalog adları → `{ name, count }` (kaç kişide açık yetki var), katalog sırasıyla. */
export function appCounts(rows, catalog) {
  return (catalog ?? []).map((name) => ({
    name,
    count: (rows ?? []).filter((r) => hasApp(r, name)).length,
  }))
}

/** Katalogda karşılığı olmayan (hiçbir şey açmayan) adı taşıyor mu. */
export const isStale = (row, known) => (row?.apps ?? []).some((a) => !known.has(a))

/**
 * Listenin süzgeci: `scope` "all" · "admins" · "stale"; `app` (katalog adı ya da null);
 * `query` hem adreste hem uygulama adlarında aranır.
 */
export function filterRows(rows, { query = "", scope = "all", app = null, known }) {
  const needle = fold(query)
  return (rows ?? []).filter((r) => {
    if (scope === "admins" && !r.isAdmin) return false
    if (scope === "stale" && !isStale(r, known)) return false
    if (app && !hasApp(r, app)) return false
    return !needle || fold(`${r.upn} ${r.apps.join(" ")}`).includes(needle)
  })
}

/** Katalog adları gruplu (asistan · AI ürünü · iş uygulaması) + satırdaki katalog dışı adlar. */
export function groupCatalog({ agents = [], aiApps = [], businessApps = [] }, extra = []) {
  const names = (list) => [...new Set(list.map((x) => (x?.name ?? "").trim()).filter(Boolean))]
  const groups = [
    { id: "agents", names: names(agents) },
    { id: "ai", names: names(aiApps) },
    { id: "business", names: names(businessApps) },
  ]
  const all = new Set(groups.flatMap((g) => g.names.map(catalogNameKey)))
  const orphans = [...new Set(extra)].filter((n) => !all.has(catalogNameKey(n)))
  if (orphans.length) groups.push({ id: "other", names: orphans })
  return groups.filter((g) => g.names.length)
}
