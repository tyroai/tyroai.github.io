import { useSyncExternalStore } from "react"
import {
  defaultLayout,
  readPageLayout,
  subscribePageLayout,
  type LayoutId,
  type LayoutPage,
} from "@/lib/pageLayout"

/** Sayfanın seçili düzeni (Profil › Görünüm); seçim değişince yeniden çizer. */
export function useLayoutChoice<P extends LayoutPage>(page: P): LayoutId<P> {
  return useSyncExternalStore(
    subscribePageLayout,
    () => readPageLayout(page),
    () => defaultLayout(page),
  )
}
