/**
 * Header'daki radyo yüzünün kapısı: "bir istasyon açık mı" — çalar ve yüz tembel yüklenir, ana
 * pakette yalnız bu bayrak kalır (`RadioFaceGate`). Çalar her durum değişikliğinde günceller.
 */
let active = false
const listeners = new Set()

export function setRadioActive(next) {
  if (active === next) return
  active = next
  listeners.forEach((fn) => fn())
}

export function subscribeRadioActive(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function isRadioActive() {
  return active
}
