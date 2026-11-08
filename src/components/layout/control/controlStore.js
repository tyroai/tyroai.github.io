import { useSyncExternalStore } from "react"
import { headerEligible, widgetAlias } from "../headerWidgets/headerStore"
import {
  isBuiltin,
  sanitizeLinks,
  sanitizeSizes,
  sanitizeTiles,
  tileSize,
  upgradeTiles,
} from "./controlModel"

/**
 * Denetim Merkezi'nin kaydı (`tyro-control-v1`; kişisel veri değil): kutucuk sırası, kutucuk
 * boyları (varsayılandan farklı olanlar), panelin görünümü (cam, deneysel) ve kişinin kendi kısayol
 * bağlantıları, bu tarayıcıda,
 * bütün sayfalarda ortak. Kutucukları hiç düzenlemediyse `tiles` yok (`null`) ve varsayılan sıra
 * geçerli. Başka sekmeyle eşitlenir. Kayıt sürümü `v` (4): eski sürüm okunurken yükseltilir
 * (`upgradeTiles`), ilk yazışta 4 olur.
 */
const KEY = "tyro-control-v1"
const VERSION = 4
const EMPTY = { tiles: null, links: [], sizes: {}, look: null }
// Panelin görünümü: düz (varsayılan, kayıtta yok) ya da cam (deneysel).
const LOOKS = new Set(["glass"])
const known = (id) => isBuiltin(id) || headerEligible(id)

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null")
    if (!(raw?.v >= 1 && raw.v <= VERSION)) return EMPTY
    return {
      tiles: sanitizeTiles(upgradeTiles(raw.tiles, raw.v), headerEligible, widgetAlias),
      links: sanitizeLinks(raw.links),
      sizes: sanitizeSizes(raw.sizes, known),
      look: LOOKS.has(raw.look) ? raw.look : null,
    }
  } catch {
    return EMPTY
  }
}

let state = typeof window === "undefined" ? EMPTY : read()
const subs = new Set()

function set(next) {
  state = next
  try {
    const empty =
      next.tiles == null && !next.links.length && !Object.keys(next.sizes).length && !next.look
    if (empty) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify({ v: VERSION, ...next }))
  } catch {
    // Depo kapalı: düzen bu oturumda kalır.
  }
  for (const fn of subs) fn()
}

function subscribe(fn) {
  subs.add(fn)
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

const snapshot = () => state
const serverSnapshot = () => EMPTY

/** Kayıtlı kutucuk listesi; hiç düzenlenmediyse `null`. */
export const useControlTiles = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot).tiles

/** Varsayılandan farklı kutucuk boyları (`{ id: boy }`). */
export const useControlSizes = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot).sizes

/** Kutucuğun boyu seçilir; varsayılana dönen kayıttan düşer. */
export function setTileSize(id, size) {
  const sizes = { ...state.sizes }
  if (size === tileSize(id)) delete sizes[id]
  else sizes[id] = size
  set({ ...state, sizes: sanitizeSizes(sizes, known) })
}

/** Panelin görünümü: `null` düz, `"glass"` cam (deneysel). */
export const useControlLook = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot).look

export const setControlLook = (look) => set({ ...state, look: LOOKS.has(look) ? look : null })

/** Kişinin kendi kısayol bağlantıları. */
export const useControlLinks = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot).links

/** Yeni sıra (tam liste) yazılır. */
export const setControlTiles = (tiles) => set({ ...state, tiles: [...tiles] })

/** Varsayılana dön: kutucuk sırası ve boyları silinir (bağlantılar kalır). */
export const resetControlTiles = () => set({ ...state, tiles: null, sizes: {} })

/** Bağlantılar (temizlenmiş liste) yazılır. */
export const setControlLinks = (links) => set({ ...state, links: sanitizeLinks(links) })
