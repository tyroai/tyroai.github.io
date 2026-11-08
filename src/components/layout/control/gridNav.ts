/**
 * Izgarada ok tuşuyla gezinme (saf, testli): odaktaki kutucuktan istenen yöndeki en yakın
 * komşu. Boylar farklı olduğundan sütun/satır sayısı değil EKRANDAKİ kutular kullanılır — iki
 * satırlık Tyrofy'dan sola basınca yanındaki iki kutucuktan hizalı olanı seçilir. Görsel yön
 * kullanıldığı için sağdan sola dilde de ok, gösterdiği yöne gider.
 */
export interface TileRect {
  id: string
  x: number
  y: number
  w: number
  h: number
}
export type NavDir = "up" | "down" | "left" | "right"

const KEYS: Record<string, NavDir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
}
export const navDir = (key: string): NavDir | null => KEYS[key] ?? null

/**
 * Yöndeki adaylardan: önce o eksende örtüşen (aynı satır/sütun hizasında), sonra ana eksende en
 * yakın, eşitlikte dik eksende en hizalı. Yoksa `null` (kenarda kalır, dönmez).
 */
export function neighbor(rects: readonly TileRect[], fromId: string, dir: NavDir): string | null {
  const a = rects.find((r) => r.id === fromId)
  if (!a) return null
  const horizontal = dir === "left" || dir === "right"
  let best: string | null = null
  let bestScore = Infinity
  for (const b of rects) {
    if (b.id === a.id) continue
    const gap =
      dir === "right"
        ? b.x - (a.x + a.w)
        : dir === "left"
          ? a.x - (b.x + b.w)
          : dir === "down"
            ? b.y - (a.y + a.h)
            : a.y - (b.y + b.h)
    if (gap < -1) continue
    const overlap = horizontal
      ? Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
      : Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
    const off = horizontal
      ? Math.abs(b.y + b.h / 2 - (a.y + a.h / 2))
      : Math.abs(b.x + b.w / 2 - (a.x + a.w / 2))
    const score = (overlap > 1 ? 0 : 1e6) + Math.max(0, gap) * 4 + off
    if (score < bestScore) {
      bestScore = score
      best = b.id
    }
  }
  return best
}
