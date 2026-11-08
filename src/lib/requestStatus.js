import { onSessionClear } from "@/lib/sessionCache"
/**
 * Sohbetteki talep kartlarının ERP durumu. Self Servis'in yeni kayıt gözcüsü kaydı bulunca yazar
 * (`markRequestFound`), kart okur (`foundFor`). Yalnız bellekte; kayıt numarası kişisel iş verisi
 * sayılır, çıkışta temizlenir (`lib/sessionCache`).
 */

let found = []
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

/** Gözcü `kind` türünden yeni bir kayıt buldu (`record`: Self Servis kaydı). */
export function markRequestFound(kind, record) {
  if (!kind || !record) return
  found = [...found, { kind, at: Date.now(), id: record.id ?? null, number: record.number || null }]
  emit()
}

export function clearRequestStatus() {
  found = []
  emit()
}
onSessionClear(clearRequestStatus)

/** useSyncExternalStore aboneliği ve anlık görüntüsü. */
export const subscribeRequestStatus = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const requestStatusSnapshot = () => found

/** Kartın kaydı: aynı türden, mesajdan (`since`) sonra bulunan ilk kayıt ya da null. */
export function foundFor(list, kind, since) {
  const at = since instanceof Date ? since.getTime() : new Date(since ?? 0).getTime()
  return list.find((f) => f.kind === kind && f.at >= at) ?? null
}
