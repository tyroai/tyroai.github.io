import { foldTr, isAllowedUrl, safeExternalUrl } from "@/lib/utils"

/** Katalog türleri, alt gezinme sırasıyla (`?sub=` değeri = koleksiyon adı). */
export const KINDS = ["agents", "aiApps", "businessApps"]

/** Tür → sağlayıcıdaki ham liste ve yazma işlevleri (`useConfig`). */
export const KIND = {
  agents: { all: "allAgents", upsert: "upsertAgent", remove: "removeAgent", tone: "agent" },
  aiApps: { all: "allAiApps", upsert: "upsertAiApp", remove: "removeAiApp", tone: "aiApp" },
  businessApps: {
    all: "allBusinessApps",
    upsert: "upsertBusinessApp",
    remove: "removeBusinessApp",
    tone: "businessApp",
  },
}

/** Bilinmeyen ya da boş `?sub=` → ilk tür; adres elle yazılsa da sayfa boş kalmaz. */
export const parseSub = (raw) => (KINDS.includes(raw) ? raw : KINDS[0])

/** Sütun eklenmeden önceki satırlarda bayrak yok: yok = açık. */
export const isShown = (item) => item?.isActive !== false

/** Durum filtresi değerleri. */
export const STATUSES = ["all", "on", "off"]

const SEARCH_FIELDS = ["name", "description", "url", "id", "tenantId", "clientId", "agentId"]

/** Ad, açıklama, adres ve kimliklerde arar; her sözcük bir yerde geçmeli (Türkçe katlamayla). */
export function matchesQuery(item, query) {
  const words = foldTr(query).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const hay = SEARCH_FIELDS.map((k) => foldTr(item?.[k])).join(" ")
  return words.every((w) => hay.includes(w))
}

/** Arama ve durum filtresi; sıra korunur (liste sırası = katalog sırası). */
export function filterItems(items, { query = "", status = "all" } = {}) {
  return (items ?? []).filter(
    (it) => (status === "all" || (status === "on") === isShown(it)) && matchesQuery(it, query),
  )
}

/** Filtre sekmelerinin sayıları. */
export function statusCounts(items) {
  const list = items ?? []
  const on = list.filter(isShown).length
  return { all: list.length, on, off: list.length - on }
}

/**
 * Bir satırı taşır, YENİ id sırasını verir (sağlayıcı her konumu bilmeli: sıra satır başına sayı
 * olarak saklanıyor). Geçersiz taşıma `null`.
 */
export function moveIds(items, from, to) {
  const n = items?.length ?? 0
  if (from < 0 || from >= n || to < 0 || to >= n || from === to) return null
  const ids = items.map((i) => String(i.id))
  const [moved] = ids.splice(from, 1)
  ids.splice(to, 0, moved)
  return ids
}

/** Yeni kaydın başlangıcı — yalnız tabloda olan alanlar. */
export function emptyEntity(kind) {
  if (kind === "agents") {
    return {
      name: "",
      description: "",
      tenantId: "",
      clientId: "",
      agentId: "",
      iconName: "Robot01Icon",
      logo: null,
      isActive: true,
    }
  }
  // Varsayılan ikon kayıt defterinin temel setinden: tam set inmeden de çizilir.
  const iconName = kind === "aiApps" ? "AiBrain02Icon" : "Office365Icon"
  return { name: "", description: "", url: "", iconName, logo: null, isActive: true }
}

/** Çoğaltma taslağı: aynı alanlar, yeni kayıt (kimlik ve sıra yok), adın sonunda "(kopya)". */
export function duplicateOf(item, kind, suffix) {
  const base = emptyEntity(kind)
  const draft = Object.fromEntries(Object.keys(base).map((k) => [k, item?.[k] ?? base[k]]))
  return { ...draft, name: `${item?.name ?? ""} (${suffix})` }
}

const FORM_FIELDS = [
  "name",
  "description",
  "url",
  "tenantId",
  "clientId",
  "agentId",
  "iconName",
  "logo",
  "isActive",
]
const norm = (k, v) => (k === "isActive" ? v !== false : (v ?? ""))

/** Formda kaydedilmemiş değişiklik var mı (kapatma koruması). */
export function isDirty(initial, form) {
  return FORM_FIELDS.some((k) => norm(k, initial?.[k]) !== norm(k, form?.[k]))
}

/** Satır içi doğrulama: alan → hata anahtarı. Boş nesne = geçerli. */
export function validateEntity(form, kind) {
  const errors = {}
  if (!String(form?.name ?? "").trim()) errors.name = "settings.catalog.form.nameRequired"
  // http(s)/mailto dışı şema (javascript:, data:) saklanırsa her kullanıcıya oynatılır.
  if (kind !== "agents" && !isAllowedUrl(form?.url)) errors.url = "settings.field.urlInvalid"
  return errors
}

/** Kaydedilecek biçim: ad kırpılır, adres kanonik biçime çevrilir ("#" ve boş olduğu gibi). */
export function toSaved(form, kind) {
  const trimmed = String(form.url ?? "").trim()
  const url =
    kind === "agents" || !trimmed || trimmed === "#" ? form.url : safeExternalUrl(form.url)
  return { ...form, name: String(form.name ?? "").trim(), url }
}

/** Uygulama satırının soluk alt satırı için ana makine ("#" ve geçersiz → boş). */
export function hostOf(url) {
  const s = String(url ?? "").trim()
  if (!s || s === "#") return ""
  try {
    return new URL(s).host
  } catch {
    return ""
  }
}
