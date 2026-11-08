/**
 * Takvimi bizimle paylaşan kişiler — bu tarayıcıda tutulan liste.
 *
 * Graph, "kim sana takvimini paylaştı" diye SORULABİLECEK bir uç sunmuyor:
 * paylaşım Exchange tarafında yapılıyor ve okunabilir tek şey, adını bildiğin
 * bir kişinin takviminin sana AÇIK OLUP OLMADIĞI (`/users/{upn}/calendarView`
 * ya veriyi ya da 403'ü döner). Bu yüzden liste kullanıcının kendi seçimidir,
 * tıpkı Outlook'ta "Takvim Ekle → Kişiden" akışının bıraktığı liste gibi.
 *
 * Yalnızca AD ve ADRES saklanır — etkinlik başlığı, katılımcı, hiçbir içerik
 * diske yazılmaz (takvim önbelleği de bilinçli olarak bellekte).
 *
 * Liste TEK kaynak: header paneli, Pano'nun widget'ı ve Takvim sayfası aynı listeyi
 * okur ve yazar (`hooks/useSharedPeople`); biri değiştirince ötekiler anında görür
 * (`subscribeSharedCalendars`; başka sekmedeki değişiklik `storage` olayıyla). Okuma
 * KARARLI başvuru döner: depodaki yazı değişmedikçe aynı dizi — `useCalendarEvents`in
 * `people` parametresi ve `useSyncExternalStore` bunu ister.
 */
const KEY = "tyro-shared-calendars"

let cached = { raw: undefined, list: [] }
// Depolama yazılamıyorsa (gizli pencere, kota) seçim yalnız bu oturumda, bellekte kalır.
let memoryOnly = false
const listeners = new Set()

function parse(raw) {
  try {
    const list = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) return []
    // Kayıt bozulsa bile panel açılmalı: şekli tutmayan girdi sessizce düşer.
    return list
      .filter((p) => p && typeof p.address === "string" && p.address.includes("@"))
      .map((p) => ({
        address: p.address,
        name: typeof p.name === "string" && p.name ? p.name : p.address,
      }))
  } catch {
    return []
  }
}

function readRaw() {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** @returns {{address: string, name: string}[]} */
export function readSharedCalendars() {
  if (memoryOnly) return cached.list
  const raw = readRaw()
  if (raw !== cached.raw) cached = { raw, list: parse(raw) }
  return cached.list
}

export function writeSharedCalendars(list) {
  const raw = JSON.stringify(list)
  cached = { raw, list }
  try {
    window.localStorage.setItem(KEY, raw)
  } catch {
    memoryOnly = true
  }
  listeners.forEach((fn) => fn())
}

/** Liste değişince `fn` çağrılır; başka sekmede değişirse de (`storage`). */
export function subscribeSharedCalendars(fn) {
  listeners.add(fn)
  const onStorage = (e) => (e.key === KEY || e.key === null) && fn()
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener("storage", onStorage)
  }
}
