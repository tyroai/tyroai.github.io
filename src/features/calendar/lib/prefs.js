import { KINDS } from "./items"

/**
 * Takvim sayfasının tercihi: hangi katmanlar açık (paylaşılan kişiler dahil) — yalnız bu tarayıcıda,
 * kişisel veri yok. Görünüm ve gün HATIRLANMAZ: sayfa her girişte bugünün haftasıyla açılır (başka
 * tarihte ya da görünümde açılmak kafa karıştırıyordu; eski kayıttaki `view`/`day` yok sayılır).
 * Depolama kapalıysa (gizli pencere, kota) sayfa varsayılanla çalışır; okuma ya da yazma fırlatmaz.
 */

export const PREFS_KEY = "tyro-calendar-v1"
// Paylaşılan takvimin kişisi de bir katman ("p:<adres>"): yalnız KAPALI olanlar yazılır (açık varsayılan),
// ve en çok bu kadar (listede olmayan eski kişiler birikmesin).
const PERSON_LAYER = /^p:[^\s@]+@[^\s@]+$/
const MAX_PERSON_LAYERS = 40
export const DEFAULT_PREFS = Object.freeze({
  layers: Object.freeze(Object.fromEntries(KINDS.map((k) => [k, true]))),
})

/** Kayıtlı tercihi doğrular: tanınmayan alan düşer, eksik katman AÇIK sayılır. */
export function readPrefs(storage) {
  try {
    // `localStorage` erişimi bile fırlatabilir: okuma try'ın içinde.
    const saved = JSON.parse((storage ?? globalThis.localStorage).getItem(PREFS_KEY) ?? "null")
    if (!saved || typeof saved !== "object") return { ...DEFAULT_PREFS }
    const layers = { ...DEFAULT_PREFS.layers }
    for (const k of KINDS) if (typeof saved.layers?.[k] === "boolean") layers[k] = saved.layers[k]
    const off = Object.entries(saved.layers ?? {}).filter(
      ([k, v]) => v === false && PERSON_LAYER.test(k),
    )
    for (const [k] of off.slice(0, MAX_PERSON_LAYERS)) layers[k] = false
    return { layers }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function writePrefs(prefs, storage, now = Date.now()) {
  // Kişi katmanlarından yalnız kapalılar yazılır.
  const layers = Object.fromEntries(
    Object.entries(prefs.layers).filter(([k, v]) => KINDS.includes(k) || v === false),
  )
  try {
    ;(storage ?? globalThis.localStorage).setItem(
      PREFS_KEY,
      JSON.stringify({ v: 1, layers, at: now }),
    )
  } catch {
    // Depolama kapalı: tercih yalnız bu oturumda.
  }
}
