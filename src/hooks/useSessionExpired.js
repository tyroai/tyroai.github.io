import { useSyncExternalStore } from "react"
import { isSessionExpired, subscribeSession } from "@/lib/sessionHealth"

/** Oturumun süresi doldu mu (`lib/sessionHealth`); doldu/yenilendi anında bütün dinleyenler güncellenir. */
export function useSessionExpired() {
  return useSyncExternalStore(subscribeSession, isSessionExpired, () => false)
}
