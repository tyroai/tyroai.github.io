import { useSyncExternalStore } from "react"

/**
 * Logodaki kürenin görünümü (Profil › Görünüm): "renk" (sarı → pembe → mor) ya da "obsidyen"
 * (siyah cam). Uygulama paletinden bağımsız, kendi anahtarıyla saklanır. Sağlayıcı yok: logo
 * yönlendiricinin ve palet sağlayıcısının dışında da çiziliyor (hata sınırı, kurulum yüzeyleri).
 */
export const LOGO_ORBS = ["renk", "obsidyen"]
export const DEFAULT_LOGO_ORB = "renk"

const KEY = "tyro-logo-orb"
const EVENT = "tyro-logo-orb-change"

function read() {
  try {
    const saved = window.localStorage.getItem(KEY)
    return LOGO_ORBS.includes(saved) ? saved : DEFAULT_LOGO_ORB
  } catch {
    return DEFAULT_LOGO_ORB
  }
}

export function setLogoOrb(next) {
  if (!LOGO_ORBS.includes(next)) return
  try {
    window.localStorage.setItem(KEY, next)
  } catch {
    // Depolama kapalıysa seçim yalnız bu sekmede, bu yüklemede geçerli olmaz; sessizce geç.
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

export function useLogoOrb() {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_LOGO_ORB)
}
