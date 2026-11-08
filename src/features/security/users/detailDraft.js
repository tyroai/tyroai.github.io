import { catalogNameKey } from "@/lib/agentName"

/**
 * Ayrıntıdaki uygulama taslağı: seçili liste (taslak bu kişiye aitse taslak, değilse kayıt) ve
 * kayıttan farklı mı (`dirty` → kaydet şeridi). Sıra farkı değişiklik sayılmaz.
 */
export function draftState(ctx, row) {
  const picked = ctx.draft.id === row.id ? ctx.draft.apps : row.apps
  const keys = new Set(picked.map(catalogNameKey))
  const dirty =
    picked.length !== row.apps.length || row.apps.some((a) => !keys.has(catalogNameKey(a)))
  return { picked, dirty }
}
