import { catalogNameKey } from "@/lib/agentName"
import { fold } from "@/lib/fold"

/**
 * Uygulamalar dizininin saf hesapları. Uygulama adı satırda METİN olarak durur; eski yazılış
 * ("tyroSign") katalogdakiyle ("tyroSign") aynı uygulamadır: eşleşme her yerde `catalogNameKey`.
 */

/** Grupların sırası: katalog bölümleri, en sonda katalogda olmayan adlar. */
export const GROUP_ORDER = ["agents", "ai", "business", "other"]

/** Katalog listeleri → ad anahtarı ↦ `{ name, group, logo, iconName }` (ilk yazılış kazanır). */
export function catalogLookup({ agents = [], aiApps = [], businessApps = [] } = {}) {
  const map = new Map()
  const add = (list, group) => {
    for (const item of list ?? []) {
      const name = String(item?.name ?? "").trim()
      const key = catalogNameKey(name)
      if (!key || map.has(key)) continue
      map.set(key, { name, group, logo: item.logo || null, iconName: item.iconName || null })
    }
  }
  add(agents, "agents")
  add(aiApps, "ai")
  add(businessApps, "business")
  return map
}

/**
 * Dizin: katalogdaki her uygulama + satırlarda ya da taleplerde yazılı ama katalogda olmayan
 * adlar (`group: "other"`). `people`: adı listesinde AÇIKÇA yazılı satır sayısı (yöneticinin
 * kilidi atlaması sayılmaz); `pending`: bu uygulamaya bekleyen talep sayısı.
 */
export function buildAppIndex(lookup, rows = [], requests = []) {
  const apps = new Map()
  for (const [key, item] of lookup) apps.set(key, { key, ...item, people: 0, pending: 0 })
  const ensure = (name) => {
    const key = catalogNameKey(name)
    if (!key) return null
    if (!apps.has(key)) {
      const label = String(name).trim()
      apps.set(key, {
        key,
        name: label,
        group: "other",
        logo: null,
        iconName: null,
        people: 0,
        pending: 0,
      })
    }
    return apps.get(key)
  }
  for (const row of rows ?? []) {
    const seen = new Set()
    for (const name of row.apps ?? []) {
      const app = ensure(name)
      if (!app || seen.has(app.key)) continue
      seen.add(app.key)
      app.people += 1
    }
  }
  for (const req of requests ?? []) {
    if (req.isCompleted) continue
    const app = ensure(req.app)
    if (app) app.pending += 1
  }
  return [...apps.values()]
}

/** Arama + sıralama ("name" · "people" · "pending") sonrası gruplu liste; boş grup düşer. */
export function groupApps(apps, { query = "", sort = "name", locale } = {}) {
  const needle = fold(query)
  const byName = (a, b) => a.name.localeCompare(b.name, locale)
  const cmp =
    sort === "people"
      ? (a, b) => b.people - a.people || byName(a, b)
      : sort === "pending"
        ? (a, b) => b.pending - a.pending || byName(a, b)
        : byName
  return GROUP_ORDER.map((id) => ({
    id,
    apps: (apps ?? [])
      .filter((a) => a.group === id && (!needle || fold(a.name).includes(needle)))
      .sort(cmp),
  })).filter((g) => g.apps.length > 0)
}

const hasKey = (row, key) => (row?.apps ?? []).some((a) => catalogNameKey(a) === key)
const byUpn = (a, b) => a.upn.localeCompare(b.upn)

/** Uygulamaya açıkça yetkili satırlar, adrese göre. */
export function appMembers(rows, key) {
  return (rows ?? []).filter((r) => hasKey(r, key)).sort(byUpn)
}

/** Kilidi atlayan yöneticiler (listede adı YAZILI olmayanlar): atanmış sayılmazlar. */
export function appAdmins(rows, key, adminBypass) {
  if (!adminBypass) return []
  return (rows ?? []).filter((r) => r.isAdmin && !hasKey(r, key)).sort(byUpn)
}

/** Bu uygulamanın talepleri: bekleyenler, en yeni önce. */
export function appRequests(requests, key) {
  return (requests ?? []).filter((r) => !r.isCompleted && catalogNameKey(r.app) === key)
}

/** Giriş adresine göre satır (büyük/küçük harf ve boşluk farkı yok sayılır). */
export function findRow(rows, upn) {
  const k = String(upn ?? "")
    .trim()
    .toLowerCase()
  if (!k) return null
  return (rows ?? []).find((r) => r.upn.trim().toLowerCase() === k) ?? null
}

/** Satırın listesinden bu uygulamayı (her yazılışıyla) çıkarır. */
export const withoutApp = (apps, key) => (apps ?? []).filter((a) => catalogNameKey(a) !== key)

/**
 * "Kişi ekle"nin planı: `empty` · `invalid` (biçim gevşek: tek `@`, iki yanında karakter —
 * UPN posta kuralına uymak zorunda değil) · `already` (zaten açık) · `update` (satırı var,
 * listesine eklenir) · `create` (satırı yok, bu uygulamayla açılır).
 */
export function addPlan(rows, upn, key) {
  const trimmed = String(upn ?? "").trim()
  if (!trimmed) return { kind: "empty", row: null }
  if (!/^[^\s@]+@[^\s@]+$/.test(trimmed)) return { kind: "invalid", row: null }
  const row = findRow(rows, trimmed)
  if (!row) return { kind: "create", row: null }
  return { kind: hasKey(row, key) ? "already" : "update", row }
}
