import { onSessionClear, PERSONAL_STORAGE } from "@/lib/sessionCache"
/**
 * TALEP TASLAKLARI — yarım kalan izin, masraf ve avans formu (tür başına bir taslak). Yazılan
 * alanlar yerel depoda: sayfa yenilense de kalır, 7 gün sonra düşer. Fişler YALNIZ BELLEKTE: fiş
 * görselleri diske yazılmaz; sayfa yenilenince kaç fiş olduğu taslakta kalır, form bunu söyler
 * (`missing`). Çıkışta hepsi silinir (`clearAllDrafts`, `lib/sessionCache`).
 *
 * Form durumu JSON'a `encodeForm` ile yazılır (tarih `{ $d: "…" }`), `decodeForm` geri çevirir;
 * sohbetteki talep kartı da formu aynı biçimde taşır (`requestEdits`).
 */
const KEY = PERSONAL_STORAGE.requestDrafts.key
const TTL = 7 * 24 * 60 * 60 * 1000
const memory = new Map()
const listeners = new Set()

/** Form durumunu JSON'a uygun hâle getirir: tarihler `{ $d: ISO }`. */
export function encodeForm(value) {
  if (value instanceof Date) return { $d: value.toISOString() }
  if (Array.isArray(value)) return value.map(encodeForm)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encodeForm(v)]))
  }
  return value
}

/** `encodeForm`un tersi; bozuk tarih düşer. */
export function decodeForm(value) {
  if (Array.isArray(value)) return value.map(decodeForm)
  if (value && typeof value === "object") {
    if (typeof value.$d === "string" && Object.keys(value).length === 1) {
      const d = new Date(value.$d)
      return Number.isNaN(d.getTime()) ? null : d
    }
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decodeForm(v)]))
  }
  return value
}

function read() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}")
    return all && typeof all === "object" ? all : {}
  } catch {
    return {}
  }
}

function write(all) {
  try {
    if (Object.keys(all).length) localStorage.setItem(KEY, JSON.stringify(all))
    else localStorage.removeItem(KEY)
  } catch {
    // Depo kapalı ya da dolu: taslak yalnız bu oturumda kalmaz, form yine çalışır.
  }
  listeners.forEach((fn) => fn())
}

/** Taslağı yazar. `state`: `form.snapshot()`; `receipts`: `[{ file, rotate }]` (bellekte kalır). */
export function saveDraft(kind, state, receipts = [], now = Date.now()) {
  const all = read()
  all[kind] = { at: now, form: encodeForm(state), receipts: receipts.length }
  if (receipts.length)
    memory.set(
      kind,
      receipts.map(({ file, rotate = 0 }) => ({ file, rotate })),
    )
  else memory.delete(kind)
  write(all)
}

/**
 * Türün taslağı ya da null (yoksa, süresi dolduysa). Dönüş `{ at: Date, initial, missing }`:
 * `initial` forma verilir (`useRequestForm`), `missing` belleğe sığmayan (yenilenen sayfada
 * kaybolan) fiş sayısı.
 */
export function loadDraft(kind, now = Date.now()) {
  const draft = read()[kind]
  if (!draft) return null
  if (!(now - draft.at < TTL)) {
    clearDraft(kind)
    return null
  }
  const receipts = memory.get(kind) ?? []
  return {
    at: new Date(draft.at),
    initial: { ...decodeForm(draft.form), receipts },
    missing: Math.max(0, (draft.receipts ?? 0) - receipts.length),
  }
}

export function clearDraft(kind) {
  memory.delete(kind)
  const all = read()
  if (!(kind in all)) return
  delete all[kind]
  write(all)
}

/** Çıkışta: bütün taslaklar (yerel depo ve bellekteki fişler). */
export function clearAllDrafts() {
  memory.clear()
  write({})
}
onSessionClear(clearAllDrafts)

/** Taslağı olan türler (Yeni menüsünün "taslak" işareti). */
export function draftKinds(now = Date.now()) {
  return Object.entries(read())
    .filter(([, d]) => d && now - d.at < TTL)
    .map(([kind]) => kind)
    .sort()
    .join(",")
}

export function subscribeDrafts(fn) {
  listeners.add(fn)
  const onStorage = (e) => e.key === KEY && fn()
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener("storage", onStorage)
  }
}
