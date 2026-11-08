import { useAppLock, useMyPendingRequests } from "@/hooks/useAuthorizations"
import { useConfig } from "@/hooks/useConfig"
import { appliesTo } from "@/lib/appLockPolicy"

export const ACCESS_GROUPS = [
  { kind: "agent", key: "agents", labelKey: "settings.catalog.tab.agents" },
  { kind: "aiApp", key: "aiApps", labelKey: "settings.catalog.tab.aiApps" },
  { kind: "businessApp", key: "businessApps", labelKey: "settings.catalog.tab.businessApps" },
]

/**
 * Katalogdaki her öğenin BU oturumdaki durumu (open · pending · locked · checking): kilit yalnız
 * asistan ve AI ürününde (`appliesTo`); iş uygulaması herkese açık. Erişim bölümü ve telefon
 * kökündeki önizleme aynı okumadan.
 */
export function useAccessGroups() {
  const config = useConfig()
  const lock = useAppLock()
  const pending = useMyPendingRequests(lock.enabled)
  const stateOf = (item, kind) => {
    if (!lock.enabled || !appliesTo(kind)) return "open"
    if (!lock.ready) return "checking"
    if (!lock.isLocked(item.name)) return "open"
    return pending.isPending(item.name) ? "pending" : "locked"
  }
  return ACCESS_GROUPS.map((g) => ({
    ...g,
    items: (config[g.key] ?? []).map((item) => ({ item, state: stateOf(item, g.kind) })),
  })).filter((g) => g.items.length > 0)
}
