// Karşılama çekmecesi her açılışta ve yenilemede bir kez (sayfa yüklenişi başına): bayrak bellekte,
// yenileyince ya da uygulama yeniden açılınca düşer. Uygulama içinde Anasayfa'ya dönünce yeniden
// inmez (ürün sahibi: "her girişte ya da yenilemede").
let shown = false
// Testler bu bayrağı kendi başlangıçlarında koyar: çekmece sayfayı örtüp ölçümleri bozmasın.
const OFF_KEY = "tyro-welcome-off"
// Telefon dikeyde: dokunmatik, dar ve yatay telefon (≤ 500 px) değil.
const PHONE = "(max-width: 767.98px) and (min-height: 501px) and (pointer: coarse)"

function turnedOff() {
  try {
    return window.sessionStorage.getItem(OFF_KEY) === "1"
  } catch {
    return false
  }
}

export function markWelcomeSeen() {
  shown = true
}

/** Açılışta gösterilsin mi: telefon dikeyde ve bu yüklenişte henüz gösterilmedi. */
export const welcomeDue = () =>
  typeof window !== "undefined" &&
  !shown &&
  !turnedOff() &&
  Boolean(window.matchMedia?.(PHONE).matches)
