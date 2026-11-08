/**
 * Döngü sigortası. Aynı istek kısa sürede olağan dışı sık tekrarlanıyorsa (bir kancanın kendi
 * cevabıyla kendini yeniden tetiklemesi gibi) durdurulur: gözden kaçan bir döngü Graph'ı boğup
 * kullanıcının — ve aynı uygulama kimliğiyle bütün kiracının — kısıtlanmasına yol açmasın.
 *
 * - Sınır: aynı yöntem + adres + gövde 1 dakikada 20'den fazla. Gerçek akışlarda aynı isteğin
 *   bu sıklıkta tekrarı yok (sayfalama adres değiştirir, yeniden deneme tek çağrının içinde).
 * - Durdurulan çağrı da sayılır: döngü sürdükçe sigorta kapalı kalır, durunca pencere boşalır.
 * - Bellekte yalnız özet (FNV-1a) tutulur, adres değil; uyarıdaki yolda kimlik ve adresler gizli
 *   (kişisel veri loglanmaz).
 */
export const LOOP_WINDOW_MS = 60_000
export const LOOP_MAX = 20

const hits = new Map<number, number[]>()
const warned = new Set<number>()

function fnv1a(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Uyarı için yol: sorgu atılır, kimlik ve adres parçaları `:id` olur. */
export function maskPath(url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0]
  return path
    .split("/")
    .map((seg) =>
      /@|%40/.test(seg) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(seg) ||
      (seg.length >= 12 && /[0-9=]/.test(seg))
        ? ":id"
        : seg,
    )
    .join("/")
}

/** Bu çağrı durdurulmalı mı? Her çağrıda bir kez çağrılır (yeniden denemeler sayılmaz). */
export function loopTripped(method: string, url: string, body: unknown, now = Date.now()): boolean {
  const key = fnv1a(`${method} ${url} ${body === undefined ? "" : JSON.stringify(body)}`)
  const recent = (hits.get(key) ?? []).filter((t) => now - t < LOOP_WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 500) {
    for (const [k, list] of hits) if (now - list[list.length - 1] >= LOOP_WINDOW_MS) hits.delete(k)
  }
  if (recent.length <= LOOP_MAX) return false
  if (!warned.has(key)) {
    warned.add(key)
    console.warn(
      `[graph] döngü sigortası: aynı istek 1 dakikada ${recent.length} kez — durduruldu: ${method} ${maskPath(url)}`,
    )
  }
  return true
}

/** Testler için. */
export function resetLoopGuard(): void {
  hits.clear()
  warned.clear()
}
