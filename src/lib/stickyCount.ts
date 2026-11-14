/**
 * Yapışkan notların yüzü için TEK özet: sayı + son notların renkleri (bağımlılıksız: çentiğin ve
 * tepsinin kâğıt destesi notların ağır parçasını indirmeden okur). `stickyStore` yazar; liste bu
 * oturumda okunmadıysa `null` (yüz kendisi istek atmaz).
 */
import { useSyncExternalStore } from "react"

export interface StickyPeek {
  count: number
  /** En yeni önce, en çok üç not: rengi ve kimliği (yeni not gelince deste düşüşü için). */
  top: { id: string; color: string }[]
}

let peek: StickyPeek | null = null
const listeners = new Set<() => void>()

export function setStickyPeek(next: StickyPeek | null) {
  const same =
    next === peek ||
    (next &&
      peek &&
      next.count === peek.count &&
      next.top.length === peek.top.length &&
      next.top.every((x, i) => x.id === peek!.top[i].id && x.color === peek!.top[i].color))
  if (same) return
  peek = next
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Bellekteki son özet (istek atmaz). */
export const currentStickyPeek = (): StickyPeek | null => peek

export function useStickyPeek(): StickyPeek | null {
  return useSyncExternalStore(
    subscribe,
    () => peek,
    () => null,
  )
}

export function useStickyCount(): number | null {
  return useStickyPeek()?.count ?? null
}
