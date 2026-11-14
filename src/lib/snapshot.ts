/**
 * ANLIK GÖRÜNTÜ — Anasayfa kartlarının son hâli tarayıcıda (önce göster, arkada tazele). Sayfa
 * açılınca kart son bilinen veriyle hemen dolar, kanca her zamanki gibi yeniden okur ve gelen cevap
 * kartı sessizce günceller. Microsoft yavaşken kart iskelette beklemez.
 *
 * Kişisel veri olduğu için sınırlar (ADR 0012):
 * - Hesaba bağlı: kayıt hesabın kimliğinin özetini taşır; başka hesapta okunmaz.
 * - Yalnız aynı gün: dünün görüntüsü gösterilmez (toplantılar, görevler, posta "bugün" sorusu).
 * - Gövde yok: çağıran yalnız kartın gösterdiği alanları verir (posta/toplantı önizlemesi değil).
 * - Çıkışta silinir: `tyro-snap-` öneki `PERSONAL_STORAGE`ta; "Bu tarayıcıda saklananlar"da görünür.
 * - Boyut sınırı: büyük görüntü yazılmaz (depo dolmasın, açılışta ayrıştırma pahalı olmasın).
 */
const PREFIX = "tyro-snap-v1:"
const MAX_CHARS = 200_000

function fnv1a(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** Yerel takvim günü (UTC değil). */
function dayOf(at: number): string {
  const d = new Date(at)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

interface Stored<T> {
  who: string
  day: string
  at: number
  value: T
}

function store(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Son görüntü ya da `null`. `account`: hesabın kimliği (ham kimlik depoya yazılmaz, özeti
 * karşılaştırılır). `revive`: JSON'da kaybolan türleri (tarih) geri kurar.
 */
export function readSnapshot<T>(
  name: string,
  account: string | null | undefined,
  {
    revive,
    now = Date.now(),
    maxAgeMs,
  }: { revive?: (value: T) => T; now?: number; maxAgeMs?: number } = {},
): { at: number; value: T } | null {
  if (!account) return null
  try {
    const raw = store()?.getItem(PREFIX + name)
    if (!raw) return null
    const saved = JSON.parse(raw) as Stored<T>
    if (saved?.who !== fnv1a(account)) return null
    // Varsayılan: yalnız aynı gün. Kişisel içerik taşımayan özet (`maxAgeMs`) daha uzun yaşar.
    const fresh = maxAgeMs != null ? now - saved.at <= maxAgeMs : saved.day === dayOf(now)
    if (!fresh) return null
    return { at: saved.at, value: revive ? revive(saved.value) : saved.value }
  } catch {
    return null
  }
}

/** Görüntüyü yazar; depo kapalıysa, doluysa ya da görüntü büyükse sessizce vazgeçer. */
export function writeSnapshot<T>(
  name: string,
  account: string | null | undefined,
  value: T,
  now = Date.now(),
): void {
  if (!account) return
  try {
    const text = JSON.stringify({ who: fnv1a(account), day: dayOf(now), at: now, value })
    if (text.length > MAX_CHARS) {
      // Yalnız boyut (içerik değil): sınır aşılıyorsa tanı için.
      console.info(`[snapshot] ${name}: ${Math.round(text.length / 1024)} KB, sınır aşıldı`)
      store()?.removeItem(PREFIX + name)
      return
    }
    store()?.setItem(PREFIX + name, text)
  } catch {
    // Depo dolu ya da kapalı: kart yine ağdan dolar.
  }
}

/** Tarih alanlarını (ISO metni) `Date`e çevirir; geçersiz olan `null`. */
export function reviveDates<O extends Record<string, unknown>>(item: O, keys: (keyof O)[]): O {
  const out: Record<string, unknown> = { ...item }
  for (const k of keys) {
    const v = item[k]
    if (typeof v === "string") {
      const d = new Date(v)
      out[k as string] = Number.isNaN(d.getTime()) ? null : d
    }
  }
  return out as O
}
