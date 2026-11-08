/**
 * Bildirim çanının "okundu" kaydı. Paneli açınca o anki kalemler görülmüş sayılır ve rozet söner;
 * özel günler ve bekleyen soru (otomatik yanıt, cevaplanana kadar) YENİ GÜNDE, Keşfet bildirimleri
 * YENİ BİLDİRİM gelince yeniden sayılır.
 *
 * ⚠️ **Kişi bilgisi yazılmaz.** Özel gün kalemleri kısa özetle (FNV-1a) tutulur, kişinin adı ya da
 * adresi depoya girmez; Keşfet için yalnız en yeni görülen bildirimin zaman damgası (Keşfet'in
 * kendi okundu işaretiyle aynı ilke, `feedSeen.js`).
 *
 * Desen `feedSeen.js` gibi: localStorage + aynı sekme için özel olay. Anlık görüntü HAM DİZE
 * (`readBellSeenRaw`): `useSyncExternalStore` her okumada aynı değeri görmeli; çözüm `parseBellSeen`.
 */
const KEY = "tyro-bell-seen-v1"
const EVENT = "tyro:bell-seen"

/** Kısa, geri döndürülemez özet: kalem kimliği (tatil + gün, kişinin kutlaması). */
export function hashKey(s) {
  let h = 0x811c9dc5
  for (const ch of String(s ?? "")) {
    h ^= ch.codePointAt(0)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

/** Rozete giren özel gün kalemlerinin anahtarları: yaklaşan tatiller + bugünün kutlamaları. */
export function specialKeysOf(soon, people) {
  return [
    ...soon.map((s) => `h:${hashKey(`${s.id}|${s.from}`)}`),
    ...people
      .filter((p) => p.inDays === 0 && !p.self)
      .map((p) => `p:${hashKey(`${p.kind}|${p.mail || p.name || ""}`)}`),
  ]
}

export function readBellSeenRaw() {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** { day, keys, feedAt } ya da null (kayıt yok, bozuk). */
export function parseBellSeen(raw) {
  try {
    const v = raw ? JSON.parse(raw) : null
    if (!v || typeof v !== "object") return null
    return {
      day: typeof v.day === "string" ? v.day : null,
      keys: Array.isArray(v.keys) ? v.keys.filter((k) => typeof k === "string") : [],
      feedAt: Number.isFinite(Date.parse(v.feedAt ?? "")) ? v.feedAt : null,
    }
  } catch {
    return null
  }
}

const ms = (d) => (d ? new Date(d).getTime() : Number.NaN)

const NOTICE = "tyro-oof-notice-v1"

/**
 * Çanın bekleyen sorusu (bugün yalnız otomatik yanıt: kurulsun mu · kaldırılsın mı). Değer
 * sorunun kısa özeti (`o:set:…`), tarih ya da ad değil; rozette özel günler gibi günlük anahtar.
 * Yazan `useOof` (soru her hesaplandığında), okuyan çan; çıkışta silinir (`PERSONAL_STORAGE`).
 */
export function readBellNotice() {
  try {
    return window.localStorage.getItem(NOTICE)
  } catch {
    return null
  }
}

export function writeBellNotice(value) {
  if ((value || null) === readBellNotice()) return
  try {
    if (value) window.localStorage.setItem(NOTICE, value)
    else window.localStorage.removeItem(NOTICE)
  } catch {
    return
  }
  window.dispatchEvent(new Event(EVENT))
}

/**
 * Görülmemiş sayılar: { special, feed, total }.
 * - Özel günler ve bekleyen soru (`notice`): aynı gün içinde görülen anahtarlar düşer; gün
 *   değişince yeniden sayılır (soru cevaplanana kadar her gün bir kez).
 * - Keşfet: çanda görülen en yeni bildirimden SONRAKİLER. `feed.items` en yeni üç okunmamış,
 *   `feed.count` Keşfet'in son ziyaretinden beri hepsi: üçünün de yeni olduğu durumda sayı `count`.
 */
export function bellCounts({ day, specialKeys, notice, feed }, seen) {
  const seenKeys = new Set(seen?.day === day ? seen.keys : [])
  const special = specialKeys.filter((k) => !seenKeys.has(k)).length
  const ask = notice && !seenKeys.has(notice) ? 1 : 0
  const items = feed?.items ?? []
  const count = feed?.count ?? 0
  const at = ms(seen?.feedAt)
  let fresh = count
  if (Number.isFinite(at)) {
    const newer = items.filter((i) => ms(i.received) > at).length
    fresh = newer < items.length ? newer : Math.max(newer, count)
  }
  const feedNew = Math.min(fresh, count)
  return { special, feed: feedNew, total: special + ask + feedNew }
}

/** Panel açıkken görülenleri yazar; Keşfet damgası yalnız ileri gider. */
export function markBellSeen({ day, specialKeys, notice, feedItems }) {
  if (typeof window === "undefined") return
  const prev = parseBellSeen(readBellSeenRaw())
  const newest = Math.max(
    Number.NEGATIVE_INFINITY,
    ...(feedItems ?? []).map((i) => ms(i.received)).filter(Number.isFinite),
  )
  const prevAt = ms(prev?.feedAt)
  const feedAt =
    Number.isFinite(newest) && !(prevAt >= newest)
      ? new Date(newest).toISOString()
      : (prev?.feedAt ?? null)
  const now = notice ? [...specialKeys, notice] : specialKeys
  const keys = [...new Set([...(prev?.day === day ? prev.keys : []), ...now])]
  const next = JSON.stringify({ day, keys, feedAt })
  if (next === readBellSeenRaw()) return
  try {
    window.localStorage.setItem(KEY, next)
  } catch {
    // Depo kapalı: rozet bu oturumda sönmez; panel yine çalışır.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function subscribeBellSeen(callback) {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}
