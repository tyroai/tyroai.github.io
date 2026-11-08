import { STATUS } from "@/lib/graph"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * Widget'ların ortak bellek önbelleği (posta konusu, belge adı, ekip durumu,
 * Planner işleri — kişisel veri): yalnız BAŞARILI okuma saklanır, aynı anda
 * gelen ikinci istek ilkini bekler, çıkışta silinir (`lib/sessionCache`).
 */
const cache = new Map()
// Çıkışta artar: çıkıştan önce başlayıp sonra biten okuma (öteki sekmeden çıkışta sayfa
// yenilenmez) silinmiş önbelleğe yazılmasın.
let generation = 0
// Header tepsisinin yüzleri yalnız bellekteki son okumayı gösterir: yeni okuma gelince haber ver.
const watchers = new Set()
const notify = () => {
  for (const fn of watchers) fn()
}

export function cached(key, ttl, load) {
  const hit = cache.get(key)
  if (hit?.promise) return hit.promise
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.value)
  const gen = generation
  const promise = load().then(
    (value) => {
      if (gen !== generation) return value
      if (value?.status === STATUS.ready) cache.set(key, { at: Date.now(), value })
      else cache.delete(key)
      notify()
      return value
    },
    () => {
      if (gen === generation) cache.delete(key)
      return { status: STATUS.error }
    },
  )
  cache.set(key, { ...hit, promise })
  return promise
}

export function clearWidgetCache() {
  generation += 1
  cache.clear()
  notify()
}
onSessionClear(clearWidgetCache)

/**
 * Bir widget'ın bellekteki en yeni başarılı okuması (`prefix`: "<hesap>:<widget>:"); yoksa
 * `null`. İstek atmaz — tepsi yüzleri için (`useWidgetData` anahtarı yenilemeyle değişir).
 */
export function peekWidget(prefix) {
  let best = null
  for (const [key, hit] of cache) {
    if (key.startsWith(prefix) && hit.value && (!best || hit.at > best.at)) best = hit
  }
  return best?.value ?? null
}

export function watchWidgetCache(fn) {
  watchers.add(fn)
  return () => watchers.delete(fn)
}

/**
 * Bellekteki okumaları yerinde günceller (`fn(value)` → yeni değer) — kartta yapılan bir değişiklik
 * (ör. tamamlanan Planner işi) kart yeniden açılınca eski okumadan geri gelmesin.
 */
export function updateWidget(prefix, fn) {
  for (const [key, hit] of cache) {
    if (key.startsWith(prefix) && hit.value) cache.set(key, { ...hit, value: fn(hit.value) })
  }
  notify()
}
