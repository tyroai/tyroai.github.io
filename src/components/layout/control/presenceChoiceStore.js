/**
 * TYRO'dan seçilen Teams durumunun izi (`tyro-presence-choice-v1`): hangi durum, ne zamana kadar.
 * Graph tercihin kimden geldiğini söylemiyor; panel "senin seçimin · bitiş" diyebilsin diye.
 * Çıkışta silinir (`PERSONAL_STORAGE`).
 */
const KEY = "tyro-presence-choice-v1"

export function readChoice() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null")
    return v && typeof v.choice === "string" && Number.isFinite(v.until) ? v : null
  } catch {
    return null
  }
}

export function writeChoice(value) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value))
    else localStorage.removeItem(KEY)
  } catch {
    // Depo kapalı: kaynak satırı Teams'in etkinliğinden kurulur.
  }
}
