import { useSyncExternalStore } from "react"
import { pwaSnapshot, subscribePwa } from "@/lib/pwaInstall"

/** `{ canPrompt, installed, ios }` — bkz. `lib/pwaInstall.js`. */
export function usePwaInstall() {
  return useSyncExternalStore(subscribePwa, pwaSnapshot, pwaSnapshot)
}
