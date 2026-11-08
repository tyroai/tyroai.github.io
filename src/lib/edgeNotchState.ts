import { GENERAL_PAGE_IDS } from "@/lib/navGroups"

/**
 * Sağ kenar çentiği AÇIK mı — kullanıcı tutamaktan daraltabiliyor ve tarayıcı bunu hatırlıyor.
 *
 * ⚠️ **İKİ KAPSAM, AYRI HAFIZA.** Kenar çubuğunun "Genel" grubu (`lib/navGroups`: Anasayfa,
 * Keşfet, Sohbet; Pano Anasayfa'nın deneme kopyası) `general` kapsamında, varsayılanı AÇIK:
 * günün akışında posta ve takvim elin altında. Öteki sayfalar ortak `pages` kapsamında,
 * varsayılanı KAPALI: iş ekranının sağ kenarı içeriğe kalsın. Bir kapsamda açıp kapamak ötekini
 * değiştirmez.
 *
 * Anahtarlar v2: yeni varsayılan herkese bir kez uygulansın diye v1 seçimleri okunmaz; ilk yazışta
 * silinir.
 *
 * `orbStyle.js`in deseni: localStorage + aynı sekme için özel olay (`storage` yalnız BAŞKA
 * sekmeleri haberdar eder).
 */
export type EdgeNotchScope = "general" | "pages"

const SCOPES: Record<EdgeNotchScope, { key: string; fallback: boolean }> = {
  general: { key: "tyro-edge-notch-general-v2", fallback: true },
  pages: { key: "tyro-edge-notch-pages-v2", fallback: false },
}
const LEGACY_KEYS = ["tyro-edge-notch-v1", "tyro-edge-notch-home-v1"]
const EVENT = "tyro:edge-notch"
const GENERAL = new Set([...GENERAL_PAGE_IDS, "widgets"])

const scopeOf = (scope: string) => SCOPES[scope as EdgeNotchScope] ?? SCOPES.pages

/** Rotanın kapsamı: "Genel" grubu (ve Pano) ayrı, gerisi ortak. */
export function edgeNotchScope(activeId?: string | null): EdgeNotchScope {
  return activeId && GENERAL.has(activeId) ? "general" : "pages"
}

export function edgeNotchFallback(scope: string = "pages"): boolean {
  return scopeOf(scope).fallback
}

export function readEdgeNotchOpen(scope: string = "pages"): boolean {
  const { key, fallback } = scopeOf(scope)
  if (typeof window === "undefined") return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value == null ? fallback : value !== "closed"
  } catch {
    return fallback
  }
}

export function writeEdgeNotchOpen(open: boolean, scope: string = "pages"): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(scopeOf(scope).key, open ? "open" : "closed")
    for (const key of LEGACY_KEYS) window.localStorage.removeItem(key)
  } catch {
    // Depo kapalı: seçim bu oturumda görünür, yenilemede varsayılana döner.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function subscribeEdgeNotch(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}
