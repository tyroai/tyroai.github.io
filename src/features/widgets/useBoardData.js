import { useMemo } from "react"
import { useRmAccess } from "@/features/rm/data/useRmAccess"
import { useAppLock } from "@/hooks/useAuthorizations"
import { useConfig } from "@/hooks/useConfig"
import { useDailyBriefCta } from "@/hooks/useDailyBriefCta"
import { CATALOG, widgetAvailable } from "./layout"

/**
 * Panoların (Anasayfa ve Pano) ortak kancaları — aynı kurulum iki yerde kopyaydı. Takvim ve
 * toplantı yükü header'la da ortak: `useBoardCalendar.js` (ayrı dosya: header gövdesi bu
 * dosyanın asistan ve yetki kancalarını paketine çekmesin).
 */

/** Özetin sorulacağı asistan = sohbetin AÇACAĞI asistan (kilitli olmayan ilki). */
export function useBoardBriefCta() {
  const { agents } = useConfig()
  const lock = useAppLock()
  const briefAgent = lock.ready
    ? (agents.find((a) => !lock.isLocked(a.name)) ?? null)
    : (agents[0] ?? null)
  return useDailyBriefCta(briefAgent)
}

/** Kişiye açık widget kimlikleri (katalogdan, `widgetAvailable`). */
export function useAvailableWidgets(pageAccess) {
  const rmGranted = useRmAccess().state === "granted"
  return useMemo(
    () =>
      new Set(
        Object.keys(CATALOG).filter((id) =>
          widgetAvailable(id, {
            feed: pageAccess.feed,
            todo: pageAccess.todo,
            selfService: pageAccess.selfService,
            rm: rmGranted,
            tibot: pageAccess.tibot,
          }),
        ),
      ),
    [pageAccess.feed, pageAccess.todo, pageAccess.selfService, pageAccess.tibot, rmGranted],
  )
}
