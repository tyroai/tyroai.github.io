import { localStorageRegistry } from "@/data/appMeta"

/** Bu tarayıcının TYRO kayıtları: GeneralTab dökümü ve telefon kök önizlemesi aynı okumadan. */

export function byteSize(str) {
  if (!str) return 0
  if (typeof Blob !== "undefined") return new Blob([str]).size
  return new TextEncoder().encode(str).length
}

export function formatSize(bytes, locale) {
  const fmt = (n, digits) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n)
  if (bytes < 1024) return `${fmt(bytes, 0)} B`
  if (bytes < 1024 * 1024) return `${fmt(bytes / 1024, 1)} KB`
  return `${fmt(bytes / 1024 / 1024, 2)} MB`
}

function readRaw(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function removeRaw(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Depolama kapalıysa silinecek bir şey de yok.
  }
}

/** Dökümde görünmeyen ve silinmeyen kayıtlar: oturum işaretleri ve önbellek göçü sürümü. */
export const SYSTEM_KEYS = new Set(["tyro-signed-out", "tyro-logged-in", "tyro-cache-v"])
const PREFIX = "tyro-"

function tyroKeys() {
  try {
    const keys = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k?.startsWith(PREFIX) && !SYSTEM_KEYS.has(k)) keys.push(k)
    }
    return keys
  } catch {
    return []
  }
}

const patternsOf = (entry) => entry.match ?? [entry.key]
const matches = (pattern, key) =>
  pattern.endsWith("*") ? key.startsWith(pattern.slice(0, -1)) : key === pattern

/**
 * Kayıt dökümü: kayıtlı her girdi (önekli girdide eşleşen kayıtlar toplanır) + kayıtlı olmayan
 * her TYRO anahtarı "diğer" olarak. Böylece yeni bir özelliğin kaydı listeye eklenmeden de görünür
 * ve silinir; döküm eskimez.
 */
export function readStorageEntries(keys = tyroKeys()) {
  const claimed = new Set()
  const known = localStorageRegistry.map((entry) => {
    const own = keys.filter((k) => patternsOf(entry).some((p) => matches(p, k)))
    own.forEach((k) => claimed.add(k))
    const size = own.reduce((sum, k) => sum + byteSize(readRaw(k)), 0)
    return { ...entry, id: patternsOf(entry)[0], keys: own, size, present: own.length > 0 }
  })
  const other = keys
    .filter((k) => !claimed.has(k))
    .map((k) => ({
      id: k,
      key: k,
      keys: [k],
      size: byteSize(readRaw(k)),
      present: true,
      other: true,
    }))
  return [...known, ...other]
}

/** Girdinin bütün kayıtlarını siler. */
export function clearEntry(entry) {
  entry.keys.forEach(removeRaw)
}

/** Bu tarayıcıdaki bütün TYRO kayıtları, sistem kayıtları hariç: oturum açık kalır. */
export function clearAllEntries() {
  tyroKeys().forEach(removeRaw)
}

/** Döküm sırası: dolu kayıtlar büyükten küçüğe (iPhone Depolama), boşlar ayrı (açılırda). */
export function splitStorageEntries(entries) {
  return {
    filled: entries.filter((e) => e.present).sort((a, b) => b.size - a.size),
    empty: entries.filter((e) => !e.present),
  }
}

export function storageTotals(entries = readStorageEntries()) {
  return {
    present: entries.filter((e) => e.present).length,
    count: entries.length,
    size: entries.reduce((sum, e) => sum + e.size, 0),
  }
}
