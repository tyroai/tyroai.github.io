/**
 * Radyo tercihleri — bu tarayıcıda, kişiye özel kolaylık (yer seçimi, favoriler, ses).
 * Kayıt okunamazsa (gizli pencere, engelli depo) varsayılanlarla çalışılır.
 */
export const RADIO_PREFS_KEY = "tyro-radio-v1"
export const MAX_FAVORITES = 20
const FAV_FIELDS = [
  "id",
  "name",
  "url",
  "hls",
  "codec",
  "bitrate",
  "favicon",
  "art",
  "tags",
  "state",
  "cc",
]
export const RADIO_DEFAULTS = Object.freeze({ place: "auto", favorites: [], volume: 0.8 })

const str = (v, max = 300) => (typeof v === "string" ? v.slice(0, max) : "")

/** Favoriye yazılacak alanlar: istasyon başka ülkenin listesindeyken de çalınabilsin. */
export function favoriteSnapshot(st) {
  const out = {}
  for (const k of FAV_FIELDS) if (st?.[k] !== undefined) out[k] = st[k]
  return out
}

/** Bozuk ya da eski kayıt varsayılana düşer; yalnız tanınan alanlar kalır. */
export function sanitizeRadioPrefs(raw) {
  const v = raw && typeof raw === "object" ? raw : {}
  const favorites = Array.isArray(v.favorites)
    ? v.favorites
        .filter((f) => str(f?.id) && str(f?.name) && str(f?.url).startsWith("https://"))
        .slice(0, MAX_FAVORITES)
        .map((f) => ({
          ...favoriteSnapshot(f),
          tags: Array.isArray(f.tags) ? f.tags.filter((x) => typeof x === "string") : [],
        }))
    : []
  const volume = Number(v.volume)
  return {
    place: str(v.place, 60) || RADIO_DEFAULTS.place,
    favorites,
    volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : RADIO_DEFAULTS.volume,
  }
}

export function readRadioPrefs() {
  try {
    return sanitizeRadioPrefs(JSON.parse(window.localStorage.getItem(RADIO_PREFS_KEY) ?? "null"))
  } catch {
    return { ...RADIO_DEFAULTS, favorites: [] }
  }
}

// Ortak depo: kart ve header hapı aynı favorileri ve yeri görür (bir yerde değişen ötekine yansır).
let current = null
const listeners = new Set()

export function subscribeRadioPrefs(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getRadioPrefs() {
  if (!current) current = readRadioPrefs()
  return current
}

export function writeRadioPrefs(patch) {
  const next = sanitizeRadioPrefs({ ...getRadioPrefs(), ...patch })
  try {
    window.localStorage.setItem(RADIO_PREFS_KEY, JSON.stringify(next))
  } catch {
    // depo kapalı: tercih bu oturumda kalır
  }
  current = next
  listeners.forEach((fn) => fn())
  return next
}

/** Favoriye ekle / çıkar; en yeni favori listenin sonunda. */
export function toggleFavorite(favorites, st) {
  if (!st?.id) return favorites
  return favorites.some((f) => f.id === st.id)
    ? favorites.filter((f) => f.id !== st.id)
    : [...favorites, favoriteSnapshot(st)].slice(-MAX_FAVORITES)
}
