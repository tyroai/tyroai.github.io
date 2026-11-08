/**
 * Takvim (`/calendar`) — Outlook toplantıları, To Do görevleri, Self Servis izinleri, ekibin
 * izinleri, kutlamalar ve resmî tatiller tek sayfada. Herkese açık (önce yalnız uygulama
 * yöneticileriydi). Kapı `lib/pageAccess.js`te (rota, sidebar satırı,
 * arama, Yenilikler); header takviminin "Tam takvim" bağlantısı da aynı karardan.
 */

/** Herkese açmak için TEK satır: `true`. Kapatmak için `CALENDAR_PAGE.enabled = false`. */
export const CALENDAR_OPEN = true

export const CALENDAR_PAGE = {
  enabled: true,
  /** `"*"` herkese · `"admins"` Entra yönetici grubu · `"appAdmins"` uygulama yöneticileri · `["upn", …]`. */
  audience: CALENDAR_OPEN ? "*" : "appAdmins",
}
