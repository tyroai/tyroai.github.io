import { useMemo } from "react"
import { useConfig } from "@/hooks/useConfig"
import { catalogNameKey } from "@/lib/agentName"
import { catalogLookup } from "./appIndex"

/** Katalog araması (ad anahtarı → logo, ikon, grup) — Talepler ve Uygulamalar ortak. */
export function useCatalogLookup() {
  const { allAgents, allAiApps, allBusinessApps } = useConfig()
  return useMemo(
    () => catalogLookup({ agents: allAgents, aiApps: allAiApps, businessApps: allBusinessApps }),
    [allAgents, allAiApps, allBusinessApps],
  )
}

/** Ada göre katalog kaydı (yoksa `null`: katalog dışı ad). */
export const lookupApp = (lookup, name) => lookup.get(catalogNameKey(name)) ?? null
