/**
 * Kenar çubuğunun sayfa grupları — tek kaynak: menü (`NavMain`) ve çentiğin varsayılan açık/kapalı
 * hâli (`edgeNotchState`). Sayfalar içeriğine göre gruplu: günün akışı · planlama · İK işleri.
 */
export interface NavGroup {
  key: string
  ids: readonly string[]
}

export const NAV_GROUPS: readonly NavGroup[] = [
  { key: "nav.groupMain", ids: ["myspace", "feed", "chat"] },
  { key: "nav.groupPlan", ids: ["calendar", "todo"] },
  { key: "nav.groupHr", ids: ["selfservice", "tibot"] },
]

/** "Genel" grubunun sayfaları (Anasayfa, Keşfet, Sohbet). */
export const GENERAL_PAGE_IDS: readonly string[] = NAV_GROUPS[0].ids

/** Kullanıcı menüsünün sayfaları: çentik hiç çizilmez (ürün sahibinin kararı) — ayarlar ve yardım. */
export const NO_NOTCH_PAGE_IDS: readonly string[] = ["profile", "security", "help", "whats-new"]
