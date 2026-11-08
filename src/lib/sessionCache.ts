/**
 * Oturum önbelleği — kişisel veriyi bellekte tutan her okuma buradan kurulur ve kendini kayda
 * geçirir; çıkışta (`lib/msal.js` › LOGOUT_SUCCESS — MSAL bunu öteki sekmelere de yayar) tek
 * çağrıyla hepsi silinir (`clearSessionCaches`). Yeni bir önbellek için msal.js'e satır eklenmez.
 *
 * - `createSessionCache({ ttlMs, maxEntries, name })`: anahtarlı değer + uçuştaki istek. `dedupe`
 *   aynı anahtarın ikinci isteğini ilkine bağlar; `commit` yalnız çıkıştan önce başlamış okumayı
 *   yazar (çıkıştan sonra dönen cevap bir sonraki kullanıcıya kalmasın). Hata önbelleğe girmez:
 *   yalnız `commit` edilen yazılır.
 * - `onSessionClear(fn)`: bu kalıba uymayan önbelleğin kendi silicisi.
 * - `PERSONAL_STORAGE`: kişisel veri taşıyan tarayıcı depo anahtarları. Depo sayfa yenilemesinden
 *   sağ çıkar, sahibi modül hiç yüklenmemiş olabilir — o yüzden burada yazılı ve hep silinir.
 */

type Clear = () => unknown

const clears = new Map<Clear, string>() // silici → ad (testte "kayıtlı mı" diye bakılır)

/** Çıkışta çağrılacak silici; dönen fonksiyon kaydı kaldırır. */
export function onSessionClear(fn: Clear, name: string = fn.name): () => boolean {
  clears.set(fn, name || "anonymous")
  return () => clears.delete(fn)
}

/** Kayıtlı silicilerin adları (test ve tanı için; veri içermez). */
export function sessionClearNames(): string[] {
  return [...clears.values()]
}

type StorageArea = "local" | "session"
type PersonalEntry =
  | { area: StorageArea; key: string; prefix?: never }
  | { area: StorageArea; prefix: string; key?: never }

export const PERSONAL_STORAGE = Object.freeze({
  // Tebrikler: başkalarının doğum günü ve ünvanı (12 saatlik depo).
  celebrations: { area: "local", key: "tyro-celebrations-v1" },
  // Yarım kalan talep formları (tutar, tarih, açıklama).
  requestDrafts: { area: "local", key: "tyro-request-drafts-v1" },
  // Kaldırılan Ortak saat widget'ının eski kaydı (iş arkadaşlarının adresleri): çıkışta silinir.
  commonTime: { area: "local", key: "tyro-common-time-v1" },
  // Kendi profil fotoğrafım, etiketi ve son bakış zamanı.
  myPhoto: { area: "local", prefix: "tyro-photo-" },
  // Fotoğrafı olmayan iş arkadaşları (adresin özeti, 7 gün).
  noPhoto: { area: "local", key: "tyro-nophoto-v1" },
  // Self Servis'te kapatılan akıllı uyarılar (hesap başına).
  dismissedAlerts: { area: "session", prefix: "tyro-ss-alerts-dismissed" },
  // Sohbete park edilmiş soru (toplantı konusu, düzenleyen).
  pendingAsk: { area: "session", key: "tyro:chat:pendingAsk" },
  // Otomatik yanıt sorusu: "bu izin için sorma" denen izinlerin, TYRO'nun kurduğu yanıtların
  // özeti ve son soru günü.
  oofAsk: { area: "local", key: "tyro-oof-ask-v1" },
  // Çanın bekleyen sorusu (otomatik yanıt): sorunun özeti — başka hesaba kalmasın.
  bellNotice: { area: "local", key: "tyro-oof-notice-v1" },
} satisfies Record<string, PersonalEntry>)

function storeOf(area: StorageArea): Storage | null {
  try {
    return area === "session" ? window.sessionStorage : window.localStorage
  } catch {
    return null // depo kapalı ya da tarayıcı dışı: silinecek bir şey yok
  }
}

function wipeStorage(): void {
  for (const entry of Object.values(PERSONAL_STORAGE) as PersonalEntry[]) {
    try {
      const store = storeOf(entry.area)
      if (!store) continue
      if (entry.key) store.removeItem(entry.key)
      const { prefix } = entry
      if (!prefix) continue
      const hits: string[] = []
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i)
        if (k?.startsWith(prefix)) hits.push(k)
      }
      for (const k of hits) store.removeItem(k)
    } catch {
      // Depo erişimi düştü: öteki kayıtlar yine silinsin.
    }
  }
}

/** Oturum bitti: kişisel depo anahtarları ve kayıtlı her önbellek silinir. */
export function clearSessionCaches(): void {
  wipeStorage()
  for (const fn of [...clears.keys()]) {
    try {
      const out = fn()
      // Silici söz döndürürse reddi yutulur (biri düşse de öbürleri işini yaptı).
      const thenable = out as { catch?: unknown } | null | undefined
      if (thenable && typeof thenable.catch === "function")
        (out as Promise<unknown>).catch(() => {})
    } catch {
      // Bir silici düşse de öbürleri çalışsın.
    }
  }
}

export interface SessionCacheOptions {
  /** Taze sayılma süresi (ms); yoksa oturum boyu. */
  ttlMs?: number
  /** En çok kaç anahtar (eskisi düşer — 1 = tek hesaplık yuva). */
  maxEntries?: number
  /** Kayıttaki ad (test ve tanı). */
  name?: string
}

/** `commit(value)`: değeri yazar; arada çıkış olduysa yazmaz, `false` döner. */
export type Commit<V> = (value: V) => boolean

export interface SessionCache<K, V> {
  has(key: K): boolean
  /** Taze değer ya da `undefined`; `stale: true` süresi geçmişi de verir (ilk çizim için). */
  get(key: K, opts?: { stale?: boolean }): V | undefined
  set(key: K, value: V): void
  delete(key: K): void
  /** Uçuştaki okuma ya da `undefined`. */
  pending(key: K): Promise<unknown> | undefined
  /** Aynı anahtarın uçuştaki okuması varsa (ve `share`) o döner; yoksa `load(commit)` başlar. */
  dedupe<R>(
    key: K,
    load: (commit: Commit<V>) => R | Promise<R>,
    opts?: { share?: boolean },
  ): Promise<R>
  clear(): void
}

export function createSessionCache<K = string, V = unknown>({
  ttlMs = Infinity,
  maxEntries = Infinity,
  name,
}: SessionCacheOptions = {}): SessionCache<K, V> {
  const values = new Map<K, { at: number; value: V }>()
  const pending = new Map<K, Promise<unknown>>()
  // Çıkışta artar: önceki oturumda başlamış okuma dönünce yazılmaz.
  let generation = 0
  const fresh = (hit: { at: number } | undefined): boolean =>
    Boolean(hit) && Date.now() - (hit as { at: number }).at < ttlMs

  const cache: SessionCache<K, V> = {
    has: (key) => fresh(values.get(key)),
    get(key, { stale = false } = {}) {
      const hit = values.get(key)
      return hit && (stale || fresh(hit)) ? hit.value : undefined
    },
    set(key, value) {
      values.delete(key)
      values.set(key, { at: Date.now(), value })
      while (values.size > maxEntries) values.delete(values.keys().next().value as K)
    },
    delete(key) {
      values.delete(key)
    },
    pending: (key) => pending.get(key),
    dedupe<R>(key: K, load: (commit: Commit<V>) => R | Promise<R>, { share = true } = {}) {
      if (share && pending.has(key)) return pending.get(key) as Promise<R>
      const gen = generation
      const commit: Commit<V> = (value) => {
        if (gen !== generation) return false
        cache.set(key, value)
        return true
      }
      const promise: Promise<R> = Promise.resolve(load(commit)).finally(() => {
        if (pending.get(key) === promise) pending.delete(key)
      })
      pending.set(key, promise)
      return promise
    },
    clear() {
      values.clear()
      pending.clear()
      generation += 1
    },
  }
  onSessionClear(cache.clear, name)
  return cache
}
