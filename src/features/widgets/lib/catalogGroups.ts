import { fold } from "@/lib/fold"

/**
 * Widget kataloğunun bölümleri — her widget ne işe yaradığına göre TEK bölümde. Sıra = katalogdaki
 * sıra; bölümün adı `widgets.group.<kimlik>`. Kayıt defterindeki her widget'ın bir bölümü olduğu
 * testli (`catalogGroups.test.js`): yeni widget eklenince buraya da yazılır.
 */
export const CATALOG_GROUPS = [
  {
    id: "day",
    ids: ["brief", "focus", "planner", "focus-window", "focus-timer", "horizon"],
  },
  {
    id: "time",
    ids: ["next-meeting", "rhythm", "world-clock", "common-time", "holiday", "travel", "outcomes"],
  },
  {
    id: "mail",
    ids: ["pending-mail", "recent-files", "saved-search", "onenote", "sticky", "feed-picks"],
  },
  { id: "team", ids: ["team-today", "leave-balance", "requests", "rm-pulse"] },
  // Ticket (Xurrent talepleri) kendi bölümünde; kitle dışında boş kalır, bölüm hiç çizilmez.
  {
    id: "tibot",
    ids: ["tibot-rings", "tibot-summary", "tibot-rhythm", "tibot-intro"],
  },
  { id: "markets", ids: ["market", "tyro-fx", "trader", "report-day", "region-weather"] },
  { id: "tyro", ids: ["ask", "help", "tyro-translate"] },
  {
    id: "ambient",
    ids: ["weather", "weather-plain", "intro", "tyro-radio-stage", "tyro-radio-disc"],
  },
] as const

export type CatalogGroupId = (typeof CATALOG_GROUPS)[number]["id"]

const GROUP_OF: Record<string, CatalogGroupId> = Object.fromEntries(
  CATALOG_GROUPS.flatMap((g) => g.ids.map((id) => [id, g.id])),
)

/** Widget'ın bölümü; listede yoksa (yeni widget, test yakalar) "day". */
export const groupOf = (id: string): CatalogGroupId => GROUP_OF[id] ?? "day"

/** Katlanmış arama metni: Türkçe duyarsız, aksansız ("gorusme" → "Görüşme"). */
const foldAll = (s: string) =>
  fold(s)
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")

/**
 * Aramaya uyan widget'lar: sorgunun her sözcüğü widget'ın metinlerinden (ad, açıklama, ⓘ metni,
 * bölümün adı — çağıranın dilinde) birinde geçmeli. Boş sorgu hepsini döndürür; sıra korunur.
 */
export function searchCatalog(
  ids: readonly string[],
  query: string,
  textOf: (id: string) => string,
): string[] {
  const words = foldAll(query).split(/\s+/).filter(Boolean)
  if (!words.length) return [...ids]
  return ids.filter((id) => {
    const hay = foldAll(textOf(id))
    return words.every((w) => hay.includes(w))
  })
}

/** Bölümlere ayır: boş bölüm düşer, bölüm içi sıra katalog sırası (`CATALOG_GROUPS`). */
export function groupCatalog(ids: readonly string[]): { id: CatalogGroupId; ids: string[] }[] {
  const order = new Map<string, number>()
  CATALOG_GROUPS.forEach((g) => g.ids.forEach((id, i) => order.set(id, i)))
  return CATALOG_GROUPS.map((g) => ({
    id: g.id,
    ids: ids
      .filter((id) => groupOf(id) === g.id)
      .sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99)),
  })).filter((g) => g.ids.length)
}
