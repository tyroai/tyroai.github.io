import { useSyncExternalStore } from "react"
import { draftKinds, subscribeDrafts } from "@/lib/requestDrafts"

const none = () => ""

/** Taslağı olan talep türleri ("expense,leave"): Yeni menüsünün "taslak" işareti. */
export const useDraftKinds = () => useSyncExternalStore(subscribeDrafts, draftKinds, none)
