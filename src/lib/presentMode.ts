import { useSyncExternalStore } from "react"

/**
 * Sunum modu (Denetim Merkezi'nden): ekran paylaşırken kişisel bilgiler — `data-private` işaretli
 * öğeler (posta, toplantı adları, İK rakamları, notlar) — bulanıklaşır, kendiliğinden gelen
 * bildirimler çıkmaz. Kök öğede `data-present` (kurallar `styles/private.css`). Sekmeye özel
 * (`sessionStorage`): sayfa yenilenince sürer, sekme kapanınca kalkar — ertesi gün bulanık bir
 * ekranla karşılaşılmaz.
 */
const KEY = "tyro-present-mode-v1"

function read(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

let on = typeof window === "undefined" ? false : read()
const subs = new Set<() => void>()

function apply() {
  if (typeof document === "undefined") return
  document.documentElement.toggleAttribute("data-present", on)
}

apply()

export function setPresentMode(next: boolean) {
  if (next === on) return
  on = next
  try {
    if (on) sessionStorage.setItem(KEY, "1")
    else sessionStorage.removeItem(KEY)
  } catch {
    // Depo kapalı: mod bu sayfada sürer.
  }
  apply()
  for (const fn of subs) fn()
}

/** Şu an açık mı (kanca dışında: bildirim kapıları). */
export const presentModeOn = (): boolean => on

function subscribe(fn: () => void) {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}

export const usePresentMode = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => on,
    () => false,
  )
