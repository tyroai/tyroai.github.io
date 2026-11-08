/**
 * Uygulamayı yükle (PWA): tarayıcının kurulum isteği (`beforeinstallprompt`) uygulama açılırken BİR
 * kez gelir. Modül giriş paketinde yüklenince yakalanır; menü ya da Yardım kartı sonradan açılsa da
 * kaybolmaz. iPhone/iPad Safari'de bu olay yok: orada "Paylaş › Ana Ekrana Ekle" tarifi gösterilir.
 */
let deferred = null
let installed = false
let guide = false
let snapshot = { canPrompt: false, installed: false, ios: false, guide: false }
const listeners = new Set()

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  )
}

/** iPhone/iPad Safari (iPadOS masaüstü kimliği dahil); Chrome/Firefox/Edge iOS sürümleri değil. */
export function isIosSafari(nav = typeof navigator === "undefined" ? null : navigator) {
  if (!nav) return false
  const ua = nav.userAgent ?? ""
  const ios = /iPad|iPhone|iPod/.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1)
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

function emit() {
  snapshot = {
    canPrompt: Boolean(deferred) && !installed,
    installed,
    ios: !installed && isIosSafari(),
    guide,
  }
  listeners.forEach((fn) => fn())
}

if (typeof window !== "undefined") {
  installed = isStandalone()
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    deferred = e
    emit()
  })
  window.addEventListener("appinstalled", () => {
    installed = true
    deferred = null
    emit()
  })
  emit()
}

export const pwaSnapshot = () => snapshot

export function subscribePwa(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Tarayıcının kurulum penceresini açar: "accepted" · "dismissed"; istek yoksa `null`. */
export async function promptInstall() {
  if (!deferred) return null
  const e = deferred
  e.prompt()
  let outcome = "dismissed"
  try {
    outcome = (await e.userChoice)?.outcome ?? outcome
  } catch {
    // Kullanıcı vazgeçti.
  }
  deferred = null
  emit()
  return outcome
}

/** iPhone/iPad tarifi (`IosInstallGuide`, kabukta tek örnek): menü ve Anasayfa kartı açar. */
export function setInstallGuide(open) {
  guide = Boolean(open)
  emit()
}

/** Kurulabiliyorsa tarayıcının penceresi, iPhone/iPad Safari'de tarif. */
export function startInstall() {
  if (deferred) return promptInstall()
  if (isIosSafari()) setInstallGuide(true)
  return Promise.resolve(null)
}
