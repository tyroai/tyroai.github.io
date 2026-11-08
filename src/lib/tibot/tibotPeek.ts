/**
 * Ticket Talepler'in header yüzü ve çentik göstergesi için TEK özet (bağımlılıksız: tepsi ve çentik
 * Ticket'un ağır parçasını indirmeden okur). `tibotApi` liste her geldiğinde yazar; liste bu
 * oturumda okunmadıysa `null` (yüz yalnız ikon).
 */
import { useSyncExternalStore } from "react"

export interface TibotPeek {
  /** Bana atanan açık talep sayısı (Xurrent'teki toplam). */
  assigned: number
  /** Bana atanan ve hedefi geçmiş (yüklenen sayfadan). */
  late: number
  /** Beklediğim: açtığım ya da adıma açılan açık talepler. */
  waiting: number
  /** Beklediklerimden benden yanıt bekleyenler. */
  needsMe: number
}

let peek: TibotPeek | null = null
const listeners = new Set<() => void>()

export function setTibotPeek(next: TibotPeek | null) {
  const same =
    next === peek ||
    (next &&
      peek &&
      next.assigned === peek.assigned &&
      next.late === peek.late &&
      next.waiting === peek.waiting &&
      next.needsMe === peek.needsMe)
  if (same) return
  peek = next
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useTibotPeek(): TibotPeek | null {
  return useSyncExternalStore(
    subscribe,
    () => peek,
    () => null,
  )
}
