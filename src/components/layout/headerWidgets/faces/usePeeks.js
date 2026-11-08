import { useSyncExternalStore } from "react"
import { useMsal } from "@azure/msal-react"
import { peekFocusTasks, watchFocusTasks } from "@/hooks/useFocusTasks"
import { localDayKey } from "@/lib/todo"
import { peekWidget, watchWidgetCache } from "@/lib/widgetCache"
import { useBoardCalendar } from "@/features/widgets/useBoardCalendar"

/**
 * Tepsi yüzlerinin verisi — YALNIZ elde olandan, tepsi yeni istek atmaz:
 * - bugünün odağı: `useFocusTasks`ın bellekteki son okuması (bu kişinin, bugünün);
 * - bir widget'ın son okuması (`useWidgetData` önbelleği, ör. bekleyen postalar);
 * - takvim: çentiğin ve Anasayfa'nın AYNI anahtarı (Graph'a ikinci kez gidilmez).
 */
export function useFocusPeek() {
  const { accounts } = useMsal()
  const key = accounts[0]?.homeAccountId ?? null
  const snap = useSyncExternalStore(watchFocusTasks, peekFocusTasks, () => null)
  return snap && key && snap.key === key && snap.day === localDayKey() ? snap.tasks : null
}

export function useWidgetPeek(name) {
  const { accounts } = useMsal()
  const id = accounts[0]?.homeAccountId ?? null
  const value = useSyncExternalStore(
    watchWidgetCache,
    () => (id ? peekWidget(`${id}:${name}:`) : null),
    () => null,
  )
  return value?.data ?? null
}

export function useTrayCalendar() {
  return useBoardCalendar().cal
}
