import { useSyncExternalStore } from "react"
import { CATALOG, MERGED, RENAMED, STANDARD_LOOKS, looksOf } from "@/features/widgets/layout"
import { knownPaletteId } from "@/data/palettes"
import { faceOf, sanitizeFace } from "./faceOptions"
import { REGISTRY, WIDGET_IDS, catalogKey, headerOf } from "@/features/widgets/registry"

/**
 * Header'daki widget'lar (macOS'un menü çubuğu gibi): sıra, görünüm ve tepsideki yüz (`faces`:
 * ne görünsün — `faceOptions`), bu tarayıcıda (`tyro-header-widgets-v1`, yalnız widget kimlikleri
 * ve seçimler — kişisel veri değil). Bütün sayfalarda
 * aynı; düzenleme Anasayfa'nın (ve Pano'nun) düzenleme kipinde. Panodaki kartla bağımsız: bir
 * widget hem panoda hem header'da olabilir.
 */
const KEY = "tyro-header-widgets-v1"
export const HEADER_MAX = 6
// Selamlama ve süs kartları header'a girmez (kayıtta `header: false`).
export const headerEligible = (id) => Boolean(CATALOG[id]) && REGISTRY[id].header !== false
export const HEADER_IDS = Object.keys(CATALOG).filter(headerEligible)
// Header'da başka kimlikle çizilenler (hava selamlamasız; kayıtta `header.renderAs`).
export const RENDER_AS = Object.fromEntries(
  WIDGET_IDS.filter((id) => headerOf(id).renderAs).map((id) => [id, headerOf(id).renderAs]),
)
// Header'a en çok yakışanlar (canlı bilgisi olan, bir bakışta okunan), kayıttaki `header.suggest`
// sırasıyla: ekleme listelerinde (header, çentik) önce bunlar, gerisi "Tümü"nde.
export const HEADER_SUGGESTED = WIDGET_IDS.filter((id) => headerOf(id).suggest).sort(
  (a, b) => headerOf(a).suggest - headerOf(b).suggest,
)
/** Header'daki adı (hava: "Hava durumu") ve ekleme listesindeki kısa açıklaması. */
export const headerTitleKey = (id) => CATALOG[RENDER_AS[id] ?? id].title
export const headerDescKey = (id) => headerOf(id).desc ?? catalogKey(id)

/**
 * Header'daki görünüm seçenekleri: kartınkiler; kartın kendi görünümü yoksa (hava, To-Do özeti)
 * yalnız tepsideki kapsül için standart seçenekler — kapsül her widget'ta giyinebilsin.
 */
export const headerLooksOf = (id) => (looksOf(id).length ? looksOf(id) : STANDARD_LOOKS)

/** Header'da geçerli görünüm mü: seçeneklerden biri, ya da biri + bilinen palet (`glass:…`). */
export function validHeaderLook(id, value) {
  if (typeof value !== "string") return false
  const [base, palette, ...rest] = value.split(":")
  if (rest.length || !headerLooksOf(id).includes(base)) return false
  return palette === undefined || knownPaletteId(palette) === palette
}

const EMPTY = { items: [], looks: {}, faces: {} }

/** Eski kimlik → yenisi (adı değişen ya da birleşen kart); header ve çentik kaydı ortak. */
export const widgetAlias = (id) => RENAMED[id] ?? MERGED[id] ?? id

/** Kayıt temizlenir: tanınmayan, header'a girmeyen ve iki kez geçen düşer; varsayılan görünüm saklanmaz. */
export function sanitizeHeader(raw) {
  const items = []
  for (const x of Array.isArray(raw?.items) ? raw.items : []) {
    const id = widgetAlias(x)
    if (headerEligible(id) && !items.includes(id)) items.push(id)
  }
  const kept = items.slice(0, HEADER_MAX)
  const looks = {}
  for (const id of kept) {
    const value = raw?.looks?.[id]
    if (value && validHeaderLook(id, value) && value !== headerLooksOf(id)[0]) looks[id] = value
  }
  // Yüz (ne görünsün: piyasada kurlar, dünya saatinde şehir) widget'ın tercihi, header'da olup
  // olmamasından bağımsız: Denetim Merkezi'nin kutucuğu da aynı seçimi gösterir.
  const faces = {}
  for (const [x, value] of Object.entries(raw?.faces ?? {})) {
    const id = widgetAlias(x)
    const face = headerEligible(id) ? sanitizeFace(id, value) : null
    if (face) faces[id] = face
  }
  return { items: kept, looks, faces }
}

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null")
    return raw?.v === 1 ? sanitizeHeader(raw) : EMPTY
  } catch {
    return EMPTY
  }
}

let state = typeof window === "undefined" ? EMPTY : read()
const subs = new Set()

function set(next) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, ...next }))
  } catch {
    // Depo kapalı: header düzeni bu oturumda kalır.
  }
  for (const fn of subs) fn()
}

function subscribe(fn) {
  subs.add(fn)
  // Başka sekmede değişince bu sekme de güncellenir.
  const onStorage = (e) => {
    if (e.key !== KEY) return
    state = read()
    fn()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    subs.delete(fn)
    window.removeEventListener("storage", onStorage)
  }
}

export const useHeaderWidgets = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  )

export const inHeader = (id) => state.items.includes(id)
/** O anki kayıt (kanca dışında okumak için). */
export const headerState = () => state

/**
 * Sona ekler; header doluysa ya da widget uygun değilse `false`. `with`: katalogda eklemeden önce
 * seçilen görünüm ve yüz — tek kayıtta.
 */
export function addHeaderWidget(id, { look, face } = {}) {
  if (!headerEligible(id)) return false
  if (state.items.includes(id)) return true
  if (state.items.length >= HEADER_MAX) return false
  set(
    sanitizeHeader({
      items: [...state.items, id],
      looks: { ...state.looks, ...(look ? { [id]: look } : {}) },
      faces: { ...state.faces, ...(face ? { [id]: face } : {}) },
    }),
  )
  return true
}

/** Çıkarır; geri alınabilsin diye önceki hâli döndürür (`restoreHeader`). */
export function removeHeaderWidget(id) {
  const prev = state
  if (!prev.items.includes(id)) return prev
  const looks = { ...prev.looks }
  delete looks[id]
  set({ items: prev.items.filter((x) => x !== id), looks, faces: prev.faces })
  return prev
}

export const restoreHeader = (prev) => set(sanitizeHeader(prev))

/** `id`yi `to` sırasına taşır (sınırlara kırpılır). */
export function moveHeaderWidget(id, to) {
  const from = state.items.indexOf(id)
  if (from < 0) return
  const at = Math.max(0, Math.min(state.items.length - 1, to))
  if (at === from) return
  const items = state.items.filter((x) => x !== id)
  items.splice(at, 0, id)
  set({ ...state, items })
}

/** Sürükleyip bırakınca bütün sıra birden (aynı kimlikler, yeni sıra). */
export function setHeaderOrder(list) {
  const same = list.length === state.items.length && list.every((id) => state.items.includes(id))
  if (same && list.some((id, i) => id !== state.items[i])) set({ ...state, items: [...list] })
}

export function setHeaderLook(id, look) {
  const looks = { ...state.looks }
  if (look === headerLooksOf(id)[0]) delete looks[id]
  else looks[id] = look
  set({ ...state, looks })
}

/** Header'daki görünüm: kayıtlı değilse varsayılan (ilk seçenek). */
export const headerLookOf = (looks, id) => looks[id] ?? headerLooksOf(id)[0]

/** Tepsideki yüzü değiştirir (`faceOptions`); varsayılana dönen alan saklanmaz. */
export function setHeaderFace(id, face) {
  const faces = { ...state.faces }
  const clean = sanitizeFace(id, face)
  if (clean) faces[id] = clean
  else delete faces[id]
  set({ ...state, faces })
}

/** Tepsideki yüzün tamamı (varsayılanlarla). */
export const headerFaceOf = (faces, id) => faceOf(id, faces?.[id])
