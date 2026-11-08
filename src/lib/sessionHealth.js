import { isSessionAlive } from "./sessionExpiry"

/**
 * Çalışırken oturum sağlığı (her sayfada tek uyarı: `layout/SessionExpiredBanner`). Açılıştaki
 * yoklama (`main.jsx`, `lib/sessionExpiry`) yalnız uygulama açılırken soruyor ve 1,5 sn'de
 * cevap gelmezse "yaşıyor" sayıyor; telefonda uygulama günlerce arka planda açık kalınca o an
 * hiç gelmiyor. Tarayıcı uygulamasının yenileme anahtarı 24 saatte biter: ertesi gün takvim,
 * posta ve widget'ların istekleri tek tek düşer, sayfa boş kalır. Bir token alınamayınca (MSAL
 * `ACQUIRE_TOKEN_FAILURE`, Dataverse 401) aynı yoklama (`isSessionAlive`: yalnız girişin kendi
 * kapsamı, zorla yenileme; çevrimdışı ya da tanınmayan hata "yaşıyor") bir kez çalışır. Aynı anda
 * tek, dakikada en çok bir. Yeniden girilince uyarı kalkar.
 */
const COOLDOWN = 60_000
let expired = false
let checking = false
let lastCheck = -Infinity
const listeners = new Set()

export const isSessionExpired = () => expired

export function subscribeSession(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function set(next) {
  if (expired === next) return
  expired = next
  for (const cb of listeners) cb()
}

/** Bir token alınamadı: oturum dolmuş mu, bir kez sına. */
export async function suspectSession(instance, now = Date.now(), alive = isSessionAlive) {
  if (checking || expired || now - lastCheck < COOLDOWN) return
  checking = true
  lastCheck = now
  try {
    set(!(await alive(instance)))
  } finally {
    checking = false
  }
}

/** Yeniden girildi ya da çıkıldı: uyarı kalkar, sonraki hata yeniden sınanır. */
export function sessionRestored() {
  lastCheck = -Infinity
  set(false)
}
