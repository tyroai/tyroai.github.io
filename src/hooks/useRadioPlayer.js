import { useSyncExternalStore } from "react"
import { getRadioState, subscribeRadio } from "@/lib/radioPlayer"

/**
 * Çaların anlık durumu (`lib/radioPlayer.js`) — header hapı ve widget aynı kaynağı okur.
 * Ayrı dosya: hap her sayfada (ana pakette); istasyon ve yer kodu yalnız widget'la iner.
 */
export function useRadioPlayer() {
  return useSyncExternalStore(subscribeRadio, getRadioState, getRadioState)
}
