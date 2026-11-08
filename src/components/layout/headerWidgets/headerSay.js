import { useSyncExternalStore } from "react"

/**
 * Header'daki widget pencerelerinin duyurusu (görünüm, renk): pencere kapanınca da kalan canlı
 * bölge tepsinin kökünde (`HeaderWidgets`). Aynı metin yeniden duyurulsun diye sıfır genişlikli
 * boşlukla değişir.
 */
let said = ""
const subs = new Set()

export function sayInHeader(text) {
  said = said === text ? `${text}\u200b` : text
  for (const fn of subs) fn()
}

function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const useHeaderSay = () =>
  useSyncExternalStore(
    subscribe,
    () => said,
    () => "",
  )
