import { CHANGELOG_INDEX } from "@/data/changelogIndex"
import { hasIdIn, latestIdIn, sinceIn, visibleIn } from "@/data/changelogRules"

// Arşivin (`@/data/changelog`, ~56 KB gz) yardımcılarıyla AYNI adlar ve kurallar, ama dizin üzerinde
// (~3,5 KB gz): açılışta karar veren yerler (Yenilikler penceresi, okunmamış rozeti) arşivi indirmez.
// Kayıtlarda metin yok — çizilecekse arşiv `loadEntries` ile iner.

export const visibleEntries = (opts) => visibleIn(CHANGELOG_INDEX, opts)
export const latestEntryId = latestIdIn
export const hasEntry = (id) => hasIdIn(CHANGELOG_INDEX, id)
export const entriesSince = (seenId, entries) => sinceIn(CHANGELOG_INDEX, seenId, entries)

/** Dizin kayıtlarının metinli hâli (arşiv tembel iner); sıra korunur, arşivde olmayan düşer. */
export async function loadEntries(items) {
  const { CHANGELOG } = await import("@/data/changelog")
  const byId = new Map(CHANGELOG.map((e) => [e.id, e]))
  return items.map((e) => byId.get(e.id)).filter(Boolean)
}
