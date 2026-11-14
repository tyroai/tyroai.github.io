import { useSyncExternalStore } from "react"

/**
 * Telefondaki karşılama çekmecesi açık mı (`myspace/welcome`). Açıkken kendiliğinden gelen
 * pencereler (toplantı geri sayımı, girişteki Yenilikler) bekler, çekmece kapanınca gelir: modal bir pencere sayfanın
 * gerisini dokunmaya kapatıyor, çekmece de onun altında kalıp donuyordu (ürün sahibi: "karşılama
 * penceresi çıktığında en aktif o olmalı").
 */
let open = false
const subs = new Set<() => void>()

export function setWelcomeOpen(value: boolean): void {
  if (open === value) return
  open = value
  for (const fn of subs) fn()
}

function subscribe(fn: () => void): () => void {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}

/** Karşılama çekmecesi açıkken `true`. */
export function useWelcomeOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  )
}
