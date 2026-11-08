/**
 * Rehber turlarının kaydı — yerel depoda TEK anahtar: `{ seen: { home: 3, … }, off? }`, tur başına
 * görülen SÜRÜM. Sürüm büyüyünce tur, eskisini görmüş kişiye yalnız YENİ adımlarıyla (`since`) bir
 * kez daha açılır. Depo kapalıysa turlar HİÇ açılmaz: kaydedilemeyen bir "görüldü", her ziyarette
 * yeniden tur demek. `off`: bütün turlar kapalı (uçtan uca testler).
 *
 * Eski Anasayfa damgası (`tyro-myspace-tour-v2`) "home 2. sürüm görüldü" sayılır; değeri "e2e" ise
 * turlar kapalı (testlerin eski ayarı).
 */
export const STORE_KEY = "tyro-tours-v1"
const LEGACY_KEY = "tyro-myspace-tour-v2"

function storage() {
  try {
    const ls = window.localStorage
    ls.setItem("tyro-tours-probe", "1")
    ls.removeItem("tyro-tours-probe")
    return ls
  } catch {
    return null
  }
}

/** `{ writable, off, seen }` — `seen`: tur kimliği → görülen sürüm. */
export function tourState() {
  const ls = storage()
  if (!ls) return { writable: false, off: true, seen: {} }
  let saved = {}
  try {
    const raw = JSON.parse(ls.getItem(STORE_KEY) ?? "{}")
    if (raw && typeof raw === "object") saved = raw
  } catch {
    // Bozuk kayıt: turlar baştan.
  }
  const seen = { ...(saved.seen && typeof saved.seen === "object" ? saved.seen : {}) }
  const legacy = ls.getItem(LEGACY_KEY)
  if (legacy && legacy !== "e2e") seen.home = Math.max(Number(seen.home) || 0, 2)
  return { writable: true, off: Boolean(saved.off) || legacy === "e2e", seen }
}

/** Turun görülen sürümü (hiç görülmediyse 0). */
export const seenVersion = (id) => Number(tourState().seen[id]) || 0

/** Görüldü — tur GÖSTERİLİRKEN yazılır: yarıda kapanan sekme turu her açılışta dayatmasın. */
export function markSeen(id, version) {
  const ls = storage()
  if (!ls) return
  const { off, seen } = tourState()
  seen[id] = Math.max(Number(seen[id]) || 0, version)
  try {
    ls.setItem(STORE_KEY, JSON.stringify(off ? { off, seen } : { seen }))
    // Eski damga artık yeni kayıtta (home ≥ 2): taşındı, silinir. Testlerin "e2e" ayarı kalır.
    if (ls.getItem(LEGACY_KEY) !== "e2e") ls.removeItem(LEGACY_KEY)
  } catch {
    // Depo doldu: tur bir sonraki ziyarette yine açılır.
  }
}

/** Bütün turları baştan göster (Yardım › Rehber turları). */
export function resetTours() {
  try {
    window.localStorage.removeItem(STORE_KEY)
    window.localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Depo kapalı: zaten tur gösterilmiyor.
  }
}

/** Tur görülmeli mi, hangi adımlarla: `null` (gerek yok) ya da `{ steps, delta }`. */
export function pendingSteps(def, seen) {
  if (seen >= def.version) return null
  if (!seen) return { steps: def.steps, delta: false }
  const fresh = def.steps.filter((s) => (s.since ?? 1) > seen)
  return fresh.length ? { steps: fresh, delta: true } : null
}
