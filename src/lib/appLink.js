import { safeExternalUrl } from "@/lib/utils"

// Katalog kartının adresi uygulamanın kendisiyse (ör. tyroRM: `https://tyroai.github.io/rm`)
// yeni sekme değil, aynı sekmede uygulama içi geçiş. Üretim adresi geliştirmede de içeride açılır.
const SELF_HOSTS = ["tyroai.github.io"]

/** Uygulama içi yol (`/rm?view=genel`) ya da dış adreste null. */
export function internalAppPath(raw) {
  if (typeof window === "undefined") return null
  try {
    const u = new URL(String(raw ?? "").trim())
    const self = u.origin === window.location.origin || SELF_HOSTS.includes(u.hostname)
    return self && u.pathname !== "/" ? `${u.pathname}${u.search}${u.hash}` : null
  } catch {
    return null
  }
}

/** Kartı açar: içerideyse yönlendirici ile, dışarıdaysa yeni sekmede. */
export function openAppUrl(raw, navigate) {
  const path = internalAppPath(raw)
  if (path) {
    navigate(path)
    return
  }
  const safe = safeExternalUrl(raw)
  if (safe !== "#") window.open(safe, "_blank", "noopener,noreferrer")
}
