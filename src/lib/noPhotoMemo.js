import { PERSONAL_STORAGE } from "@/lib/sessionCache"

/**
 * Fotoğrafı olmayan iş arkadaşlarını oturumlar arası hatırlar: her açılışta aynı kişiler için
 * Graph 404 dönüyor, konsolu kırmızıya boyuyor ve boşa istek atılıyordu. Adres değil, kısa bir
 * özet (FNV-1a) saklanır; 7 gün sonra yeniden denenir (kişi fotoğraf eklemiş olabilir).
 * Çıkışta silinir (`PERSONAL_STORAGE.noPhoto`).
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000
const MAX = 2000
const { key: KEY } = PERSONAL_STORAGE.noPhoto

function hash(address) {
  let h = 0x811c9dc5
  for (let i = 0; i < address.length; i += 1) {
    h ^= address.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

function read() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "{}")
    return raw && typeof raw === "object" ? raw : {}
  } catch {
    return {}
  }
}

export function knownNoPhoto(address, now = Date.now()) {
  const until = read()[hash(address)]
  return typeof until === "number" && until > now
}

export function rememberNoPhoto(address, now = Date.now()) {
  const memo = read()
  for (const [k, until] of Object.entries(memo)) if (!(until > now)) delete memo[k]
  const keys = Object.keys(memo)
  if (keys.length >= MAX) delete memo[keys[0]]
  memo[hash(address)] = now + TTL_MS
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memo))
  } catch {
    // Depo dolu ya da kapalı: yalnız bu oturum hatırlanır (bellekteki önbellek).
  }
}
