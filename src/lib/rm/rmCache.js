import { onSessionClear } from "@/lib/sessionCache"
// tyroRM planının bellek içi kopyası (kişi adları ve kapasiteleri taşır): sayfa geçişlerinde
// yeniden indirilmesin diye modülde durur, çıkışta temizlenir (`lib/sessionCache`).
let entry = null
const listeners = new Set()

export function getRmEntry() {
  return entry
}

/** entry: { meta, doc } — meta: Dataverse satırının kimliği, sürüm etiketi, kim/ne zaman. */
export function setRmEntry(next) {
  entry = next
  for (const fn of listeners) fn(entry)
}

export function subscribeRm(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Bölümün öteki bellek içi kayıtları (ör. kişi eşlemesi) temizlenmek için buraya kaydolur.
const cleanups = new Set()

export function onRmClear(fn) {
  cleanups.add(fn)
}

export function clearRmCache() {
  setRmEntry(null)
  for (const fn of cleanups) fn()
}
onSessionClear(clearRmCache)
